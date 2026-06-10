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
  verifyBeforeUpdateEmail,
} from 'firebase/auth'

import {
  doc,
  getDoc,
  setDoc,
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
const llamadaAutorizarCambioCorreo = httpsCallable(functions, 'autorizarCambioCorreo')

const googleProvider = new GoogleAuthProvider()

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

export const cargarPerfilUsuario = async (uid) => {
  const docSnap = await getDoc(doc(db, 'usuarios', uid))
  return docSnap.exists() ? docSnap.data() : {}
}

export const crearPerfilUsuario = async (uid, correoUsuario, nombreUsuario) => {
  await setDoc(doc(db, 'usuarios', uid), {
    correoAutenticacion: correoUsuario,
    nombre: nombreUsuario,
    ligasIds: [],
    fechaRegistro: serverTimestamp(),
    contadorIntentosFallidos: 0,
    fechaBloqueoDeSesion: null,
  })
}

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
 * Reautentica al usuario actual. Si entró por contraseña usa la credencial
 * indicada; si entró por Google, abre el popup de Google.
 */
export const reautenticarUsuario = async (contrasenaActual) => {
  const usuario = auth.currentUser
  if (!usuario) throw new Error('No hay sesión activa.')

  const tieneContrasena = usuario.providerData.some((p) => p.providerId === 'password')

  if (!tieneContrasena) {
    await reauthenticateWithPopup(usuario, googleProvider)
    await usuario.getIdToken(true)
    return
  }

  if (!contrasenaActual) {
    throw new Error('Debes introducir tu contraseña actual.')
  }
  const credencial = EmailAuthProvider.credential(usuario.email, contrasenaActual)
  await reauthenticateWithCredential(usuario, credencial)
  await usuario.getIdToken(true)
}

export const solicitarRestablecimientoContrasena = async () => {
  const usuario = auth.currentUser
  if (!usuario) throw new Error('No hay sesión activa.')
  await sendPasswordResetEmail(auth, usuario.email)
}

/**
 * El servidor valida la reautenticación reciente y el bloqueo de 7 días; tras
 * autorizar, Firebase envía el enlace de confirmación al correo nuevo. El correo
 * en Auth no cambia hasta que el usuario confirme desde ese enlace.
 */
export const solicitarCambioCorreo = async (correoNuevo) => {
  const usuario = auth.currentUser
  if (!usuario) throw new Error('No hay sesión activa.')
  await llamadaAutorizarCambioCorreo()
  await verifyBeforeUpdateEmail(usuario, correoNuevo.trim().toLowerCase())
}

export const verificarBloqueoAcceso = async (correo) => {
  try {
    await llamadaVerificarBloqueo({ correo: correo.trim().toLowerCase() })
  } catch (error) {
    throw new Error(error.message)
  }
}

export const registrarIntentoFallido = async (correo) => {
  await llamadaRegistrarIntentoFallido({ correo: correo.trim().toLowerCase() }).catch(() => {})
}

export const reiniciarContadorIntentos = async () => {
  await llamadaReiniciarContador({}).catch(() => {})
}

/** Observador en tiempo real del perfil del usuario (detecta expulsiones, etc.). */
export const escucharPerfilUsuario = (uid, callback) =>
  onSnapshot(doc(db, 'usuarios', uid), (instantanea) => {
    if (instantanea.exists()) callback(instantanea.data())
  })
