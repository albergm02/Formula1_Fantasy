const { HttpsError } = require('firebase-functions/v2/https')
const { db } = require('./firebase')

// Consulta por UID (inmutable), no por email: el correo puede cambiar entre
// sesiones tras una migración de cuenta.
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
