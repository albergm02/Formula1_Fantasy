/**
 * Servicio de administración — wrappers de las Callable Functions
 * para operaciones destructivas reservadas al administrador global.
 *
 * Todas las funciones requieren que el usuario autenticado tenga el flag
 * `esAdministrador === true` en `usuarios/{uid}`. El backend rechaza
 * la llamada con `permission-denied` en caso contrario.
 *
 * @module servicioAdministracion
 */

import { httpsCallable } from 'firebase/functions'
import { collection, getDocs } from 'firebase/firestore'
import { db, functions } from '@/services/servicioFirebase'

const llamadaEliminarLiga = httpsCallable(functions, 'eliminarLigaManual')
const llamadaEliminarUsuario = httpsCallable(functions, 'eliminarUsuarioManual')

/**
 * ELIMINACIÓN COMPLETA de una liga por parte del administrador global.
 * Borra la liga, sus participaciones, mercados, pujas y actividad, y la
 * desvincula del array `ligasIds` de todos los usuarios.
 * Operación destructiva e irreversible.
 * @param {string} idLiga
 * @returns {Promise<Object>} { ok, idLiga, nombreLiga, participacionesBorradas, mercadosBorrados, eventosActividadBorrados, usuariosDesvinculados }
 */
export async function eliminarLigaComoAdministrador(idLiga) {
  const respuesta = await llamadaEliminarLiga({ idLiga })
  return respuesta.data
}

/**
 * ELIMINACIÓN COMPLETA de un usuario por parte del administrador global.
 * Borra su perfil, participaciones, pujas activas y el usuario de Firebase Auth,
 * desvinculando lo de todas sus ligas (con cesión de admin o borrado de liga
 * si quedaba como único participante).
 * Operación destructiva e irreversible.
 * @param {string} uid - UID de Firebase Auth del usuario a eliminar.
 * @returns {Promise<Object>} { ok, uid, email, participacionesBorradas, ligasBorradas }
 */
export async function eliminarUsuarioComoAdministrador(uid) {
  const respuesta = await llamadaEliminarUsuario({ uid })
  return respuesta.data
}

/**
 * Carga la lista de todas las ligas existentes para el panel de administración.
 * @returns {Promise<Array<{ id: string, nombre: string }>>}
 */
export async function cargarListaLigas() {
  const snap = await getDocs(collection(db, 'ligas'))
  return snap.docs.map((d) => ({ id: d.id, nombre: d.data().nombre || d.id }))
}

/**
 * Carga la lista de usuarios no administradores para el panel de administración.
 * El documento en Firestore se indexa por UID; el correo se extrae del campo correoAutenticacion.
 * @returns {Promise<Array<{ uid: string, email: string, nombre: string, etiqueta: string }>>}
 */
export async function cargarListaUsuarios() {
  const snap = await getDocs(collection(db, 'usuarios'))
  return snap.docs
    .map((d) => ({
      uid: d.id,
      email: d.data().correoAutenticacion || '',
      nombre: d.data().nombre || d.id,
      esAdministrador: d.data().esAdministrador === true,
      fechaRegistro: d.data().fechaRegistro?.toDate() ?? null,
    }))
    .filter((u) => !u.esAdministrador)
    .map((u) => ({ ...u, etiqueta: `${u.nombre} (${u.email})` }))
}
