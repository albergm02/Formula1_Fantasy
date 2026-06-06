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
} from 'firebase/auth'

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { auth, db, functions } from './servicioFirebase'

const llamadaVerificarBloqueo = httpsCallable(functions, 'verificarBloqueoAcceso')
const llamadaRegistrarIntentoFallido = httpsCallable(functions, 'registrarIntentoFallido')
const llamadaReiniciarContador = httpsCallable(functions, 'reiniciarContadorIntentos')

const googleProvider = new GoogleAuthProvider()

/**
 * Registra un nuevo usuario con correo y contraseña en Firebase Auth.
 * @param {string} email - Correo electrónico del nuevo usuario.
 * @param {string} password - Contraseña elegida por el usuario.
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export const registrarse = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password)

/**
 * Autentica a un usuario existente con correo y contraseña.
 * @param {string} email - Correo electrónico del usuario.
 * @param {string} password - Contraseña del usuario.
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export const iniciarSesion = (email, password) => signInWithEmailAndPassword(auth, email, password)

/**
 * Abre el popup de Google para autenticar al usuario.
 * Se usa `signInWithPopup` en lugar de redirect para evitar conflictos
 * con el ciclo de vida de Vue Router.
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export const iniciarSesionConGoogle = () => signInWithPopup(auth, googleProvider)

/**
 * Envía un correo de restablecimiento de contraseña a la dirección indicada.
 * Por seguridad, la vista siempre muestra un mensaje de éxito genérico
 * para no revelar si el correo está o no registrado (protección contra user enumeration).
 * @param {string} email - Correo al que se envía el enlace de recuperación.
 * @returns {Promise<void>}
 */
export const restablecerContraseña = (email) => sendPasswordResetEmail(auth, email)

/**
 * Cierra la sesión del usuario actual en Firebase Auth.
 * @returns {Promise<void>}
 */
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

/**
 * Carga el perfil del usuario desde Firestore usando el UID como clave primaria.
 * Devuelve un objeto vacío si el documento no existe.
 * @param {string} uid - El UID de Firebase Auth que identifica el documento.
 * @returns {Promise<Object>} Datos del perfil o {} si no existe.
 */
export const cargarPerfilUsuario = async (uid) => {
  const docRef = doc(db, 'usuarios', uid)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? docSnap.data() : {}
}

/**
 * Crea un nuevo documento de perfil en la colección 'usuarios' de Firestore.
 * El documento se indexa por el UID de Firebase Auth, no por el correo,
 * de modo que un cambio de email no requiere migrar el documento.
 * @param {string} uid - El UID de Firebase Auth (clave del documento).
 * @param {string} correoUsuario - El correo del usuario (guardado como campo).
 * @param {string} nombreUsuario - El nombre visible elegido por el usuario.
 * @returns {Promise<void>}
 */
export const crearPerfilUsuario = async (uid, correoUsuario, nombreUsuario) => {
  const docRef = doc(db, 'usuarios', uid)
  await setDoc(docRef, {
    correoAutenticacion: correoUsuario,
    nombre: nombreUsuario,
    ligasIds: [],
    fechaRegistro: serverTimestamp(),
    contadorIntentosFallidos: 0,
    fechaBloqueoDeSesion: null,
  })
}

/**
 * Busca el UID del documento de usuario a partir de su correo electrónico.
 * Se usa como puente hacia datos históricos donde solo se dispone del correo
 * (p.ej. expulsión de participantes con participaciones antiguas sin uid_usuario).
 * @param {string} correo - Correo electrónico a buscar.
 * @returns {Promise<string|null>} El UID del usuario o null si no existe.
 */
export const buscarUidPorCorreo = async (correo) => {
  const consulta = query(
    collection(db, 'usuarios'),
    where('correoAutenticacion', '==', correo.trim().toLowerCase()),
    limit(1),
  )
  const instantanea = await getDocs(consulta)
  if (instantanea.empty) return null
  return instantanea.docs[0].id
}

/**
 * Reautentica al usuario actual. Si se autentica con contraseña usa la
 * credencial aportada; si se autenticó con Google, abre el popup de Google.
 * @param {string} [contrasenaActual] - Obligatoria solo para usuarios password.
 * @returns {Promise<void>}
 */
export const reautenticarUsuario = async (contrasenaActual) => {
  const usuario = auth.currentUser
  if (!usuario) throw new Error('No hay sesión activa.')

  const tieneContrasena = usuario.providerData.some((p) => p.providerId === 'password')

  if (!tieneContrasena) {
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
  const docRef = doc(db, 'usuarios', usuario.uid)
  await updateDoc(docRef, { fechaUltimoCambioContrasena: serverTimestamp() })
}

const MAXIMO_INTENTOS_FALLIDOS = 5
const DURACION_BLOQUEO_MINUTOS = 5

/**
 * Verifica si el correo tiene un bloqueo temporal activo por intentos fallidos.
 * Delega en la Cloud Function `verificarBloqueoAcceso` que opera con permisos de administrador.
 * Lanza un error con los minutos restantes si el bloqueo sigue vigente.
 * @param {string} correo - Correo del usuario a verificar.
 * @returns {Promise<void>}
 */
export const verificarBloqueoAcceso = async (correo) => {
  try {
    await llamadaVerificarBloqueo({ correo: correo.trim().toLowerCase() })
  } catch (error) {
    throw new Error(error.message)
  }
}

/**
 * Registra un intento fallido de inicio de sesión.
 * Al alcanzar el máximo de intentos, activa un bloqueo temporal de 5 minutos.
 * Delega en la Cloud Function `registrarIntentoFallido` que opera con permisos de administrador.
 * @param {string} correo - Correo del usuario que falló el intento.
 * @returns {Promise<void>}
 */
export const registrarIntentoFallido = async (correo) => {
  await llamadaRegistrarIntentoFallido({ correo: correo.trim().toLowerCase() }).catch(() => {})
}

/**
 * Reinicia el contador de intentos fallidos tras un inicio de sesión exitoso.
 * Delega en la Cloud Function `reiniciarContadorIntentos` que identifica al usuario
 * por su UID desde el token de autenticación; no requiere parámetros adicionales.
 * @returns {Promise<void>}
 */
export const reiniciarContadorIntentos = async () => {
  await llamadaReiniciarContador({}).catch(() => {})
}

/**
 * Registra un observador en tiempo real sobre el documento de perfil del usuario.
 * Invoca el callback con los datos actualizados cada vez que Firestore notifica un cambio.
 * Usado para detectar expulsiones de ligas sin necesidad de recargar la página.
 * @param {string} uid - El UID de Firebase Auth (clave del documento en /usuarios).
 * @param {function} callback - Recibe los datos del perfil en cada cambio.
 * @returns {function} Función para cancelar el observador (unsubscribe).
 */
export const escucharPerfilUsuario = (uid, callback) =>
  onSnapshot(doc(db, 'usuarios', uid), (instantanea) => {
    if (instantanea.exists()) callback(instantanea.data())
  })
