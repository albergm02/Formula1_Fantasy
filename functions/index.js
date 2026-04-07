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
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

const {
  recopilarDatosGranPremio,
  obtenerUltimoGranPremioFinalizado,
} = require('./servicioOpenF1Server')
const { calcularPuntuacionGaraje, calcularFactorJornada } = require('./puntuacionServer')
const { calcularSinergias, aplicarSinergia } = require('./sinergiaServer')

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
  async (peticion, respuesta) => {
    try {
      const granPremio = await obtenerUltimoGranPremioFinalizado(TEMPORADA_ACTUAL)

      if (!granPremio) {
        respuesta.status(200).json({ mensaje: 'No hay Gran Premio finalizado para procesar.' })
        return
      }

      const idJornada = `gp_${granPremio.meeting_key}`

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
