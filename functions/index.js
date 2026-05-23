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

const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')

const {
  recopilarDatosGranPremio,
  obtenerGranPremiosFinalizados,
} = require('./servicioOpenF1Server')
const { calcularPuntuacionGaraje, calcularFactorJornada } = require('./puntuacionServer')
const { calcularSinergias, aplicarSinergia } = require('./sinergiaServer')
const {
  cargarCatalogo,
  cargarPreciosPilotos,
  aplicarPreciosDinamicosACatalogo,
  seleccionarCartasDiarias,
  sembrarCatalogoEnFirestore,
  invalidarCacheCatalogo,
} = require('./mercadoServer')

initializeApp()
const db = getFirestore()

const TEMPORADA_ACTUAL = 2026

/* ─── Utilidades internas ───────────────────────────────────────────────── */

/**
 * Convierte la puntuación total de una jornada en un premio económico (en M).
 * Conversión: 10 puntos equivalen a 1M (108 pts → 10.8M).
 * @param {number} puntosJornada - Puntos obtenidos por el participante en la jornada.
 * @returns {number} Premio en millones, redondeado a un decimal.
 */
function calcularPremioJornada(puntosJornada) {
  const premio = (puntosJornada || 0) / 10
  return Math.round(premio * 10) / 10
}

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
 * Lógica pura del procesamiento de jornada. Reutilizable desde el schedule
 * y desde el callable manual (botón de admin).
 * @param {Object} [opciones]
 * @param {boolean} [opciones.forzar=false] - Si true, reprocesa el último GP
 *        aunque ya exista en `jornadas`, revirtiendo los puntos y premio
 *        previos antes de aplicar los nuevos. Útil para testing.
 * @param {string} [opciones.idLiga] - Si se indica, sólo se reprocesa esa
 *        liga (sus participaciones) y no se sobrescribe el documento global
 *        de `jornadas/{idJornada}`. Pensado para testing puntual desde el
 *        panel de administración sin afectar a otras ligas.
 * @returns {Promise<Object>} Resumen del resultado.
 */
async function ejecutarProcesarJornada(opciones = {}) {
  const { forzar = false, idLiga = null } = opciones
  const reprocesoPorLiga = Boolean(idLiga)

  // Buscamos el GP más reciente con datos disponibles en OpenF1.
  // Algunos GPs pueden estar marcados como finalizados pero no tener datos
  // (cancelados por fuerza mayor, sin /position publicado, etc.). Iteramos
  // hacia atrás hasta encontrar uno válido o agotar la lista.
  const candidatos = await obtenerGranPremiosFinalizados(TEMPORADA_ACTUAL)
  if (candidatos.length === 0) {
    console.log('[Jornada] No hay Gran Premio finalizado para procesar.')
    return { ok: false, motivo: 'sin_gp_finalizado' }
  }

  let granPremio = null
  let actuacionesPorPiloto = null
  let condiciones = null
  const omitidos = []

  for (const candidato of candidatos) {
    const idCandidato = `gp_${candidato.meeting_key}`
    const yaProcesada = await db.collection('jornadas').doc(idCandidato).get()
    if (yaProcesada.exists && !forzar) {
      // Si el más reciente con datos ya está procesado, no rebobinamos más.
      console.log(`[Jornada] ${idCandidato} ya fue procesada previamente. Omitida.`)
      return { ok: false, motivo: 'jornada_ya_procesada', idJornada: idCandidato }
    }

    try {
      const datos = await recopilarDatosGranPremio(candidato.meeting_key)
      if (!datos.actuacionesPorPiloto || Object.keys(datos.actuacionesPorPiloto).length === 0) {
        omitidos.push({ meeting_key: candidato.meeting_key, motivo: 'sin_actuaciones' })
        continue
      }
      granPremio = candidato
      actuacionesPorPiloto = datos.actuacionesPorPiloto
      condiciones = datos.condiciones
      break
    } catch (error) {
      console.warn(
        `[Jornada] GP ${candidato.meeting_key} (${candidato.meeting_name}) sin datos en OpenF1: ${error.message}. Probando el anterior.`,
      )
      omitidos.push({
        meeting_key: candidato.meeting_key,
        nombre: candidato.meeting_name,
        motivo: error.message,
      })
    }
  }

  if (!granPremio) {
    console.log('[Jornada] Ningún GP finalizado tiene datos disponibles en OpenF1.')
    return { ok: false, motivo: 'sin_datos_openf1', omitidos }
  }

  const idJornada = `gp_${granPremio.meeting_key}`

  const consultaParticipaciones = reprocesoPorLiga
    ? db.collection('participaciones').where('id_liga', '==', idLiga)
    : db.collection('participaciones')
  const todasParticipaciones = await consultaParticipaciones.get()
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

    const { factores: factoresPorPiloto, detalles: detallesPorPiloto } = construirFactoresPorPiloto(
      pilotosEquipados,
      actuacionesPorPiloto,
      condiciones,
    )

    const resultadoGaraje = calcularPuntuacionGaraje(garaje, factoresPorPiloto)

    for (const pilotoDesglose of resultadoGaraje.desglose.pilotos) {
      const detalle = detallesPorPiloto[pilotoDesglose.id]
      if (detalle) {
        pilotoDesglose.variante = detalle.variante
        pilotoDesglose.actuacion = detalle.actuacion
      }
    }

    const { multiplicadorTotal, sinergias } = calcularSinergias(garaje)
    const puntosJornada = aplicarSinergia(resultadoGaraje.puntosTotal, multiplicadorTotal)

    const reprocesoMismoGP =
      forzar &&
      participacion.ultimaJornada &&
      participacion.ultimaJornada.nombreGranPremio === granPremio.meeting_name
    const puntosPrevios = reprocesoMismoGP ? participacion.ultimaJornada.puntosJornada || 0 : 0
    const premioPrevio = reprocesoMismoGP ? participacion.ultimaJornada.premioJornada || 0 : 0

    const puntosAcumulados = (participacion.puntos || 0) - puntosPrevios + puntosJornada
    const premioJornada = calcularPremioJornada(puntosJornada)
    const presupuestoActualizado =
      Math.round(((participacion.presupuesto || 0) - premioPrevio + premioJornada) * 100) / 100

    const desgloseParticipante = {
      nombreGranPremio: granPremio.meeting_name,
      fechaProcesamiento: new Date().toISOString(),
      puntosJornada,
      premioJornada,
      multiplicadorSinergia: multiplicadorTotal,
      sinergias,
      condiciones,
      desglose: resultadoGaraje.desglose,
    }

    batch.update(documento.ref, {
      puntos: puntosAcumulados,
      presupuesto: presupuestoActualizado,
      ultimaJornada: desgloseParticipante,
    })

    desgloseJornada.push({
      participacionId: documento.id,
      emailUsuario: participacion.email_usuario,
      idLiga: participacion.id_liga,
      puntosJornada,
      puntosAcumulados,
      premioJornada,
      presupuesto: presupuestoActualizado,
      multiplicadorSinergia: multiplicadorTotal,
      desglose: resultadoGaraje.desglose,
    })

    participacionesProcesadas++
  }

  if (!reprocesoPorLiga) {
    batch.set(db.collection('jornadas').doc(idJornada), {
      meetingKey: granPremio.meeting_key,
      nombreGranPremio: granPremio.meeting_name,
      fechaProcesamiento: new Date().toISOString(),
      temporada: TEMPORADA_ACTUAL,
      participacionesProcesadas,
      condiciones,
      actuacionesPorPiloto,
      desglose: desgloseJornada,
    })
  }

  await batch.commit()

  console.log(
    `[Jornada] ${idJornada} (${granPremio.meeting_name}) procesada. ${participacionesProcesadas} participaciones.`,
  )

  return {
    ok: true,
    idJornada,
    nombreGranPremio: granPremio.meeting_name,
    participacionesProcesadas,
  }
}

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
    await ejecutarProcesarJornada()
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
            precioCompra: cantidad,
            instancia_id: Date.now() + Math.random(),
            ...propiedadesClausula,
          }
        : {
            id: idCarta,
            nombre: pujaGanadora.nombreCarta,
            tipoCarta,
            tipo: tipoCarta,
            precio: pujaGanadora.precioCarta,
            precioCompra: cantidad,
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

  await actualizarPreciosTrasResolucion(cartasMercado, pujasPorCarta)
}

/**
 * Recopila las exclusiones aplicables al próximo mercado de la liga:
 *  - Claves «<numero>|<variante>» de pilotos ya fichados: solo se bloquea
 *    esa combinación concreta. El mismo piloto sigue pudiendo aparecer en
 *    otras variantes.
 *  - IDs de coches y potenciadores ocupados.
 * @param {string} idLiga
 * @returns {Promise<{ clavesPilotoBloqueadas: Set<string>, idsCartas: Set<string> }>}
 */
async function recopilarCartasFichadasEnLiga(idLiga) {
  const participacionesSnap = await db
    .collection('participaciones')
    .where('id_liga', '==', idLiga)
    .get()

  const clavesPilotoBloqueadas = new Set()
  const idsCartas = new Set()
  for (const documento of participacionesSnap.docs) {
    const garaje = documento.data().garaje || {}
    for (const carta of garaje.pilotos || []) {
      if (carta && carta.numero != null && carta.variante) {
        clavesPilotoBloqueadas.add(`${carta.numero}|${carta.variante}`)
      }
    }
    for (const carta of garaje.coches || []) {
      if (carta && carta.id) idsCartas.add(carta.id)
    }
    for (const carta of garaje.potenciadores || []) {
      if (carta && carta.id) idsCartas.add(carta.id)
    }
  }
  return { clavesPilotoBloqueadas, idsCartas }
}

/**
 * Genera el mercado diario para UNA liga específica.
 * Crea un documento en 'mercados/{idLiga}_{YYYY-MM-DD}'.
 * Es idempotente: si el mercado de hoy ya existe para esa liga, no lo recrea.
 * @param {string} idLiga - ID de la liga en Firestore.
 * @param {Object} [opciones]
 * @param {boolean} [opciones.forzar=false] - Si true, borra el mercado de hoy
 *        (y sus pujas) antes de regenerarlo. Útil para testing.
 * @returns {Promise<Object>} Resultado con el ID del mercado y el total de cartas.
 */
async function ejecutarGeneracionMercadoParaLiga(idLiga, opciones = {}) {
  const { forzar = false } = opciones
  const ahora = new Date()
  const idMercadoHoy = calcularIdMercado(idLiga, ahora)

  /* ── Idempotencia: si el mercado de hoy ya existe para esta liga, no lo recreamos ── */
  const mercadoExistente = await db.collection('mercados').doc(idMercadoHoy).get()
  if (mercadoExistente.exists) {
    if (!forzar) {
      return {
        mensaje: `El mercado ${idMercadoHoy} ya fue generado previamente.`,
        idMercado: idMercadoHoy,
        omitido: true,
      }
    }
    /* Modo forzado: borrar mercado existente y sus pujas antes de regenerar */
    const pujasSnap = await db.collection('mercados').doc(idMercadoHoy).collection('pujas').get()
    const batchBorrado = db.batch()
    pujasSnap.docs.forEach((doc) => batchBorrado.delete(doc.ref))
    batchBorrado.delete(mercadoExistente.ref)
    await batchBorrado.commit()
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

  /* ── Cargar catálogo (auto-seed si falta) y aplicar precios dinámicos por puja ── */
  const catalogoBase = await cargarCatalogo(db)
  const preciosDinamicos = await cargarPreciosPilotos(db)
  const catalogoConPrecios = aplicarPreciosDinamicosACatalogo(catalogoBase, preciosDinamicos)

  /* ── Recopilar cartas ya fichadas en la liga para excluirlas ── */
  const exclusionesLiga = await recopilarCartasFichadasEnLiga(idLiga)
  const cartasDelDia = seleccionarCartasDiarias(catalogoConPrecios, exclusionesLiga)

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

/* ═══════════════════════════════════════════════════════════════════════════
   CALLABLES DE ADMINISTRACIÓN — Disparo manual desde la UI
   ───────────────────────────────────────────────────────────────────────────
   Permiten al administrador (flag `esAdministrador` en `usuarios/{email}`)
   disparar manualmente el mercado, la resolución de pujas y el procesamiento
   de la jornada desde AdministracionView.vue, sin esperar al schedule.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Verifica que el invocador esté autenticado y sea administrador.
 * Lanza HttpsError en caso contrario.
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 */
async function exigirAdministrador(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
  }
  const email = request.auth.token.email
  if (!email) {
    throw new HttpsError('permission-denied', 'Token sin email.')
  }
  const usuarioSnap = await db.collection('usuarios').doc(email).get()
  if (!usuarioSnap.exists || usuarioSnap.data().esAdministrador !== true) {
    throw new HttpsError('permission-denied', 'Permisos de administrador requeridos.')
  }
}

/**
 * Callable — genera el primer mercado de una liga recién creada.
 * Lo invoca el frontend tras `crearDocumentoLiga`. Solo lo puede llamar el
 * administrador de esa liga. Es idempotente: si el mercado de hoy ya existe,
 * no lo recrea.
 */
exports.generarMercadoInicialLiga = onCall({ region: 'europe-west1' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
  }
  const email = request.auth.token.email
  const { idLiga } = request.data || {}
  if (!idLiga) {
    throw new HttpsError('invalid-argument', 'Falta idLiga.')
  }

  const ligaSnap = await db.collection('ligas').doc(idLiga).get()
  if (!ligaSnap.exists) {
    throw new HttpsError('not-found', `Liga ${idLiga} no encontrada.`)
  }
  if (ligaSnap.data().admin !== email) {
    throw new HttpsError('permission-denied', 'Solo el admin de la liga puede inicializarla.')
  }

  const resultado = await ejecutarGeneracionMercadoParaLiga(idLiga)
  return { ok: true, ...resultado }
})

/**
 * Callable — fuerza la resolución de pujas, cierra el mercado actual y genera
 * inmediatamente uno nuevo para la misma liga. Útil para probar todo el flujo
 * de pujas + apertura encadenada sin esperar al cierre automático.
 * Acepta `{ idMercado }` (obligatorio).
 */
exports.dispararResolucionPujasManual = onCall({ region: 'europe-west1' }, async (request) => {
  await exigirAdministrador(request)
  const { idMercado } = request.data || {}
  if (!idMercado) {
    throw new HttpsError('invalid-argument', 'Falta idMercado.')
  }
  const mercadoSnap = await db.collection('mercados').doc(idMercado).get()
  if (!mercadoSnap.exists) {
    throw new HttpsError('not-found', `Mercado ${idMercado} no encontrado.`)
  }

  const { idLiga } = mercadoSnap.data()
  if (!idLiga) {
    throw new HttpsError('failed-precondition', `Mercado ${idMercado} no tiene idLiga asociado.`)
  }

  await resolverPujasMercado(idMercado)
  await db.collection('mercados').doc(idMercado).update({ estado: 'cerrado' })

  const nuevoMercado = await ejecutarGeneracionMercadoParaLiga(idLiga, { forzar: true })

  return {
    ok: true,
    idMercado,
    estado: 'cerrado',
    nuevoMercado,
  }
})

/**
 * Callable — dispara el procesamiento de la jornada del último GP finalizado.
 */
exports.dispararJornadaSemanalManual = onCall({ region: 'europe-west1' }, async (request) => {
  await exigirAdministrador(request)
  const { forzar = false, idLiga = null } = request.data || {}
  const resultado = await ejecutarProcesarJornada({ forzar, idLiga })
  return resultado
})

/**
 * Callable — re-siembra el catálogo (pilotos, coches, potenciadores) en
 * Firestore con los datos actuales de `catalogoBase.js`. Sobrescribe los
 * documentos `catalogo/pilotos`, `catalogo/coches` y `catalogo/potenciadores`,
 * e invalida la cache en memoria de las Cloud Functions. Útil tras cambiar
 * atributos, pesos o precios base en el código fuente.
 */
exports.resembrarCatalogoManual = onCall({ region: 'europe-west1' }, async (request) => {
  await exigirAdministrador(request)
  const resultado = await sembrarCatalogoEnFirestore(db)
  invalidarCacheCatalogo()
  return {
    ok: true,
    pilotosSembrados: resultado.pilotos.length,
    cochesSembrados: resultado.coches.length,
    potenciadoresSembrados: resultado.potenciadores.length,
  }
})

/**
 * Callable — ELIMINACIÓN COMPLETA de una liga (solo administrador global).
 * A diferencia del flujo del usuario `eliminarLiga` (que exige ser admin de la
 * liga), este callable permite al administrador global borrar cualquier liga.
 * Borra: participaciones, mercados (y sus pujas), actividad, el documento de
 * la liga, y desvincula la liga del array `ligasIds` de todos los usuarios
 * que la tuvieran asociada.
 * Acepta `{ idLiga }` (obligatorio).
 */
exports.eliminarLigaManual = onCall({ region: 'europe-west1' }, async (request) => {
  await exigirAdministrador(request)
  const { idLiga } = request.data || {}
  if (!idLiga) {
    throw new HttpsError('invalid-argument', 'Falta idLiga.')
  }

  const ligaSnap = await db.collection('ligas').doc(idLiga).get()
  if (!ligaSnap.exists) {
    throw new HttpsError('not-found', `Liga ${idLiga} no encontrada.`)
  }

  const batch = db.batch()

  const participacionesSnap = await db
    .collection('participaciones')
    .where('id_liga', '==', idLiga)
    .get()
  for (const documento of participacionesSnap.docs) {
    batch.delete(documento.ref)
  }

  const mercadosSnap = await db.collection('mercados').where('idLiga', '==', idLiga).get()
  for (const documentoMercado of mercadosSnap.docs) {
    const pujasSnap = await documentoMercado.ref.collection('pujas').get()
    for (const documentoPuja of pujasSnap.docs) {
      batch.delete(documentoPuja.ref)
    }
    batch.delete(documentoMercado.ref)
  }

  const actividadSnap = await db.collection('actividad').where('idLiga', '==', idLiga).get()
  for (const documento of actividadSnap.docs) {
    batch.delete(documento.ref)
  }

  const usuariosSnap = await db
    .collection('usuarios')
    .where('ligasIds', 'array-contains', idLiga)
    .get()
  for (const documentoUsuario of usuariosSnap.docs) {
    batch.update(documentoUsuario.ref, { ligasIds: FieldValue.arrayRemove(idLiga) })
  }

  batch.delete(ligaSnap.ref)

  await batch.commit()

  return {
    ok: true,
    idLiga,
    nombreLiga: ligaSnap.data().nombre || idLiga,
    participacionesBorradas: participacionesSnap.size,
    mercadosBorrados: mercadosSnap.size,
    eventosActividadBorrados: actividadSnap.size,
    usuariosDesvinculados: usuariosSnap.size,
  }
})

/* ═══════════════════════════════════════════════════════════════════════════
   PRECIOS DINÁMICOS DE PILOTOS — derivados de las pujas reales del mercado.
   ───────────────────────────────────────────────────────────────────────────
   Cada vez que se cierra el mercado de una liga, se registra una muestra del
   precio realmente pagado por cada carta de piloto (numero + variante). Las
   cartas que salen al mercado pero no reciben puja añaden una muestra
   penalizada (precio actual * FACTOR_DESINTERES) para reflejar la pérdida de
   valor por falta de interés. El precio dinámico de cada carta es el
   promedio de sus últimas HISTORIAL_MAX_MUESTRAS muestras y se aplica de
   forma global (todas las ligas comparten precios). Tras cada actualización
   se propaga el cambio a los garajes de todos los participantes y a los
   mercados que aún siguen abiertos.
   ═══════════════════════════════════════════════════════════════════════════ */

const HISTORIAL_MAX_MUESTRAS = 5
const FACTOR_DESINTERES = 0.95
const PRECIO_MINIMO = 0.5

/**
 * Para cada carta de piloto del mercado recién resuelto, calcula una muestra
 * de precio (puja ganadora si la hubo, o `precio * FACTOR_DESINTERES` si la
 * carta quedó desierta) y delega su agregación al histórico y la propagación
 * de los nuevos precios a garajes y mercados abiertos.
 * @param {Array} cartasMercado - Cartas que estuvieron a la venta en el mercado.
 * @param {Object} pujasPorCarta - Mapa { idCarta: pujaGanadora } resuelto previamente.
 * @returns {Promise<void>}
 */
async function actualizarPreciosTrasResolucion(cartasMercado, pujasPorCarta) {
  const muestrasPorClave = {}
  for (const carta of cartasMercado) {
    if (carta.tipoCarta !== 'piloto' || carta.numero == null || !carta.variante) continue
    const clave = `${carta.numero}|${carta.variante}`
    const pujaGanadora = pujasPorCarta[carta.id]
    const precioMuestra = pujaGanadora
      ? Number(pujaGanadora.cantidad)
      : Number(carta.precio) * FACTOR_DESINTERES
    muestrasPorClave[clave] = Math.round(precioMuestra * 10) / 10
  }

  if (Object.keys(muestrasPorClave).length === 0) return

  await fusionarMuestrasYRecalcularPrecios(muestrasPorClave)
}

/**
 * Añade las muestras al histórico (recortando a las últimas
 * HISTORIAL_MAX_MUESTRAS por clave), recalcula el precio dinámico de cada
 * carta como promedio del histórico y persiste tanto el histórico como el
 * documento de precios. Luego propaga los deltas a garajes y mercados.
 * @param {Object<string, number>} muestrasPorClave - { "<numero>|<variante>": precioMuestra }.
 * @returns {Promise<void>}
 */
async function fusionarMuestrasYRecalcularPrecios(muestrasPorClave) {
  const refHistorial = db.collection('catalogo').doc('historial_pujas')
  const refPrecios = db.collection('catalogo').doc('precios_pilotos')

  const [snapHistorial, snapPrecios] = await Promise.all([refHistorial.get(), refPrecios.get()])
  const historial = snapHistorial.exists ? snapHistorial.data().muestras || {} : {}
  const preciosAnteriores = snapPrecios.exists ? snapPrecios.data().precios || {} : {}

  const preciosNuevos = { ...preciosAnteriores }

  for (const [clave, muestra] of Object.entries(muestrasPorClave)) {
    const previas = historial[clave] || []
    const combinadas = [...previas, muestra].slice(-HISTORIAL_MAX_MUESTRAS)
    historial[clave] = combinadas
    const media = combinadas.reduce((acc, valor) => acc + valor, 0) / combinadas.length
    preciosNuevos[clave] = Math.max(PRECIO_MINIMO, Math.round(media * 10) / 10)
  }

  const fechaActualizacion = new Date().toISOString()
  await Promise.all([
    refHistorial.set({ muestras: historial, fechaActualizacion }),
    refPrecios.set({ precios: preciosNuevos, fechaActualizacion }),
  ])

  const deltasPorClave = calcularDeltasPrecioPiloto(preciosAnteriores, preciosNuevos)
  const preciosPrimeraVezPorClave = {}
  for (const [clave, precioNuevo] of Object.entries(preciosNuevos)) {
    if (preciosAnteriores[clave] == null) {
      preciosPrimeraVezPorClave[clave] = precioNuevo
    }
  }

  const propagaciones = []
  if (Object.keys(deltasPorClave).length > 0) {
    propagaciones.push(
      propagarDeltasAGarajesDePilotos(deltasPorClave),
      propagarDeltasAMercadosAbiertos(deltasPorClave),
    )
  }
  if (Object.keys(preciosPrimeraVezPorClave).length > 0) {
    propagaciones.push(propagarPreciosAbsolutosAGarajes(preciosPrimeraVezPorClave))
  }
  if (propagaciones.length > 0) await Promise.all(propagaciones)
}

/**
 * Calcula los deltas de precio (precioNuevo - precioAnterior) por clave de
 * piloto. Las claves sin precio previo se consideran sin delta (el primer
 * precio asignado no propaga nada hacia atrás).
 * @param {Object<string, number>} preciosAnteriores
 * @param {Object<string, number>} preciosNuevos
 * @returns {Object<string, number>} Mapa { clave: deltaPrecioM }.
 */
function calcularDeltasPrecioPiloto(preciosAnteriores, preciosNuevos) {
  const deltas = {}
  for (const [clave, precioNuevo] of Object.entries(preciosNuevos)) {
    const precioAnterior = preciosAnteriores[clave]
    if (precioAnterior == null) continue
    const delta = Math.round((precioNuevo - precioAnterior) * 10) / 10
    if (delta !== 0) deltas[clave] = delta
  }
  return deltas
}

/**
 * Para pilotos cuyo precio aparece en `catalogo/precios_pilotos` por primera
 * vez (sin histórico previo), establece el precio de forma absoluta en todos
 * los garajes que ya tengan esa carta. Evita que el precio base del catálogo
 * se quede desincronizado cuando no hay delta anterior con el que calcular.
 * @param {Object<string, number>} preciosPorClave - { "<numero>|<variante>": precioNuevo }.
 * @returns {Promise<number>} Número de garajes actualizados.
 */
async function propagarPreciosAbsolutosAGarajes(preciosPorClave) {
  const participacionesSnap = await db.collection('participaciones').get()
  const batch = db.batch()
  let garajesActualizados = 0

  for (const documento of participacionesSnap.docs) {
    const garaje = documento.data().garaje
    if (!garaje || !Array.isArray(garaje.pilotos)) continue

    let huboCambio = false
    const pilotosActualizados = garaje.pilotos.map((piloto) => {
      if (piloto == null || piloto.numero == null || !piloto.variante) return piloto
      const nuevoPrecio = preciosPorClave[`${piloto.numero}|${piloto.variante}`]
      if (nuevoPrecio == null) return piloto
      huboCambio = true
      return { ...piloto, precio: nuevoPrecio }
    })

    if (huboCambio) {
      batch.update(documento.ref, { 'garaje.pilotos': pilotosActualizados })
      garajesActualizados++
    }
  }

  if (garajesActualizados > 0) await batch.commit()
  return garajesActualizados
}

/**
 * garajes de TODAS las participaciones. Una carta del garaje se identifica
 * por la combinación `<numero>|<variante>`. Mantiene PRECIO_MINIMO como
 * suelo. Devuelve el número de garajes efectivamente modificados.
 * @param {Object<string, number>} deltasPorClave
 * @returns {Promise<number>}
 */
async function propagarDeltasAGarajesDePilotos(deltasPorClave) {
  const participacionesSnap = await db.collection('participaciones').get()
  const batch = db.batch()
  let garajesActualizados = 0

  for (const documento of participacionesSnap.docs) {
    const garaje = documento.data().garaje
    if (!garaje || !Array.isArray(garaje.pilotos)) continue

    let huboCambio = false
    const pilotosActualizados = garaje.pilotos.map((piloto) => {
      if (piloto == null || piloto.numero == null || !piloto.variante) return piloto
      const delta = deltasPorClave[`${piloto.numero}|${piloto.variante}`]
      if (!delta) return piloto
      huboCambio = true
      const precioNuevo = Math.max(
        PRECIO_MINIMO,
        Math.round((Number(piloto.precio || 0) + delta) * 10) / 10,
      )
      return { ...piloto, precio: precioNuevo }
    })

    if (huboCambio) {
      batch.update(documento.ref, { 'garaje.pilotos': pilotosActualizados })
      garajesActualizados++
    }
  }

  if (garajesActualizados > 0) await batch.commit()
  return garajesActualizados
}

/**
 * Aplica los deltas de precio sobre las cartas de pilotos en mercados con
 * `estado: 'abierto'`. Identifica por `<numero>|<variante>`.
 * @param {Object<string, number>} deltasPorClave
 * @returns {Promise<number>}
 */
async function propagarDeltasAMercadosAbiertos(deltasPorClave) {
  const mercadosSnap = await db.collection('mercados').where('estado', '==', 'abierto').get()
  if (mercadosSnap.empty) return 0

  const batch = db.batch()
  let mercadosActualizados = 0

  for (const documento of mercadosSnap.docs) {
    const cartas = documento.data().cartas || []
    let huboCambio = false

    const cartasActualizadas = cartas.map((carta) => {
      if (carta.tipoCarta !== 'piloto' || carta.numero == null || !carta.variante) return carta
      const delta = deltasPorClave[`${carta.numero}|${carta.variante}`]
      if (!delta) return carta
      huboCambio = true
      const precioNuevo = Math.max(
        PRECIO_MINIMO,
        Math.round((Number(carta.precio || 0) + delta) * 10) / 10,
      )
      return { ...carta, precio: precioNuevo }
    })

    if (huboCambio) {
      batch.update(documento.ref, { cartas: cartasActualizadas })
      mercadosActualizados++
    }
  }

  if (mercadosActualizados > 0) await batch.commit()
  return mercadosActualizados
}

/* ═══════════════════════════════════════════════════════════════════════════
   GESTIÓN DE PERFIL — Cambio de nombre, cambio de correo y baja de cuenta.
   ───────────────────────────────────────────────────────────────────────────
   Las acciones sensibles (cambio de email y borrado) requieren que el cliente
   haya reautenticado al usuario justo antes de invocar la callable.
   ═══════════════════════════════════════════════════════════════════════════ */

const FORMATO_NOMBRE = /^[A-Za-z0-9_]{3,20}$/
const DIAS_BLOQUEO_CAMBIO_NOMBRE = 30
const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000

/**
 * Devuelve el email del usuario autenticado o lanza si no hay sesión.
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 * @returns {string}
 */
function exigirEmailAutenticado(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
  }
  const email = request.auth.token.email
  if (!email) {
    throw new HttpsError('permission-denied', 'Token sin email.')
  }
  return email
}

/**
 * Callable — cambia el nombre visible del usuario autenticado.
 * Reglas: formato A-Z 0-9 _ (3-20 chars), unicidad global, máximo un cambio cada 30 días.
 */
exports.cambiarNombreUsuario = onCall({ region: 'europe-west1' }, async (request) => {
  const email = exigirEmailAutenticado(request)
  const nombreNuevo = String(request.data?.nombreNuevo || '').trim()

  if (!FORMATO_NOMBRE.test(nombreNuevo)) {
    throw new HttpsError(
      'invalid-argument',
      'El nombre debe tener entre 3 y 20 caracteres alfanuméricos o guion bajo.',
    )
  }

  const usuarioSnap = await db.collection('usuarios').doc(email).get()
  if (!usuarioSnap.exists) {
    throw new HttpsError('not-found', 'No existe tu perfil.')
  }
  const datos = usuarioSnap.data()

  if (datos.nombre === nombreNuevo) {
    throw new HttpsError('already-exists', 'Ya tienes ese nombre.')
  }

  const fechaUltimoCambio = datos.fechaUltimoCambioNombre
    ? new Date(datos.fechaUltimoCambioNombre)
    : null
  if (fechaUltimoCambio) {
    const diasTranscurridos = (Date.now() - fechaUltimoCambio.getTime()) / MILISEGUNDOS_POR_DIA
    if (diasTranscurridos < DIAS_BLOQUEO_CAMBIO_NOMBRE) {
      const diasRestantes = Math.ceil(DIAS_BLOQUEO_CAMBIO_NOMBRE - diasTranscurridos)
      throw new HttpsError(
        'failed-precondition',
        `Solo puedes cambiar el nombre una vez cada 30 días. Faltan ${diasRestantes} días.`,
      )
    }
  }

  const colision = await db.collection('usuarios').where('nombre', '==', nombreNuevo).limit(1).get()
  if (!colision.empty) {
    throw new HttpsError('already-exists', 'Ese nombre ya está en uso.')
  }

  await db.collection('usuarios').doc(email).update({
    nombre: nombreNuevo,
    fechaUltimoCambioNombre: new Date().toISOString(),
  })

  return { ok: true, nombre: nombreNuevo }
})

/**
 * Callable — migra todos los documentos de Firestore tras un cambio de correo en Auth.
 * El cliente debe haber ejecutado primero `updateEmail()` y volver a obtener el token.
 * El token recibido aquí ya lleva el nuevo correo: si no coincide, abortamos.
 */
exports.migrarCorreoUsuario = onCall({ region: 'europe-west1' }, async (request) => {
  const emailToken = exigirEmailAutenticado(request)
  const correoAnterior = String(request.data?.correoAnterior || '')
    .trim()
    .toLowerCase()
  const correoNuevo = String(request.data?.correoNuevo || '')
    .trim()
    .toLowerCase()

  if (!correoAnterior || !correoNuevo || correoAnterior === correoNuevo) {
    throw new HttpsError('invalid-argument', 'Correos inválidos.')
  }
  if (emailToken.toLowerCase() !== correoNuevo) {
    throw new HttpsError(
      'failed-precondition',
      'Debes actualizar el correo en Auth y refrescar el token antes de migrar.',
    )
  }

  const docAnterior = await db.collection('usuarios').doc(correoAnterior).get()
  if (!docAnterior.exists) {
    throw new HttpsError('not-found', 'No existe el perfil anterior.')
  }
  const docNuevoExistente = await db.collection('usuarios').doc(correoNuevo).get()
  if (docNuevoExistente.exists) {
    throw new HttpsError('already-exists', 'Ya existe un perfil con ese correo.')
  }

  const batch = db.batch()
  batch.set(db.collection('usuarios').doc(correoNuevo), {
    ...docAnterior.data(),
    correoAutenticacion: correoNuevo,
  })
  batch.delete(db.collection('usuarios').doc(correoAnterior))

  const participacionesSnap = await db
    .collection('participaciones')
    .where('email_usuario', '==', correoAnterior)
    .get()
  for (const documento of participacionesSnap.docs) {
    batch.update(documento.ref, { email_usuario: correoNuevo })
  }

  const ligasAdminSnap = await db.collection('ligas').where('admin', '==', correoAnterior).get()
  for (const documento of ligasAdminSnap.docs) {
    batch.update(documento.ref, { admin: correoNuevo })
  }

  await batch.commit()

  return {
    ok: true,
    correoNuevo,
    participacionesMigradas: participacionesSnap.size,
    ligasMigradas: ligasAdminSnap.size,
  }
})

/**
 * Cede el rol de admin al siguiente participante por fecha_union ascendente.
 * @param {Array<{id: string, email_usuario: string, fecha_union?: any}>} participacionesRestantes
 * @returns {{id: string, email_usuario: string} | null}
 */
function elegirSiguienteAdministrador(participacionesRestantes) {
  if (participacionesRestantes.length === 0) return null
  const ordenadas = [...participacionesRestantes].sort((a, b) => {
    const fechaA = a.fecha_union?.toMillis ? a.fecha_union.toMillis() : 0
    const fechaB = b.fecha_union?.toMillis ? b.fecha_union.toMillis() : 0
    return fechaA - fechaB
  })
  return ordenadas[0]
}

/**
 * Borra una liga completa: mercados (con pujas), actividad y la propia liga.
 * @param {string} idLiga
 */
async function borrarLigaCompleta(idLiga) {
  const mercadosSnap = await db.collection('mercados').where('idLiga', '==', idLiga).get()
  for (const docMercado of mercadosSnap.docs) {
    const pujasSnap = await docMercado.ref.collection('pujas').get()
    const batchPujas = db.batch()
    for (const pujaDoc of pujasSnap.docs) batchPujas.delete(pujaDoc.ref)
    await batchPujas.commit()
    await docMercado.ref.delete()
  }

  const actividadSnap = await db.collection('actividad').where('idLiga', '==', idLiga).get()
  const batchActividad = db.batch()
  for (const documento of actividadSnap.docs) batchActividad.delete(documento.ref)
  await batchActividad.commit()

  await db.collection('ligas').doc(idLiga).delete()
}

/**
 * Borra en cascada todos los datos del usuario `email`:
 *  · Si era único participante de una liga → borra la liga entera.
 *  · Si era admin con más participantes → cede admin al siguiente.
 *  · Borra su participación y resta 1 al contador de la liga.
 *  · Borra todas sus pujas activas en mercados abiertos.
 *  · Borra el documento `usuarios/{email}` y el usuario de Firebase Auth.
 * @param {string} email
 * @returns {Promise<{participacionesBorradas: number, ligasBorradas: number}>}
 */
async function eliminarCuentaUsuarioEnCascada(email) {
  const participacionesSnap = await db
    .collection('participaciones')
    .where('email_usuario', '==', email)
    .get()

  let ligasBorradas = 0

  for (const documentoPropio of participacionesSnap.docs) {
    const datosPropios = documentoPropio.data()
    const idLiga = datosPropios.id_liga

    const ligaSnap = await db.collection('ligas').doc(idLiga).get()
    if (!ligaSnap.exists) {
      await documentoPropio.ref.delete()
      continue
    }
    const datosLiga = ligaSnap.data()

    const restantesSnap = await db
      .collection('participaciones')
      .where('id_liga', '==', idLiga)
      .get()
    const restantes = restantesSnap.docs
      .filter((d) => d.id !== documentoPropio.id)
      .map((d) => ({ id: d.id, ...d.data() }))

    if (restantes.length === 0) {
      await documentoPropio.ref.delete()
      await borrarLigaCompleta(idLiga)
      ligasBorradas += 1
      continue
    }

    if (datosPropios.rol === 'admin') {
      const siguiente = elegirSiguienteAdministrador(restantes)
      await db.collection('participaciones').doc(siguiente.id).update({ rol: 'admin' })
      await db
        .collection('ligas')
        .doc(idLiga)
        .update({
          admin: siguiente.email_usuario,
          participantes: (datosLiga.participantes || restantes.length + 1) - 1,
        })
    } else {
      await db
        .collection('ligas')
        .doc(idLiga)
        .update({
          participantes: (datosLiga.participantes || restantes.length + 1) - 1,
        })
    }

    await documentoPropio.ref.delete()
  }

  const mercadosAbiertosSnap = await db
    .collection('mercados')
    .where('estado', '==', 'abierto')
    .get()
  for (const docMercado of mercadosAbiertosSnap.docs) {
    const pujasSnap = await docMercado.ref
      .collection('pujas')
      .where('emailUsuario', '==', email)
      .get()
    const batchPujas = db.batch()
    for (const pujaDoc of pujasSnap.docs) batchPujas.delete(pujaDoc.ref)
    if (!pujasSnap.empty) await batchPujas.commit()
  }

  await db.collection('usuarios').doc(email).delete()

  let uidEliminar = null
  try {
    const usuarioAuth = await getAuth().getUserByEmail(email)
    uidEliminar = usuarioAuth.uid
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      throw new HttpsError(
        'internal',
        `Error consultando el usuario de Auth para ${email}: ${error.message}`,
      )
    }
  }

  if (uidEliminar) {
    try {
      await getAuth().deleteUser(uidEliminar)
    } catch (error) {
      throw new HttpsError(
        'internal',
        `Perfil borrado pero el usuario de Auth no pudo eliminarse: ${error.message}`,
      )
    }
  }

  return { participacionesBorradas: participacionesSnap.size, ligasBorradas }
}

/**
 * Callable — elimina la cuenta del usuario autenticado en cascada.
 */
exports.eliminarMiCuenta = onCall({ region: 'europe-west1' }, async (request) => {
  const email = exigirEmailAutenticado(request)
  const resultado = await eliminarCuentaUsuarioEnCascada(email)
  return { ok: true, email, ...resultado }
})

/**
 * Callable — el administrador global elimina la cuenta de cualquier usuario
 * en cascada (participaciones, pujas, perfil y usuario de Auth).
 * Acepta `{ email }` (obligatorio).
 */
exports.eliminarUsuarioManual = onCall({ region: 'europe-west1' }, async (request) => {
  await exigirAdministrador(request)
  const { email } = request.data || {}
  if (!email) {
    throw new HttpsError('invalid-argument', 'Falta email.')
  }

  const usuarioSnap = await db.collection('usuarios').doc(email).get()
  if (!usuarioSnap.exists) {
    throw new HttpsError('not-found', `Usuario ${email} no encontrado.`)
  }
  if (usuarioSnap.data().esAdministrador === true) {
    throw new HttpsError(
      'failed-precondition',
      'No se puede eliminar a otro administrador desde el panel.',
    )
  }

  const resultado = await eliminarCuentaUsuarioEnCascada(email)
  return { ok: true, email, ...resultado }
})
