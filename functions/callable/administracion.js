/**
 * @module functions/callable/Administracion
 * @description Funciones callable para manejar las operaciones administrativas, incluyendo la eliminación de ligas y usuarios.
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https')

const { db } = require('../middleware/firebase')
const { exigirAdministrador } = require('../middleware/autenticacion')
const { borrarLigaEnCascada } = require('./ligas')
const { eliminarCuentaUsuarioEnCascada } = require('./perfil')

const OPCIONES = { region: 'europe-west1', enforceAppCheck: true }


/**
 * Elimina una liga específica como administrador mediante una Cloud Function (Callable).
 *
 * @function eliminarLigaAdmin
 * @param {Object} request - Objeto de solicitud proporcionado por Firebase.
 * @param {Object} request.data - Carga útil (payload) enviada desde el cliente Frontend.
 * @param {string} request.data.idLiga - El identificador único de la liga que se va a eliminar.
 * @returns {Promise<Object>} Resultado de la operación, indicando si fue exitosa y el resumen de borrado.
 */
exports.eliminarLigaAdmin = onCall(OPCIONES, async (request) => {
  await exigirAdministrador(request)
  const idLiga = request.data?.idLiga || null
  if (!idLiga) throw new HttpsError('invalid-argument', 'Falta idLiga.')

  const ligaSnap = await db.collection('ligas').doc(idLiga).get()
  if (!ligaSnap.exists) throw new HttpsError('not-found', `Liga ${idLiga} no encontrada.`)

  const resumen = await borrarLigaEnCascada(idLiga, ligaSnap)
  return { ok: true, idLiga, ...resumen }
})

/**
 * Elimina un usuario específico como administrador mediante una Cloud Function (Callable).
 *
 * @function eliminarUsuarioAdmin
 * @param {Object} request - Objeto de solicitud proporcionado por Firebase.
 * @param {Object} request.data - Carga útil (payload) enviada desde el cliente Frontend.
 * @param {string} request.data.uid - El identificador único del usuario que se va a eliminar.
 * @returns {Promise<Object>} Resultado de la operación, indicando si fue exitosa y el resumen de borrado.
 */
exports.eliminarUsuarioAdmin = onCall(OPCIONES, async (request) => {
  await exigirAdministrador(request)
  const uid = request.data?.uid || null
  if (!uid) throw new HttpsError('invalid-argument', 'Falta uid.')

  const usuarioSnap = await db.collection('usuarios').doc(uid).get()
  if (!usuarioSnap.exists) throw new HttpsError('not-found', `Usuario ${uid} no encontrado.`)
  if (usuarioSnap.data().esAdministrador === true) {
    throw new HttpsError('failed-precondition', 'No se puede eliminar a otro administrador desde el panel.')
  }

  const email = usuarioSnap.data().correoAutenticacion || ''
  const resultado = await eliminarCuentaUsuarioEnCascada(uid, email)
  return { ok: true, uid, email, ...resultado }
})
