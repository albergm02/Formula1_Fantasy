/* Servicios de autenticación utilizando Firebase Authentication */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { auth } from './servicioFirebase'

/* Inicialización del proveedor de autenticación de Google */
const googleProvider = new GoogleAuthProvider()

/* Funciones de autenticación */
export const registrarse = (email, password) => createUserWithEmailAndPassword(auth, email, password)
export const iniciarSesion = (email, password) => signInWithEmailAndPassword(auth, email, password)

export const iniciarSesionConGoogle = () => signInWithPopup(auth, googleProvider)

export const restablecerContraseña = (email) => sendPasswordResetEmail(auth, email)
export const cerrarSesion = () => firebaseSignOut(auth)

/* Listener de estado de autenticación */
export const escucharCambioEstadoAutenticacion = (callback) => onAuthStateChanged(auth, callback)

