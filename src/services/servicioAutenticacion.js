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
import { httpsCallable } from 'firebase/functions'
import { auth, db, functions } from './servicioFirebase'

const llamadaVerificarBloqueo = httpsCallable(functions, 'verificarBloqueo')
const llamadaRegistrarFallo = httpsCallable(functions, 'registrarFallo')
const llamadaReiniciarFallos = httpsCallable(functions, 'reiniciarFallos')

const googleProvider = new GoogleAuthProvider()

export const guardarNuevoUsuario = async (uid, correoUsuario, nombreUsuario) => {
  await setDoc(doc(db, 'usuarios', uid), {
    correoAutenticacion: correoUsuario,
    nombre: nombreUsuario,
    ligasIds: [],
    fechaRegistro: serverTimestamp(),
    contadorIntentosFallidos: 0,
    fechaBloqueoDeSesion: null,
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

export const verificarBloqueo = async (correo) => {
  try {
    await llamadaVerificarBloqueo({ correo: correo.trim().toLowerCase() })
  } catch (error) {
    throw new Error(error.message)
  }
}

export const registrarFallo = async (correo) => {
  await llamadaRegistrarFallo({ correo: correo.trim().toLowerCase() }).catch(() => {})
}

export const reiniciarFallos = async () => {
  await llamadaReiniciarFallos({}).catch(() => {})
}
