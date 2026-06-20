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

import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './servicioFirebase'

const googleProvider = new GoogleAuthProvider()

export const guardarNuevoUsuario = async (uid, correoUsuario, nombreUsuario) => {
  await setDoc(doc(db, 'usuarios', uid), {
    correoAutenticacion: correoUsuario,
    nombre: nombreUsuario,
    ligasIds: [],
    fechaRegistro: serverTimestamp(),
  })
}

export const registrarse = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password)

export const iniciarSesion = (email, password) => signInWithEmailAndPassword(auth, email, password)

/** Popup en lugar de redirect para no romper el ciclo de vida de Vue Router. */
export const iniciarSesionConGoogle = () => signInWithPopup(auth, googleProvider)

export const restablecerContraseña = (email) => sendPasswordResetEmail(auth, email)

export const cerrarSesion = () => firebaseSignOut(auth)

export const enviarVerificacionCorreo = () => sendEmailVerification(auth.currentUser)

export const escucharCambioEstadoAutenticacion = (callback) => onAuthStateChanged(auth, callback)

/** Lectura puntual del usuario (resuelve y cancela el observador en el acto). */
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

/**
 * Traduce códigos de error de Firebase Auth a mensajes legibles en español.
 * @param {Error} error
 * @returns {string}
 */
export function mensajeErrorFirebase(error) {
  const codigo = error?.code || ''
  if (codigo === 'auth/wrong-password' || codigo === 'auth/invalid-credential')
    return 'Contraseña introducida incorrecta.'
  if (codigo === 'auth/email-already-in-use') return 'Ese correo ya está en uso por otra cuenta.'
  if (codigo === 'auth/invalid-email') return 'El correo introducido no tiene un formato válido.'
  if (codigo === 'auth/weak-password') return 'La contraseña es demasiado débil.'
  if (codigo === 'auth/requires-recent-login')
    return 'Por seguridad, vuelve a iniciar sesión antes de hacer este cambio.'
  return error?.message || 'Error desconocido.'
}
