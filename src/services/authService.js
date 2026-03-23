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
import { auth } from './firebase'

/* Inicialización del proveedor de autenticación de Google */
const googleProvider = new GoogleAuthProvider()

/* Funciones de autenticación */
export const signUp = (email, password) => createUserWithEmailAndPassword(auth, email, password)
export const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password)

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider)

export const resetPassword = (email) => sendPasswordResetEmail(auth, email)
export const signOut = () => firebaseSignOut(auth)

/* Listener de estado de autenticación */
export const onAuthStateChangedListener = (callback) => onAuthStateChanged(auth, callback)
