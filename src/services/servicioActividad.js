import { collection, query, limit, getDocs } from 'firebase/firestore'
import { db } from './servicioFirebase'

/**
 * Devuelve los últimos eventos de actividad de una liga, ordenados por fecha desc.
 * @param {string} idLiga
 * @param {number} [maximo=30]
 */
export const cargarActividadLiga = async (idLiga, maximo = 30) => {
  const consulta = query(collection(db, 'actividad', idLiga, 'eventos'), limit(maximo))
  const instantanea = await getDocs(consulta)

  return instantanea.docs
    .map((documento) => ({
      ...documento.data(),
      fecha: documento.data().fecha?.toDate() ?? new Date(),
    }))
    .sort((primero, segundo) => segundo.fecha - primero.fecha)
}
