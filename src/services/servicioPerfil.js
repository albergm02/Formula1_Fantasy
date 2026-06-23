import {
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendPasswordResetEmail,
  verifyBeforeUpdateEmail,
} from 'firebase/auth'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'

import { auth, db, functions } from '@/services/servicioFirebase'

const googleProvider = new GoogleAuthProvider()

const llamadaMigrarCorreo = httpsCallable(functions, 'migrarCorreo')
const llamadaEliminarCuenta = httpsCallable(functions, 'eliminarMiCuenta')
const llamadaAutorizarCambioCorreo = httpsCallable(functions, 'autorizarCambioCorreo')
const llamadaCrearPerfil = httpsCallable(functions, 'crearPerfil')

/**
 * Migra el correo de un usuario.
 * @param {string} correoAnterior - Correo electrónico anterior.
 * @param {string} correoNuevo - Correo electrónico nuevo.
 * @returns {Promise<Object>} - Resultado de la operación.
 */
export const migrarCorreo = async (correoAnterior, correoNuevo) => {
  const respuesta = await llamadaMigrarCorreo({ correoAnterior, correoNuevo })
  return respuesta.data
}

/**
 * Elimina la cuenta del usuario actual.
 * @returns {Promise<Object>} - Resultado de la operación.
 */
export const eliminarMiCuenta = async () => {
  const respuesta = await llamadaEliminarCuenta()
  return respuesta.data
}

/**
 * Crea un perfil de usuario.
 * @param {string} nombreUsuario - Nombre del usuario.
 * @returns {Promise<Object>} - Resultado de la operación.
 */
export const crearPerfil = (nombreUsuario) => llamadaCrearPerfil({ nombreUsuario })

/**
 * Carga el perfil de un usuario.
 * @param {string} uid - ID del usuario.
 * @returns {Promise<Object>} - Datos del perfil del usuario.
 */
export const cargarPerfilUsuario = async (uid) => {
  const docSnap = await getDoc(doc(db, 'usuarios', uid))
  return docSnap.exists() ? docSnap.data() : {}
}

/**
 * Escucha los cambios en el perfil de un usuario.
 * @param {string} uid - ID del usuario.
 * @param {Function} callback - Función a ejecutar cuando cambien los datos del perfil.
 * @returns {Function} - Función para cancelar la suscripción.
 */
export const escucharPerfilUsuario = (uid, callback) =>
  onSnapshot(doc(db, 'usuarios', uid), (instantanea) => {
    if (instantanea.exists()) callback(instantanea.data())
  })

/**
 * Reautentica al usuario actual.
 * @param {string} contrasenaActual - Contraseña actual del usuario.
 * @returns {Promise<void>}
 */
export const reautenticarUsuario = async (contrasenaActual) => {
  const usuario = auth.currentUser
  if (!usuario) throw new Error('No hay sesión activa.')

  const tieneContrasena = usuario.providerData.some((p) => p.providerId === 'password')

  if (!tieneContrasena) {
    await reauthenticateWithPopup(usuario, googleProvider)
    await usuario.getIdToken(true)
    return
  }

  if (!contrasenaActual) throw new Error('Debes introducir tu contraseña actual.')
  const credencial = EmailAuthProvider.credential(usuario.email, contrasenaActual)
  await reauthenticateWithCredential(usuario, credencial)
  await usuario.getIdToken(true)
}

/**
 * Solicita el restablecimiento de la contraseña del usuario actual.
 * @returns {Promise<void>}
 */
export const solicitarRestablecimientoContrasena = async () => {
  const usuario = auth.currentUser
  if (!usuario) throw new Error('No hay sesión activa.')
  await sendPasswordResetEmail(auth, usuario.email)
}

/**
 * Solicita el cambio de correo electrónico del usuario actual.
 * @param {string} correoNuevo - Nuevo correo electrónico.
 * @returns {Promise<void>}
 */
export const solicitarCambioCorreo = async (correoNuevo) => {
  const usuario = auth.currentUser
  if (!usuario) throw new Error('No hay sesión activa.')
  await llamadaAutorizarCambioCorreo()
  await verifyBeforeUpdateEmail(usuario, correoNuevo.trim().toLowerCase())
}
