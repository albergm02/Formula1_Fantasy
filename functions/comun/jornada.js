/**
 * Bloqueo de jornada en servidor.
 *
 * Replica la regla del composable cliente `usarBloqueoJornada`: mientras haya
 * un Gran Premio en juego cuyos resultados todavía no se han procesado en
 * `jornadas/`, las acciones que afectan a la alineación o al patrimonio del
 * jugador deben rechazarse. El cliente ya bloquea la UI, pero solo el servidor
 * puede impedir que un usuario malicioso invoque la callable directamente.
 *
 * Cacheo el `meeting_key` en juego durante un minuto en memoria de la
 * instancia para evitar machacar a OpenF1 en cada invocación: un GP arranca
 * y termina en horas, no en segundos, así que un pequeño desfase es
 * aceptable y la latencia añadida queda acotada.
 */

const { HttpsError } = require('firebase-functions/v2/https')
const { db } = require('./firebase')
const { TEMPORADA_ACTUAL } = require('./constantes')
const { obtenerMeetingKeyEnJuego } = require('../dominio/openF1')

const MILISEGUNDOS_VIGENCIA_CACHE = 60 * 1000

let cacheMeetingKey = null
let cacheCaducaEn = 0

/**
 * Resuelve el `meeting_key` del GP en juego usando la caché si sigue vigente.
 * @returns {Promise<number|null>}
 */
async function obtenerMeetingKeyEnJuegoConCache() {
  const ahora = Date.now()
  if (cacheMeetingKey !== null && ahora < cacheCaducaEn) {
    return cacheMeetingKey
  }
  const meetingKey = await obtenerMeetingKeyEnJuego(TEMPORADA_ACTUAL)
  cacheMeetingKey = meetingKey
  cacheCaducaEn = ahora + MILISEGUNDOS_VIGENCIA_CACHE
  return meetingKey
}

/**
 * Lanza `failed-precondition` si hay un Gran Premio en juego cuyos resultados
 * aún no se han procesado en la colección `jornadas`.
 *
 * Si OpenF1 falla (corte de red, rate-limit), prefiero permitir la operación
 * a bloquear toda la app: la única consecuencia es perder esta validación
 * puntual; el resto de comprobaciones (presupuesto, propiedad, periodo de
 * gracia) sigue protegiendo la integridad.
 */
async function exigirJornadaProcesada() {
  let meetingKey
  try {
    meetingKey = await obtenerMeetingKeyEnJuegoConCache()
  } catch (error) {
    console.warn('[Jornada] OpenF1 inaccesible, omito bloqueo:', error.message)
    return
  }

  if (!meetingKey) return

  const idJornada = `gp_${meetingKey}`
  const jornadaSnap = await db.collection('jornadas').doc(idJornada).get()
  if (!jornadaSnap.exists) {
    throw new HttpsError(
      'failed-precondition',
      'No puedes modificar tu equipo: el Gran Premio en juego aún no se ha procesado.',
    )
  }
}

module.exports = {
  exigirJornadaProcesada,
}
