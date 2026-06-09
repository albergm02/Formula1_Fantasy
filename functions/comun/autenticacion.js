/**
 * Helpers de autenticación y autorización para Cloud Functions.
 *
 * Extraigo aquí los chequeos que se repetían al principio de casi todas las
 * callables: comprobar sesión, extraer el correo del token y validar que el
 * usuario sea administrador o que se haya reautenticado recientemente.
 *
 * Mantenerlos en un único módulo me asegura que un cambio en la política de
 * seguridad (p.ej. acortar la ventana de reauth) se aplique a todas las
 * callables sin riesgo de olvidos.
 */

const { HttpsError } = require('firebase-functions/v2/https')
const { db } = require('./firebase')

/**
 * Verifica que la petición venga de un administrador global.
 *
 * Consulto `usuarios/{uid}` por el UID del token (no por email) porque el UID
 * es inmutable, mientras que el correo puede cambiar entre sesiones tras una
 * migración de cuenta.
 *
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 */
async function exigirAdministrador(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
  }
  const uid = request.auth.uid
  const usuarioSnap = await db.collection('usuarios').doc(uid).get()
  if (!usuarioSnap.exists || usuarioSnap.data().esAdministrador !== true) {
    throw new HttpsError('permission-denied', 'Permisos de administrador requeridos.')
  }
}

/**
 * Devuelve el email del usuario autenticado o lanza si no hay sesión.
 *
 * Lo uso para validar permisos basados en correo (organizador de una liga,
 * dueño de una participación) sin tener que repetir el chequeo en cada
 * callable.
 *
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 * @returns {string} Correo electrónico del invocador.
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
 * Exige que el usuario se haya autenticado hace menos de `maxSegundos`.
 *
 * Protege acciones sensibles (cambiar correo, borrar cuenta) frente a sesiones
 * antiguas: aunque el atacante robara la cookie de un usuario, no podría
 * ejecutarlas sin volver a teclear sus credenciales.
 *
 * El cliente debe llamar a `reauthenticate*` y a `getIdToken(true)` justo
 * antes de invocar la callable para que el `auth_time` del token esté fresco.
 *
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 * @param {number} [maxSegundos=300] - Antigüedad máxima admitida del login (5 min por defecto).
 */
function exigirReautenticacionReciente(request, maxSegundos = 300) {
  const instanteLogin = request.auth?.token?.auth_time
  const ahoraSegundos = Math.floor(Date.now() / 1000)
  if (!instanteLogin || ahoraSegundos - instanteLogin > maxSegundos) {
    throw new HttpsError(
      'failed-precondition',
      'Esta acción exige que vuelvas a introducir tus credenciales.',
    )
  }
}

module.exports = {
  exigirAdministrador,
  exigirEmailAutenticado,
  exigirReautenticacionReciente,
}
