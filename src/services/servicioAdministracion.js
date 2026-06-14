import { httpsCallable } from 'firebase/functions'
import { collection, getDocs } from 'firebase/firestore'
import { db, functions } from '@/services/servicioFirebase'

const llamadaEliminarLiga = httpsCallable(functions, 'eliminarLigaManual')
const llamadaEliminarUsuario = httpsCallable(functions, 'eliminarUsuarioManual')

export async function eliminarLigaComoAdministrador(idLiga) {
  const respuesta = await llamadaEliminarLiga({ idLiga })
  return respuesta.data
}

export async function eliminarUsuarioComoAdministrador(uid) {
  const respuesta = await llamadaEliminarUsuario({ uid })
  return respuesta.data
}

export async function cargarListaLigas() {
  const snap = await getDocs(collection(db, 'ligas'))
  return snap.docs.map((d) => ({
    id: d.id,
    nombre: d.data().nombre || d.id,
    organizador: d.data().correoOrganizador || '',
    participantes: d.data().participantes ?? 0,
    fechaCreacion: d.data().fecha_creacion?.toDate() ?? null,
  }))
}

export async function cargarListaUsuarios() {
  const snap = await getDocs(collection(db, 'usuarios'))
  return snap.docs
    .map((d) => ({
      uid: d.id,
      email: d.data().correoAutenticacion || '',
      nombre: d.data().nombre || d.id,
      esAdministrador: d.data().esAdministrador === true,
      fechaRegistro: d.data().fechaRegistro?.toDate() ?? null,
    }))
    .filter((u) => !u.esAdministrador)
    .map((u) => ({ ...u, etiqueta: `${u.nombre} (${u.email})` }))
}
