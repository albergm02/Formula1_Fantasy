import { httpsCallable } from 'firebase/functions'
import { functions } from '@/services/servicioFirebase'

const llamadaMigrarCorreo = httpsCallable(functions, 'migrarCorreoUsuario')
const llamadaEliminarCuenta = httpsCallable(functions, 'eliminarMiCuenta')

export async function migrarCorreoUsuario(correoAnterior, correoNuevo) {
  const respuesta = await llamadaMigrarCorreo({ correoAnterior, correoNuevo })
  return respuesta.data
}

export async function eliminarMiCuenta() {
  const respuesta = await llamadaEliminarCuenta()
  return respuesta.data
}
