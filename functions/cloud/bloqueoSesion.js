/**
 * Protección anti fuerza bruta del login.
 *
 * Tres callables públicas (sin sesión Firebase Auth pero con App Check) que
 * implementan el clásico patrón "contador de intentos + bloqueo temporal":
 *
 *  - `verificarBloqueoAcceso` se llama ANTES de pedir credenciales para
 *    informar al usuario de que su cuenta está temporalmente bloqueada.
 *  - `registrarIntentoFallido` se llama tras un fallo de credenciales y, al
 *    llegar al límite, activa el bloqueo.
 *  - `reiniciarContadorIntentos` se llama tras un login correcto y limpia
 *    el contador.
 *
 * Vivir en servidor es la única forma de que el bloqueo sea efectivo: si
 * estuviera en cliente, bastaría con borrar la cookie para evitarlo.
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https')

const { db } = require('../comun/firebase')
const { OPCIONES, OPCIONES_PUBLICAS } = require('../comun/constantes')

const MAXIMO_INTENTOS_FALLIDOS = 5
const DURACION_BLOQUEO_MINUTOS = 5

/**
 * Callable pública — informa si un correo tiene un bloqueo temporal activo.
 *
 * No requiere sesión porque se invoca antes del login. Si el correo no
 * existe en Firestore devuelvo `{ bloqueado: false }` sin revelar nada más,
 * para no facilitar enumeración de usuarios.
 */
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

/**
 * Callable pública — incrementa el contador de intentos fallidos.
 *
 * Al alcanzar `MAXIMO_INTENTOS_FALLIDOS` activa un bloqueo temporal de
 * `DURACION_BLOQUEO_MINUTOS` minutos. Si el correo no existe ignoro el
 * intento silenciosamente para no convertir esta callable en un oráculo
 * de existencia de cuentas.
 */
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

/**
 * Callable autenticada — limpia el contador tras un login exitoso.
 *
 * Solo puede llamarla el propio usuario y uso el UID del token para evitar
 * que un atacante limpie el contador de otro correo.
 */
exports.reiniciarContadorIntentos = onCall(OPCIONES, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
  const uid = request.auth.uid

  const docRef = db.collection('usuarios').doc(uid)
  const usuarioSnap = await docRef.get()
  if (!usuarioSnap.exists) return { ok: true }

  await docRef.update({ contadorIntentosFallidos: 0, fechaBloqueoDeSesion: null })
  return { ok: true }
})
