const { onCall, HttpsError } = require('firebase-functions/v2/https')

const { db } = require('../middleware/firebase')
const { OPCIONES, OPCIONES_PUBLICAS } = require('../middleware/constantes')

const MAXIMO_INTENTOS_FALLIDOS = 5
const DURACION_BLOQUEO_MINUTOS = 5

// Callable previa al login: avisa si la cuenta está temporalmente bloqueada.
// Si el correo no existe, devuelve { bloqueado: false } sin revelar nada
// más, para evitar enumeración de usuarios.
exports.verificarBloqueoAcceso = onCall(OPCIONES_PUBLICAS, async (request) => {
  const correo = String(request.data?.correo || '')
    .trim()
    .toLowerCase()
  if (!correo) throw new HttpsError('invalid-argument', 'Falta el correo.')

  const resultadoBusqueda = await db
    .collection('usuarios')
    .where('correoAutenticacion', '==', correo)
    .limit(1)
    .get()
  if (resultadoBusqueda.empty) return { bloqueado: false }

  const usuarioSnap = resultadoBusqueda.docs[0]
  const { fechaBloqueoDeSesion } = usuarioSnap.data()
  if (!fechaBloqueoDeSesion) return { bloqueado: false }

  const fechaDesbloqueo = fechaBloqueoDeSesion.toDate()
  if (new Date() < fechaDesbloqueo) {
    const minutosRestantes = Math.ceil((fechaDesbloqueo - new Date()) / 60000)
    throw new HttpsError(
      'resource-exhausted',
      `Acceso bloqueado. Intenta de nuevo en ${minutosRestantes} minuto${minutosRestantes > 1 ? 's' : ''}.`,
    )
  }

  return { bloqueado: false }
})

// Si el correo no existe, ignoro silenciosamente el intento para no
// convertir esta callable en un oráculo de existencia de cuentas.
exports.registrarIntentoFallido = onCall(OPCIONES_PUBLICAS, async (request) => {
  const correo = String(request.data?.correo || '')
    .trim()
    .toLowerCase()
  if (!correo) throw new HttpsError('invalid-argument', 'Falta el correo.')

  const resultadoBusqueda = await db
    .collection('usuarios')
    .where('correoAutenticacion', '==', correo)
    .limit(1)
    .get()
  if (resultadoBusqueda.empty) return { ok: true }

  const docRef = resultadoBusqueda.docs[0].ref
  const intentosPrevios = resultadoBusqueda.docs[0].data().contadorIntentosFallidos || 0
  const nuevosIntentos = intentosPrevios + 1
  const actualizacion = { contadorIntentosFallidos: nuevosIntentos }

  if (nuevosIntentos >= MAXIMO_INTENTOS_FALLIDOS) {
    const fechaDesbloqueo = new Date(Date.now() + DURACION_BLOQUEO_MINUTOS * 60 * 1000)
    actualizacion.fechaBloqueoDeSesion = fechaDesbloqueo
  }

  await docRef.update(actualizacion)
  return { ok: true }
})

// Uso el UID del token (no un email del payload) para evitar que un atacante
// reinicie el contador de otro correo.
exports.reiniciarContadorIntentos = onCall(OPCIONES, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
  const uid = request.auth.uid

  const docRef = db.collection('usuarios').doc(uid)
  const usuarioSnap = await docRef.get()
  if (!usuarioSnap.exists) return { ok: true }

  await docRef.update({ contadorIntentosFallidos: 0, fechaBloqueoDeSesion: null })
  return { ok: true }
})
