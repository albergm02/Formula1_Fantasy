const { HttpsError } = require('firebase-functions/v2/https')
const { db } = require('./firebase')
const { TEMPORADA_ACTUAL } = require('./constantes')
const { obtenerMeetingKeyEnJuego, SESION_EN_DIRECTO } = require('../dominio/openF1')

// Cacheo del meeting_key durante un minuto en memoria de la instancia para no
// machacar a OpenF1: un GP arranca y termina en horas, un pequeño desfase es
// aceptable y la latencia añadida queda acotada.
const MILISEGUNDOS_VIGENCIA_CACHE = 60 * 1000

let cacheMeetingKey = null
let cacheCaducaEn = 0

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

// Si OpenF1 falla (corte de red, rate-limit), permito la operación: la única
// consecuencia es perder esta validación; el resto de comprobaciones
// (presupuesto, propiedad, periodo de gracia) sigue protegiendo la integridad.
// Excepción: si OpenF1 restringe el acceso por sesión en directo, bloqueo
// (fail-closed) porque ese error es prueba inequívoca de que hay un GP en juego.
async function exigirJornadaProcesada() {
  let meetingKey
  try {
    meetingKey = await obtenerMeetingKeyEnJuegoConCache()
  } catch (error) {
    if (error.codigo === SESION_EN_DIRECTO) {
      throw new HttpsError(
        'failed-precondition',
        'No puedes modificar tu equipo: hay un Gran Premio disputándose en directo.',
      )
    }
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
