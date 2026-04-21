/**
 * Cloud Function principal — procesarJornadaGP.
 * Orquesta el cálculo de puntos de todos los participantes de todas las ligas
 * tras finalizar un Gran Premio, usando datos reales de OpenF1.
 *
 * Flujo:
 *  1. Detecta el último GP finalizado de la temporada.
 *  2. Comprueba idempotencia (colección 'jornadas').
 *  3. Recopila datos de OpenF1 (qualy, carrera, condiciones).
 *  4. Para cada participación con garaje no vacío:
 *     a. Calcula factores por piloto según variante + actuación real.
 *     b. Calcula puntos del garaje (pilotos + coche).
 *     c. Aplica sinergias.
 *     d. Suma los puntos al acumulado del participante.
 *  5. Escribe todo en batch (participaciones + documento de jornada).
 *
 * @module index
 */

const { onRequest } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')

const {
  recopilarDatosGranPremio,
  obtenerUltimoGranPremioFinalizado,
} = require('./servicioOpenF1Server')
const { calcularPuntuacionGaraje, calcularFactorJornada } = require('./puntuacionServer')
const { calcularSinergias, aplicarSinergia } = require('./sinergiaServer')
const {
  cargarCatalogo,
  invalidarCacheCatalogo,
  seleccionarCartasDiarias,
} = require('./mercadoServer')
const { construirCatalogoCompleto } = require('./data/catalogoBase')

initializeApp()
const db = getFirestore()

const TEMPORADA_ACTUAL = 2026

/* ─── Utilidades internas ───────────────────────────────────────────────── */

/**
 * Extrae el número de piloto y la variante a partir del ID de carta.
 * @param {string} idCarta - Ej: '1_qualy', '44_carrera', '3_todo_terreno'.
 * @returns {{ numero: string, variante: string }}
 */
function descomponerIdCarta(idCarta) {
  const partes = idCarta.split('_')
  const numero = partes[0]
  const variante = partes.slice(1).join('_')
  return { numero, variante }
}

/**
 * Construye el mapa de factores por ID de carta de piloto.
 * Usa los datos reales de OpenF1 y la variante de cada piloto del garaje.
 * @param {Array} pilotos - Pilotos del garaje del participante.
 * @param {Object} actuacionesPorPiloto - { numeroPiloto: { posicionQualy, posicionCarrera, posicionSalida } }
 * @param {Object} condiciones - { llovio, numeroDNFs, numeroSafetyCarActivos, numeroVirtualSafetyCarActivos }
 * @returns {{ factores: Object, detalles: Object }}
 */
function construirFactoresPorPiloto(pilotos, actuacionesPorPiloto, condiciones) {
  const factores = {}
  const detalles = {}

  for (const piloto of pilotos) {
    const { numero, variante } = descomponerIdCarta(piloto.id)
    const actuacion = actuacionesPorPiloto[numero] || {
      posicionQualy: 20,
      posicionCarrera: 20,
      posicionSalida: 20,
    }

    factores[piloto.id] = calcularFactorJornada(actuacion, condiciones, variante)
    detalles[piloto.id] = { variante, actuacion }
  }

  return { factores, detalles }
}

/* ─── Cloud Function ────────────────────────────────────────────────────── */

/**
 * Cloud Function programada — procesa la jornada del último GP finalizado.
 * Se ejecuta cada lunes a las 02:00 UTC, una vez concluido el fin de semana de F1.
 * Es idempotente: si la jornada ya fue procesada, no repite cálculos.
 */
exports.procesarJornadaSemanal = onSchedule(
  {
    schedule: 'every monday 02:00',
    timeZone: 'UTC',
    region: 'europe-west1',
  },
  async () => {
    const granPremio = await obtenerUltimoGranPremioFinalizado(TEMPORADA_ACTUAL)
    if (!granPremio) {
      console.log('[Jornada] No hay Gran Premio finalizado para procesar.')
      return
    }

    const idJornada = `gp_${granPremio.meeting_key}`
    const jornadaExistente = await db.collection('jornadas').doc(idJornada).get()
    if (jornadaExistente.exists) {
      console.log(`[Jornada] ${idJornada} ya fue procesada previamente. Omitida.`)
      return
    }

    const { actuacionesPorPiloto, condiciones } = await recopilarDatosGranPremio(
      granPremio.meeting_key,
    )

    const todasParticipaciones = await db.collection('participaciones').get()
    const batch = db.batch()
    let participacionesProcesadas = 0
    const desgloseJornada = []

    for (const documento of todasParticipaciones.docs) {
      const participacion = documento.data()
      const garaje = participacion.garaje

      const pilotosEquipados = garaje
        ? (garaje.pilotos || []).filter((p) => p.equipado !== false)
        : []

      if (!garaje || pilotosEquipados.length === 0) {
        continue
      }

      const { factores: factoresPorPiloto, detalles: detallesPorPiloto } =
        construirFactoresPorPiloto(pilotosEquipados, actuacionesPorPiloto, condiciones)

      const resultadoGaraje = calcularPuntuacionGaraje(garaje, factoresPorPiloto)

      for (const pilotoDesglose of resultadoGaraje.desglose.pilotos) {
        const detalle = detallesPorPiloto[pilotoDesglose.id]
        if (detalle) {
          pilotoDesglose.variante = detalle.variante
          pilotoDesglose.actuacion = detalle.actuacion
        }
      }

      const { multiplicadorTotal } = calcularSinergias(garaje)
      const puntosJornada = aplicarSinergia(resultadoGaraje.puntosTotal, multiplicadorTotal)

      const puntosAcumulados = (participacion.puntos || 0) + puntosJornada

      const desgloseParticipante = {
        nombreGranPremio: granPremio.meeting_name,
        fechaProcesamiento: new Date().toISOString(),
        puntosJornada,
        multiplicadorSinergia: multiplicadorTotal,
        condiciones,
        desglose: resultadoGaraje.desglose,
      }

      batch.update(documento.ref, {
        puntos: puntosAcumulados,
        ultimaJornada: desgloseParticipante,
      })

      desgloseJornada.push({
        participacionId: documento.id,
        emailUsuario: participacion.email_usuario,
        idLiga: participacion.id_liga,
        puntosJornada,
        puntosAcumulados,
        multiplicadorSinergia: multiplicadorTotal,
        desglose: resultadoGaraje.desglose,
      })

      participacionesProcesadas++
    }

    batch.set(db.collection('jornadas').doc(idJornada), {
      meetingKey: granPremio.meeting_key,
      nombreGranPremio: granPremio.meeting_name,
      fechaProcesamiento: new Date().toISOString(),
      temporada: TEMPORADA_ACTUAL,
      participacionesProcesadas,
      condiciones,
      desglose: desgloseJornada,
    })

    await batch.commit()

    console.log(
      `[Jornada] ${idJornada} (${granPremio.meeting_name}) procesada. ${participacionesProcesadas} participaciones.`,
    )
  },
)

/* ═══════════════════════════════════════════════════════════════════════════
   MERCADO DIARIO — Generación automática de cartas disponibles cada día.
   ═══════════════════════════════════════════════════════════════════════════

   Flujo:
   1. Se ejecuta diariamente a las 06:00 UTC (Cloud Scheduler).
   2. Para CADA liga existente, genera un mercado independiente.
   3. Selecciona una muestra aleatoria diaria (8 pilotos, 2 coches, 8 potenciadores).
   4. Cierra el mercado del día anterior de esa liga (si existe).
   5. Crea un nuevo documento en 'mercados/{idLiga}_{YYYY-MM-DD}' con estado 'abierto'.

   Esquema Firestore → mercados/{idLiga}_{YYYY-MM-DD}:
   {
     idLiga: string,
     estado: 'abierto' | 'cerrado',
     fechaApertura: string (ISO),
     fechaCierre: string (ISO),   ← siguiente día a las 06:00 UTC
     totalCartas: 18,
     cartas: [ { id, nombre, tipoCarta, precio, imagen, ... } ]
   }
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Calcula el ID del mercado para una liga y una fecha.
 * Formato: '{idLiga}_{YYYY-MM-DD}' para mercados diarios por liga.
 * @param {string} idLiga
 * @param {Date} fecha
 * @returns {string} Ej: 'xi060FGM9iG33KvBuBQv_2026-04-14'
 */
function calcularIdMercado(idLiga, fecha) {
  const fechaStr = fecha.toISOString().split('T')[0]
  return `${idLiga}_${fechaStr}`
}

/**
 * Calcula la fecha de cierre del mercado: el día siguiente a las 06:00 UTC.
 * @param {Date} fechaApertura
 * @returns {Date}
 */
function calcularFechaCierre(fechaApertura) {
  const cierre = new Date(fechaApertura)
  cierre.setUTCDate(cierre.getUTCDate() + 1)
  cierre.setUTCHours(6, 0, 0, 0)
  return cierre
}

/**
 * Resuelve todas las pujas de un mercado cerrado.
 * Para cada carta con pujas, la mayor puja gana: se añade la carta al garaje
 * del ganador y se le descuenta el importe del presupuesto.
 * Respeta los límites del garaje: máx. 1 coche y 2 pilotos.
 * @param {string} idMercado - ID del mercado cuyas pujas se resuelven.
 */
async function resolverPujasMercado(idMercado) {
  const pujasSnapshot = await db.collection('mercados').doc(idMercado).collection('pujas').get()

  if (pujasSnapshot.empty) return

  /* Leer el documento del mercado para obtener los datos completos de cada carta */
  const mercadoSnap = await db.collection('mercados').doc(idMercado).get()
  const cartasMercado = mercadoSnap.exists ? mercadoSnap.data().cartas || [] : []
  const mapaCartas = {}
  for (const carta of cartasMercado) {
    mapaCartas[carta.id] = carta
  }

  /* Agrupar pujas por idCarta y encontrar la mayor de cada una */
  const pujasPorCarta = {}
  for (const doc of pujasSnapshot.docs) {
    const puja = doc.data()
    const actual = pujasPorCarta[puja.idCarta]
    if (!actual || puja.cantidad > actual.cantidad) {
      pujasPorCarta[puja.idCarta] = puja
    }
  }

  /* ── Agrupar cartas ganadas por participante para evitar sobrescrituras en el batch ── */
  const cartasPorParticipante = {}
  for (const [idCarta, pujaGanadora] of Object.entries(pujasPorCarta)) {
    const { idParticipante } = pujaGanadora
    if (!cartasPorParticipante[idParticipante]) {
      cartasPorParticipante[idParticipante] = []
    }
    cartasPorParticipante[idParticipante].push({ idCarta, pujaGanadora })
  }

  const batch = db.batch()

  for (const [idParticipante, cartasGanadas] of Object.entries(cartasPorParticipante)) {
    const participacionRef = db.collection('participaciones').doc(idParticipante)
    const participacionSnap = await participacionRef.get()
    if (!participacionSnap.exists) continue

    const participacion = participacionSnap.data()
    let presupuestoRestante = participacion.presupuesto || 0

    const garaje = participacion.garaje || {
      coches: [],
      pilotos: [],
      potenciadores: [],
      ruedas: null,
    }

    /* Migrar formato antiguo (coche singular) al nuevo (coches array) */
    if (garaje.coche !== undefined || !garaje.coches) {
      garaje.coches = garaje.coche ? [garaje.coche] : []
      delete garaje.coche
    }

    /* Resolver nombre del usuario una sola vez por participante */
    const emailUsuario = participacion.email_usuario
    let nombreUsuario = emailUsuario
    try {
      const usuarioSnap = await db.collection('usuarios').doc(emailUsuario).get()
      if (usuarioSnap.exists) {
        const datosUsuario = usuarioSnap.data()
        nombreUsuario = datosUsuario.username || datosUsuario.nombre || emailUsuario
      }
    } catch (_) {
      /* si falla la lectura del nombre, usamos el email */
    }

    for (const { idCarta, pujaGanadora } of cartasGanadas) {
      const { cantidad, tipoCarta } = pujaGanadora

      if (cantidad > presupuestoRestante) continue

      const cartaCompleta = mapaCartas[idCarta]
      const propiedadesClausula = {
        clausulaInvertida: 0,
        fechaAdquisicion: new Date().toISOString(),
      }
      const cartaGanada = cartaCompleta
        ? {
            ...cartaCompleta,
            tipo: tipoCarta,
            instancia_id: Date.now() + Math.random(),
            ...propiedadesClausula,
          }
        : {
            id: idCarta,
            nombre: pujaGanadora.nombreCarta,
            tipoCarta,
            tipo: tipoCarta,
            precio: pujaGanadora.precioCarta,
            instancia_id: Date.now() + Math.random(),
            ...propiedadesClausula,
          }

      if (tipoCarta === 'coche') {
        const hayEquipado = garaje.coches.some((c) => c.equipado)
        garaje.coches.push({ ...cartaGanada, equipado: !hayEquipado })
      } else if (tipoCarta === 'piloto') {
        const pilotosEquipados = (garaje.pilotos || []).filter((p) => p.equipado).length
        garaje.pilotos = [
          ...(garaje.pilotos || []),
          { ...cartaGanada, equipado: pilotosEquipados < 2 },
        ]
      } else if (tipoCarta === 'potenciador') {
        garaje.potenciadores = [...(garaje.potenciadores || []), cartaGanada]
      }

      presupuestoRestante -= cantidad

      const nombreCarta = cartaGanada.nombre || pujaGanadora.nombreCarta
      batch.create(db.collection('actividad').doc(), {
        idLiga: participacion.id_liga,
        nombreUsuario,
        tipo: 'compra',
        descripcion: `ha ganado la puja por ${tipoCarta} ${nombreCarta} por ${cantidad}M`,
        fecha: FieldValue.serverTimestamp(),
      })
    }

    batch.update(participacionRef, {
      presupuesto: presupuestoRestante,
      garaje,
    })
  }

  await batch.commit()
}

/**
 * Genera el mercado diario para UNA liga específica.
 * Crea un documento en 'mercados/{idLiga}_{YYYY-MM-DD}'.
 * Es idempotente: si el mercado de hoy ya existe para esa liga, no lo recrea.
 * @param {string} idLiga - ID de la liga en Firestore.
 * @returns {Promise<Object>} Resultado con el ID del mercado y el total de cartas.
 */
async function ejecutarGeneracionMercadoParaLiga(idLiga) {
  const ahora = new Date()
  const idMercadoHoy = calcularIdMercado(idLiga, ahora)

  /* ── Idempotencia: si el mercado de hoy ya existe para esta liga, no lo recreamos ── */
  const mercadoExistente = await db.collection('mercados').doc(idMercadoHoy).get()
  if (mercadoExistente.exists) {
    return {
      mensaje: `El mercado ${idMercadoHoy} ya fue generado previamente.`,
      idMercado: idMercadoHoy,
      omitido: true,
    }
  }

  /* ── Cerrar el mercado del día anterior de esta liga (si existe y sigue abierto) ── */
  const ayer = new Date(ahora)
  ayer.setUTCDate(ayer.getUTCDate() - 1)
  const idMercadoAyer = calcularIdMercado(idLiga, ayer)
  const mercadoAyer = await db.collection('mercados').doc(idMercadoAyer).get()

  if (mercadoAyer.exists && mercadoAyer.data().estado === 'abierto') {
    await resolverPujasMercado(idMercadoAyer)
    await db.collection('mercados').doc(idMercadoAyer).update({ estado: 'cerrado' })
  }

  /* ── Cargar catálogo desde Firestore (cache de instancia) y seleccionar cartas del día ── */
  const catalogo = await cargarCatalogo(db)
  const cartasDelDia = seleccionarCartasDiarias(catalogo)

  /* ── Crear documento del mercado de hoy para esta liga ── */
  const fechaApertura = ahora
  const fechaCierre = calcularFechaCierre(ahora)

  await db.collection('mercados').doc(idMercadoHoy).set({
    idLiga,
    estado: 'abierto',
    fechaApertura: fechaApertura.toISOString(),
    fechaCierre: fechaCierre.toISOString(),
    totalCartas: cartasDelDia.length,
    cartas: cartasDelDia,
  })

  return {
    mensaje: `Mercado generado para liga ${idLiga}.`,
    idMercado: idMercadoHoy,
    totalCartas: cartasDelDia.length,
    fechaCierre: fechaCierre.toISOString(),
  }
}

/**
 * Cloud Function programada — se ejecuta cada día a las 06:00 UTC.
 * Genera el mercado diario para TODAS las ligas existentes.
 */
exports.generarMercadoDiario = onSchedule(
  {
    schedule: 'every day 06:00',
    timeZone: 'UTC',
    region: 'europe-west1',
  },
  async () => {
    const todasLigas = await db.collection('ligas').get()
    const resultados = []

    for (const docLiga of todasLigas.docs) {
      const resultado = await ejecutarGeneracionMercadoParaLiga(docLiga.id)
      resultados.push(resultado)
    }

    console.log(`[Mercado Diario] ${resultados.length} ligas procesadas.`)
  },
)


