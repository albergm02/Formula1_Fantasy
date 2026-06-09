/**
 * Servicio de perfil — wrappers de Callable Functions que tocan
 * datos persistentes del usuario (correo, baja de cuenta).
 *
 * Las operaciones sensibles (cambio de correo y baja) requieren que
 * el cliente haya reautenticado al usuario justo antes de llamarlas.
 *
 * @module servicioPerfil
 */

import { httpsCallable } from 'firebase/functions'
import { functions } from '@/services/servicioFirebase'

const llamadaMigrarCorreo = httpsCallable(functions, 'migrarCorreoUsuario')
const llamadaEliminarCuenta = httpsCallable(functions, 'eliminarMiCuenta')

/**
 * Migra los documentos Firestore (usuarios, participaciones, ligas) tras
 * un cambio de correo en Firebase Auth.
 * @param {string} correoAnterior
 * @param {string} correoNuevo
 * @returns {Promise<{ ok: boolean, correoNuevo: string, participacionesMigradas: number, ligasMigradas: number }>}
 */
export async function migrarCorreoUsuario(correoAnterior, correoNuevo) {
  const respuesta = await llamadaMigrarCorreo({ correoAnterior, correoNuevo })
  return respuesta.data
}

/**
 * Elimina la cuenta en cascada (Firestore + Firebase Auth).
 * @returns {Promise<{ ok: boolean, email: string, participacionesBorradas: number }>}
 */
export async function eliminarMiCuenta() {
  const respuesta = await llamadaEliminarCuenta()
  return respuesta.data
}
