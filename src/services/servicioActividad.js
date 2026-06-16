import {
  collection,
  addDoc,
  query,
  where,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './servicioFirebase'

export const TIPOS_ACTIVIDAD = {
  COMPRA: 'compra',
  VENTA: 'venta',
  INCORPORACION: 'incorporacion',
  ABANDONO: 'abandono',
  CLAUSULA: 'clausula',
  CREACION: 'creacion',
}

export const registrarActividad = async (idLiga, { nombreUsuario, tipo, descripcion }) => {
  await addDoc(collection(db, 'actividad'), {
    idLiga,
    nombreUsuario,
    tipo,
    descripcion,
    fecha: serverTimestamp(),
  })
}

export const cargarActividadLiga = async (idLiga, maximo = 30) => {
  const consulta = query(collection(db, 'actividad'), where('idLiga', '==', idLiga), limit(maximo))
  const instantanea = await getDocs(consulta)

  return instantanea.docs
    .map((documento) => ({
      id: documento.id,
      ...documento.data(),
      fecha: documento.data().fecha?.toDate() ?? new Date(),
    }))
    .sort((primero, segundo) => segundo.fecha - primero.fecha)
}
