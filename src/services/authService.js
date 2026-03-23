/* Servicios de autenticación utilizando Firebase Authentication */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo,
} from 'firebase/auth'
import { auth } from './firebase'

/* Inicialización del proveedor de autenticación de Google */
const googleProvider = new GoogleAuthProvider()

/* Funciones de autenticación */
export const signUp = (email, password) => createUserWithEmailAndPassword(auth, email, password)
export const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password)
export const signInWithGoogle = async () => {
  // Compruebo si el usuario es nuevo o no para pedir información adicional en caso de ser nuevo
  const result = await signInWithPopup(auth, googleProvider)
  const additionalInfo = getAdditionalUserInfo(result)
  return {
    user: result.user,
    isNewUser: additionalInfo.isNewUser,
  }
}
export const resetPassword = (email) => sendPasswordResetEmail(auth, email)
export const signOut = () => firebaseSignOut(auth)

/* Listener de estado de autenticación */
// Detecta cambios en el estado de autenticación del usuario (inicio/cierre de sesión)
export const onAuthStateChangedListener = (callback) => onAuthStateChanged(auth, callback)
