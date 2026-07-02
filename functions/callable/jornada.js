/**
 * @module functions/callable/Jornada
 * @description Funciones callable para manejar las operaciones relacionadas con la jornada, incluyendo el procesamiento automático de la jornada y la recopilación de datos de los Grandes Premios.
 */

const { onSchedule } = require('firebase-functions/v2/scheduler')

const { db } = require('../middleware/firebase')
const { recopilarDatosGranPremio, obtenerGranPremiosFinalizados } = require('../infraestructura/openF1')
const { calcularPuntuacionGaraje, construirRankingStints } = require('../logica/puntuacion')
const { construirPuntosPorPiloto } = require('../logica/jornada')

const REGION = 'europe-west1'
const TEMPORADA_ACTUAL = 2026

/**
 * Procesa la jornada actual.
 * @returns {Promise<Object>} - Resultado del procesamiento.
 */
async function ejecutarProcesarJornada() {
  const candidatos = await obtenerGranPremiosFinalizados(TEMPORADA_ACTUAL)
  if (candidatos.length === 0) return { ok: false, motivo: 'sin_gp_finalizado' }

  let granPremio = null
  let actuacionesPorPiloto = null
  let condiciones = null
  const omitidos = []

  for (const candidato of candidatos) {
    const idCandidato = `gp_${candidato.meeting_key}`
    const yaProcesada = await db.collection('jornadas').doc(idCandidato).get()
    if (yaProcesada.exists) return { ok: false, motivo: 'jornada_ya_procesada', idJornada: idCandidato }

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
      omitidos.push({ meeting_key: candidato.meeting_key, nombre: candidato.meeting_name, motivo: error.message })
    }
  }

  if (!granPremio) return { ok: false, motivo: 'sin_datos_openf1', omitidos }

  const idJornada = `gp_${granPremio.meeting_key}`

  condiciones = {
    ...condiciones,
    rankingStint: construirRankingStints(actuacionesPorPiloto),
  }

  const todasParticipaciones = await db.collection('participaciones').get()
  const batch = db.batch()
  let participacionesProcesadas = 0

  for (const documento of todasParticipaciones.docs) {
    const participacion = documento.data()
    const garaje = participacion.garaje

    const pilotosEquipados = garaje ? (garaje.pilotos || []).filter((p) => p.equipado !== false) : []
    if (!garaje || pilotosEquipados.length === 0) continue

    const { puntos: puntosPorPiloto, detalles: detallesPorPiloto } = construirPuntosPorPiloto(pilotosEquipados, actuacionesPorPiloto, condiciones)
    const resultadoGaraje = calcularPuntuacionGaraje(garaje, { puntosPorPiloto, condiciones, actuacionesPorPiloto })

    // Enriquezco el desglose con variante y actuación para que el frontend
    // pueda explicar al jugador POR QUÉ ha sacado esos puntos.
    for (const pilotoDesglose of resultadoGaraje.desglose.pilotos) {
      const detalle = detallesPorPiloto[pilotoDesglose.id]
      if (detalle) {
        pilotoDesglose.variante = detalle.variante
        pilotoDesglose.actuacion = detalle.actuacion
      }
    }

    const puntosJornada = resultadoGaraje.puntosTotal

    const puntosAcumulados = (participacion.puntos || 0) + puntosJornada
    const premioJornada = Math.round(((puntosJornada || 0) / 10) * 10) / 10
    const presupuestoActualizado = Math.round(((participacion.presupuesto || 0) + premioJornada) * 100) / 100
    const potenciadoresRestantes = (garaje.potenciadores || []).filter((p) => !p.equipado)
    const desgloseParticipante = { idJornada, nombreGranPremio: granPremio.meeting_name, puntosJornada, premioJornada, condiciones, desglose: resultadoGaraje.desglose }

    batch.update(documento.ref, {
      puntos: puntosAcumulados,
      presupuesto: presupuestoActualizado,
      ultimaJornada: desgloseParticipante,
      'garaje.potenciadores': potenciadoresRestantes,
    })

    participacionesProcesadas++
  }

  batch.set(db.collection('jornadas').doc(idJornada), {
    meetingKey: granPremio.meeting_key,
    nombreGranPremio: granPremio.meeting_name,
    fechaCarrera: granPremio.date_end,
    fechaProcesamiento: new Date().toISOString(),
    temporada: TEMPORADA_ACTUAL,
    condiciones,
    actuacionesPorPiloto,
  })

  await batch.commit()

  return { ok: true, idJornada, nombreGranPremio: granPremio.meeting_name, participacionesProcesadas }
}

/**
 * Programa el procesamiento automático de la jornada mediante una Cloud Function (Scheduler).
 * Se ejecuta automáticamente los lunes a las 12:00 (Europe/Madrid).
 *
 * @function procesarJornada
 * @returns {Promise<void>}
 */
exports.procesarJornada = onSchedule(
  {
    schedule: 'every monday 12:00',
    timeZone: 'Europe/Madrid',
    region: REGION,
    retryCount: 3,
    minBackoffSeconds: 3600,
  },
  async () => {
    const resultado = await ejecutarProcesarJornada()
    if (!resultado.ok && resultado.motivo !== 'jornada_ya_procesada') {
      throw new Error(`[Jornada] Procesamiento fallido: ${resultado.motivo}`)
    }
  },
)
