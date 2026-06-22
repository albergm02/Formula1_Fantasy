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

export const registrarse = (email, password) => createUserWithEmailAndPassword(auth, email, password)

export const iniciarSesion = (email, password) => signInWithEmailAndPassword(auth, email, password)

export const iniciarSesionConGoogle = () => signInWithPopup(auth, googleProvider)

export const restablecerContraseña = (email) => sendPasswordResetEmail(auth, email)

export const cerrarSesion = () => firebaseSignOut(auth)

export const enviarVerificacionCorreo = () => sendEmailVerification(auth.currentUser)

export const escucharCambioEstadoAutenticacion = (callback) => onAuthStateChanged(auth, callback)

export const obtenerUsuarioActual = () =>
  new Promise((resolve, reject) => {
    const cancelar = onAuthStateChanged(
      auth,
      (usuario) => {
        cancelar()
        resolve(usuario)
      },
      reject,
    )
  })

export function mensajeErrorFirebase(error) {
  const codigo = error?.code || ''
  if (codigo === 'auth/wrong-password' || codigo === 'auth/invalid-credential') return 'Contraseña introducida incorrecta.'
  if (codigo === 'auth/email-already-in-use') return 'Ese correo ya está en uso por otra cuenta.'
  if (codigo === 'auth/invalid-email') return 'El correo introducido no tiene un formato válido.'
  if (codigo === 'auth/weak-password') return 'La contraseña es demasiado débil.'
  if (codigo === 'auth/requires-recent-login') return 'Por seguridad, vuelve a iniciar sesión antes de hacer este cambio.'
  return error?.message || 'Error desconocido.'
}
