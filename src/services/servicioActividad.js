import {
  collection,
  query,
  where,
  limit,
  getDocs,
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

/**
 * Devuelve los últimos eventos de actividad de una liga, ordenados por fecha desc.
 * @param {string} idLiga
 * @param {number} [maximo=30]
 */
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
