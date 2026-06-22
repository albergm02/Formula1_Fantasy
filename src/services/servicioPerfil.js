import {
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendPasswordResetEmail,
  verifyBeforeUpdateEmail,
} from 'firebase/auth'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'

import { auth, db, functions } from '@/services/servicioFirebase'

const googleProvider = new GoogleAuthProvider()

const llamadaMigrarCorreo = httpsCallable(functions, 'migrarCorreo')
const llamadaEliminarCuenta = httpsCallable(functions, 'eliminarMiCuenta')
const llamadaAutorizarCambioCorreo = httpsCallable(functions, 'autorizarCambioCorreo')
const llamadaCrearPerfil = httpsCallable(functions, 'crearPerfil')

export const migrarCorreo = async (correoAnterior, correoNuevo) => {
  const respuesta = await llamadaMigrarCorreo({ correoAnterior, correoNuevo })
  return respuesta.data
}

export const eliminarMiCuenta = async () => {
  const respuesta = await llamadaEliminarCuenta()
  return respuesta.data
}

export const crearPerfil = (nombreUsuario) => llamadaCrearPerfil({ nombreUsuario })

export const cargarPerfilUsuario = async (uid) => {
  const docSnap = await getDoc(doc(db, 'usuarios', uid))
  return docSnap.exists() ? docSnap.data() : {}
}

export const escucharPerfilUsuario = (uid, callback) =>
  onSnapshot(doc(db, 'usuarios', uid), (instantanea) => {
    if (instantanea.exists()) callback(instantanea.data())
  })

export const reautenticarUsuario = async (contrasenaActual) => {
  const usuario = auth.currentUser
  if (!usuario) throw new Error('No hay sesión activa.')

  const tieneContrasena = usuario.providerData.some((p) => p.providerId === 'password')

  if (!tieneContrasena) {
    await reauthenticateWithPopup(usuario, googleProvider)
    await usuario.getIdToken(true)
    return
  }

  if (!contrasenaActual) throw new Error('Debes introducir tu contraseña actual.')
  const credencial = EmailAuthProvider.credential(usuario.email, contrasenaActual)
  await reauthenticateWithCredential(usuario, credencial)
  await usuario.getIdToken(true)
}

export const solicitarRestablecimientoContrasena = async () => {
  const usuario = auth.currentUser
  if (!usuario) throw new Error('No hay sesión activa.')
  await sendPasswordResetEmail(auth, usuario.email)
}

export const solicitarCambioCorreo = async (correoNuevo) => {
  const usuario = auth.currentUser
  if (!usuario) throw new Error('No hay sesión activa.')
  await llamadaAutorizarCambioCorreo()
  await verifyBeforeUpdateEmail(usuario, correoNuevo.trim().toLowerCase())
}
