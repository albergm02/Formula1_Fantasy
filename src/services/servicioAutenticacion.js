/**
 * Servicio de autenticación y gestión de perfiles de usuario.
 * Centraliza TODAS las llamadas a Firebase Auth y Firestore relacionadas con usuarios.
 * Los stores y vistas importan únicamente desde este módulo; nunca desde Firebase directamente.
 * @module servicioAutenticacion
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
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  updatePassword,
  updateEmail,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from './servicioFirebase'

const googleProvider = new GoogleAuthProvider()

/* ─── Firebase Auth ──────────────────────────────────────────────────────── */

/** @param {string} email @param {string} password @returns {Promise<UserCredential>} */
export const registrarse = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password)

/** @param {string} email @param {string} password @returns {Promise<UserCredential>} */
export const iniciarSesion = (email, password) => signInWithEmailAndPassword(auth, email, password)

/** @returns {Promise<UserCredential>} */
export const iniciarSesionConGoogle = () => signInWithPopup(auth, googleProvider)

/** @param {string} email @returns {Promise<void>} */
export const restablecerContraseña = (email) => sendPasswordResetEmail(auth, email)

/** @returns {Promise<void>} */
export const cerrarSesion = () => firebaseSignOut(auth)

/**
 * Envía un correo de verificación al usuario autenticado actual.
 * @returns {Promise<void>}
 */
export const enviarVerificacionCorreo = () => sendEmailVerification(auth.currentUser)

/**
 * Registra un observador de cambios en el estado de autenticación.
 * @param {function} callback - Función invocada con el usuario actual o null.
 * @returns {function} Función para cancelar el observador (unsubscribe).
 */
export const escucharCambioEstadoAutenticacion = (callback) => onAuthStateChanged(auth, callback)

/**
 * Obtiene el usuario autenticado actual como una promesa de resolución única.
 * Pensado para casos puntuales en los que no es necesario un observador continuo, es decir, en index.js,
 * donde se necesita una lectura puntual del usuario actual.
 * @returns {Promise<import('firebase/auth').User|null>}
 */
export const obtenerUsuarioActual = () =>
  // Creo una promesa que se resuelve con el usuario actual o con null.
  new Promise((resolve, reject) => {
    const cancelar = onAuthStateChanged(
      auth,
      (usuario) => {
        cancelar() // Evito fugas de conexiones cerrando el observador inmediatamente
        resolve(usuario)
      },
      reject,
    )
  })

/* ─── Firestore – Perfiles de usuario ───────────────────────────────────── */

/**
 * Carga el perfil del usuario desde Firestore.
 * Devuelve un objeto vacío si el documento no existe.
 * @param {string} correoUsuario - El correo que actúa como identificador del documento.
 * @returns {Promise<Object>} Datos del perfil o {} si no existe.
 */
export const cargarPerfilUsuario = async (correoUsuario) => {
  const docRef = doc(db, 'usuarios', correoUsuario)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? docSnap.data() : {}
}

/**
 * Crea un nuevo documento de perfil en la colección 'usuarios' de Firestore.
 * @param {string} correoUsuario - El correo del usuario (usado como ID del documento).
 * @param {string} nombreUsuario - El nombre visible elegido por el usuario.
 * @returns {Promise<void>}
 */
export const crearPerfilUsuario = async (correoUsuario, nombreUsuario) => {
  const docRef = doc(db, 'usuarios', correoUsuario)
  await setDoc(docRef, {
    correoAutenticacion: correoUsuario,
    nombre: nombreUsuario,
    ligasIds: [],
  })
}

/* ─── Acciones sensibles del perfil (reautenticación obligatoria) ─────── */

/**
 * Reautentica al usuario actual. Si se autentica con contraseña usa la
 * credencial aportada; si se autenticó con Google, abre el popup de Google.
 * @param {string} [contrasenaActual] - Obligatoria solo para usuarios password.
 * @returns {Promise<void>}
 */
export const reautenticarUsuario = async (contrasenaActual) => {
  const usuario = auth.currentUser
  if (!usuario) throw new Error('No hay sesión activa.')

  const proveedor = usuario.providerData[0]?.providerId
  if (proveedor === 'google.com') {
    await reauthenticateWithPopup(usuario, googleProvider)
    return
  }

  if (!contrasenaActual) {
    throw new Error('Debes introducir tu contraseña actual.')
  }
  const credencial = EmailAuthProvider.credential(usuario.email, contrasenaActual)
  await reauthenticateWithCredential(usuario, credencial)
}

/**
 * Cambia la contraseña del usuario actual. Requiere reautenticación previa.
 * @param {string} contrasenaNueva
 * @returns {Promise<void>}
 */
export const cambiarContrasenaUsuario = async (contrasenaNueva) => {
  const usuario = auth.currentUser
  if (!usuario) throw new Error('No hay sesión activa.')
  await updatePassword(usuario, contrasenaNueva)
}

/**
 * Cambia el correo del usuario actual en Firebase Auth y envía verificación
 * al nuevo correo. La migración de documentos Firestore se hace después
 * llamando a la callable `migrarCorreoUsuario`.
 * @param {string} correoNuevo
 * @returns {Promise<void>}
 */
export const cambiarCorreoUsuario = async (correoNuevo) => {
  const usuario = auth.currentUser
  if (!usuario) throw new Error('No hay sesión activa.')
  await updateEmail(usuario, correoNuevo)
  await usuario.reload()
  await sendEmailVerification(usuario)
}
