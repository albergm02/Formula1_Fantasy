const { HttpsError } = require('firebase-functions/v2/https')
const { db } = require('./firebase')

/**
 * Consulta si un usuario es administrador en la base de datos.
 * @param {Object} request - Objeto de solicitud proporcionado por Firebase.
 * @param {Object} request.auth - Información de autenticación del usuario que invoca la función.
 * @returns {Promise<void>} - Promesa que se resuelve si el usuario es administrador, o lanza un error si no lo es.
 * @throws {HttpsError} - Lanza un error si el usuario no está autenticado o no tiene permisos de administrador.
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
 * Consulta si un usuario tiene un email autenticado en el token.
 * @param {Object} request - Objeto de solicitud proporcionado por Firebase.
 * @param {Object} request.auth - Información de autenticación del usuario que invoca la función.
 * @returns {string} - Email del usuario autenticado.
 * @throws {HttpsError} - Lanza un error si el usuario no está autenticado o el token no contiene un email.
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

module.exports = {
  exigirAdministrador,
  exigirEmailAutenticado,
}
