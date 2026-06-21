const { onCall, HttpsError } = require('firebase-functions/v2/https')

const { db } = require('../middleware/firebase')
const { exigirAdministrador } = require('../middleware/autenticacion')
const { borrarLigaEnCascada } = require('./ligas')
const { eliminarCuentaUsuarioEnCascada } = require('./perfil')

const OPCIONES = { region: 'europe-west1', enforceAppCheck: true }

exports.eliminarLigaAdmin = onCall(OPCIONES, async (request) => {
  await exigirAdministrador(request)
  const { idLiga } = request.data || {}
  if (!idLiga) {
    throw new HttpsError('invalid-argument', 'Falta idLiga.')
  }

  const ligaSnap = await db.collection('ligas').doc(idLiga).get()
  if (!ligaSnap.exists) {
    throw new HttpsError('not-found', `Liga ${idLiga} no encontrada.`)
  }

  const resumen = await borrarLigaEnCascada(idLiga, ligaSnap)
  return { ok: true, idLiga, ...resumen }
})

// Bloqueo expresamente la eliminación de otros administradores desde el panel
// para evitar "tiroteos" entre admins.
exports.eliminarUsuarioAdmin = onCall(OPCIONES, async (request) => {
  await exigirAdministrador(request)
  const { uid } = request.data || {}
  if (!uid) {
    throw new HttpsError('invalid-argument', 'Falta uid.')
  }

  const usuarioSnap = await db.collection('usuarios').doc(uid).get()
  if (!usuarioSnap.exists) {
    throw new HttpsError('not-found', `Usuario ${uid} no encontrado.`)
  }
  if (usuarioSnap.data().esAdministrador === true) {
    throw new HttpsError(
      'failed-precondition',
      'No se puede eliminar a otro administrador desde el panel.',
    )
  }

  const email = usuarioSnap.data().correoAutenticacion || ''
  const resultado = await eliminarCuentaUsuarioEnCascada(uid, email)
  return { ok: true, uid, email, ...resultado }
})
