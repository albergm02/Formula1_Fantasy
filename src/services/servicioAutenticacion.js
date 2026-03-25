/* Servicios de autenticaciÃ³n utilizando Firebase Authentication */
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

/* InicializaciÃ³n del proveedor de autenticaciÃ³n de Google */
const googleProvider = new GoogleAuthProvider()

/* Funciones de autenticaciÃ³n */
export const registrarse = (email, password) => createUserWithEmailAndPassword(auth, email, password)
export const iniciarSesion = (email, password) => signInWithEmailAndPassword(auth, email, password)

export const iniciarSesionConGoogle = () => signInWithPopup(auth, googleProvider)

export const restablecerContrasena = (email) => sendPasswordResetEmail(auth, email)
export const cerrarSesion = () => firebaseSignOut(auth)

/* Listener de estado de autenticaciÃ³n */
export const escucharCambioEstadoAutenticacion = (callback) => onAuthStateChanged(auth, callback)

