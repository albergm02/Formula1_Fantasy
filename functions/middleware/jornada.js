const { HttpsError } = require('firebase-functions/v2/https')
const { db } = require('./firebase')
const { obtenerMeetingKeyEnJuego, SESION_EN_DIRECTO } = require('../infraestructura/openF1')

const TEMPORADA_ACTUAL = 2026

/**
 * Exige que la jornada actual esté procesada antes de permitir modificaciones en el equipo del usuario.
 * Si hay un Gran Premio en directo, lanza un error indicando que no se puede modificar el equipo.
 * Si la jornada actual no está procesada, lanza un error indicando que no se puede modificar el equipo.
 * @returns {Promise<void>} - Promesa que se resuelve si la jornada está procesada, o lanza un error si no lo está.
 */
async function exigirJornadaProcesada() {
  let meetingKey
  try {
    meetingKey = await obtenerMeetingKeyEnJuego(TEMPORADA_ACTUAL)
  } catch (error) {
    if (error.codigo === SESION_EN_DIRECTO) {
      throw new HttpsError(
        'failed-precondition',
        'No puedes modificar tu equipo: hay un Gran Premio disputándose en directo.',
      )
    }
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
