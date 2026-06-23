/**
 * @module ServicioAutenticacion
 * @description Servicio para manejar la autenticación de usuarios, incluyendo registro, inicio de sesión y gestión de contraseñas.
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'

import { auth } from './servicioFirebase'

const googleProvider = new GoogleAuthProvider()

export function registrarse(email, password) {
  return createUserWithEmailAndPassword(auth, email, password)
}

export function iniciarSesion(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

export function iniciarSesionConGoogle() {
  return signInWithPopup(auth, googleProvider)
}

export function restablecerContraseña(email) {
  return sendPasswordResetEmail(auth, email)
}

export function cerrarSesion() {
  return firebaseSignOut(auth)
}

export function enviarVerificacionCorreo() {
  return sendEmailVerification(auth.currentUser)
}

export function escucharCambioEstadoAutenticacion(callback) {
  return onAuthStateChanged(auth, callback)
}

/**
 * Obtiene el usuario actualmente autenticado.
 * @returns {Promise<Object|null>} - Usuario autenticado o null si no hay ninguno.
 */
export function obtenerUsuarioActual() {
  return new Promise((resolve, reject) => {
    const cancelar = onAuthStateChanged(
      auth,
      (usuario) => {
        cancelar()
        resolve(usuario)
      },
      reject,
    )
  })
}

/**
 * Traduce los códigos de error de Firebase a mensajes legibles.
 * @param {Object} error - Error de Firebase.
 * @returns {string} - Mensaje de error legible.
 */
export function mensajeErrorFirebase(error) {
  const codigo = error?.code || ''
  if (codigo === 'auth/wrong-password' || codigo === 'auth/invalid-credential') return 'Contraseña introducida incorrecta.'
  if (codigo === 'auth/email-already-in-use') return 'Ese correo ya está en uso por otra cuenta.'
  if (codigo === 'auth/invalid-email') return 'El correo introducido no tiene un formato válido.'
  if (codigo === 'auth/weak-password') return 'La contraseña es demasiado débil.'
  if (codigo === 'auth/requires-recent-login') return 'Por seguridad, vuelve a iniciar sesión antes de hacer este cambio.'
  return error?.message || 'Error desconocido.'
}
