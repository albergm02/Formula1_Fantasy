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
const { getFirestore } = require('firebase-admin/firestore')

const {
  recopilarDatosGranPremio,
  obtenerUltimoGranPremioFinalizado,
} = require('./servicioOpenF1Server')
const { calcularPuntuacionGaraje, calcularFactorJornada } = require('./puntuacionServer')
const { calcularSinergias, aplicarSinergia } = require('./sinergiaServer')
const { generarCatalogo, seleccionarCartasDiarias } = require('./mercadoServer')

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
 * Endpoint HTTP que procesa la jornada del último GP finalizado.
 * Diseñado para invocarse desde Cloud Scheduler (semanal) o manualmente.
 * Es idempotente: si la jornada ya fue procesada, responde 200 sin repetir cálculos.
 */
exports.procesarJornadaGP = onRequest(
  { region: 'europe-west1', cors: true },
  async (_peticion, respuesta) => {
    try {
      const granPremio = await obtenerUltimoGranPremioFinalizado(TEMPORADA_ACTUAL)

      if (!granPremio) {
        respuesta.status(200).json({ mensaje: 'No hay Gran Premio finalizado para procesar.' })
        return
      }

      const idJornada = `gp_${granPremio.meeting_key}`

      // TEMPORAL PARA HACER PRUEBAS
      const jornadaExistente = await db.collection('jornadas').doc(idJornada).get()
      if (jornadaExistente.exists) {
        await db.collection('jornadas').doc(idJornada).delete()
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

        if (!garaje || !garaje.pilotos || garaje.pilotos.length === 0) {
          continue
        }

        const { factores: factoresPorPiloto, detalles: detallesPorPiloto } =
          construirFactoresPorPiloto(garaje.pilotos, actuacionesPorPiloto, condiciones)

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

      const documentoJornada = {
        meetingKey: granPremio.meeting_key,
        nombreGranPremio: granPremio.meeting_name,
        fechaProcesamiento: new Date().toISOString(),
        temporada: TEMPORADA_ACTUAL,
        participacionesProcesadas,
        condiciones,
        desglose: desgloseJornada,
      }

      batch.set(db.collection('jornadas').doc(idJornada), documentoJornada)

      await batch.commit()

      respuesta.status(200).json({
        mensaje: `Jornada ${idJornada} procesada correctamente.`,
        granPremio: granPremio.meeting_name,
        participacionesProcesadas,
      })
    } catch (error) {
      console.error('Error al procesar jornada:', error)
      respuesta.status(500).json({
        error: `Error al procesar la jornada: ${error.message}`,
      })
    }
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
 * @param {string} idMercado - ID del mercado cuyas pujas se resuelven.
 */
async function resolverPujasMercado(idMercado) {
  const pujasSnapshot = await db.collection('mercados').doc(idMercado).collection('pujas').get()

  if (pujasSnapshot.empty) return

  /* Agrupar pujas por idCarta y encontrar la mayor de cada una */
  const pujasPorCarta = {}
  for (const doc of pujasSnapshot.docs) {
    const puja = doc.data()
    const actual = pujasPorCarta[puja.idCarta]
    if (!actual || puja.cantidad > actual.cantidad) {
      pujasPorCarta[puja.idCarta] = puja
    }
  }

  const batch = db.batch()

  for (const [idCarta, pujaGanadora] of Object.entries(pujasPorCarta)) {
    const { idParticipante, cantidad, tipoCarta } = pujaGanadora

    /* Leer participación del ganador */
    const participacionRef = db.collection('participaciones').doc(idParticipante)
    const participacionSnap = await participacionRef.get()
    if (!participacionSnap.exists) continue

    const participacion = participacionSnap.data()
    const presupuesto = participacion.presupuesto || 0

    /* Verificar que aún tiene presupuesto */
    if (cantidad > presupuesto) continue

    const garaje = participacion.garaje || { pilotos: [], coches: [], potenciadores: [], ruedas: [] }

    /* Construir el objeto de la carta ganada */
    const cartaGanada = {
      id: idCarta,
      nombre: pujaGanadora.nombreCarta,
      tipoCarta,
      precio: pujaGanadora.precioCarta,
    }

    /* Añadir la carta al array correspondiente del garaje */
    const claveGaraje = tipoCarta === 'piloto' ? 'pilotos'
      : tipoCarta === 'coche' ? 'coches'
        : tipoCarta === 'potenciador' ? 'potenciadores'
          : 'ruedas'

    garaje[claveGaraje] = [...(garaje[claveGaraje] || []), cartaGanada]

    batch.update(participacionRef, {
      presupuesto: presupuesto - cantidad,
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
    return { mensaje: `El mercado ${idMercadoHoy} ya fue generado previamente.`, idMercado: idMercadoHoy, omitido: true }
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

  /* ── Generar catálogo completo y seleccionar cartas del día ── */
  const catalogo = generarCatalogo()
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

/**
 * Endpoint HTTP para generar el mercado diario de TODAS las ligas.
 * Uso desde Admin: GET/POST https://<REGION>-<PROJECT>.cloudfunctions.net/generarMercadoDiarioHttp
 */
exports.generarMercadoDiarioHttp = onRequest(
  { region: 'europe-west1', cors: true },
  async (_peticion, respuesta) => {
    try {
      const todasLigas = await db.collection('ligas').get()

      if (todasLigas.empty) {
        respuesta.status(200).json({ mensaje: 'No hay ligas registradas.', ligasProcesadas: 0 })
        return
      }

      const resultados = []
      for (const docLiga of todasLigas.docs) {
        const resultado = await ejecutarGeneracionMercadoParaLiga(docLiga.id)
        resultados.push(resultado)
      }

      respuesta.status(200).json({
        mensaje: `Mercado generado para ${resultados.length} liga(s).`,
        ligasProcesadas: resultados.length,
        detalle: resultados,
      })
    } catch (error) {
      console.error('Error al generar mercado diario:', error)
      respuesta.status(500).json({ error: `Error al generar mercado: ${error.message}` })
    }
  },
)
