const { HttpsError } = require('firebase-functions/v2/https')
const { db } = require('./firebase')
const { obtenerMeetingKeyEnJuego, SESION_EN_DIRECTO } = require('../infraestructura/openF1')

const TEMPORADA_ACTUAL = 2026

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
