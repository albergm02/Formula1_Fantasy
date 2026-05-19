/**
 * Acceso a las jornadas procesadas en Firestore.
 * @module servicioJornada
 */

import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore'
import { db } from '@/services/servicioFirebase'

/**
 * Suscribe al historial de jornadas procesadas (más recientes primero).
 * @param {(jornadas: Array<Object>) => void} alActualizar
 * @param {number} [limiteJornadas=24]
 * @returns {() => void}
 */
export function suscribirseHistorialJornadas(alActualizar, limiteJornadas = 24) {
  const consulta = query(
    collection(db, 'jornadas'),
    orderBy('fechaProcesamiento', 'desc'),
    limit(limiteJornadas),
  )

  return onSnapshot(consulta, (resultados) => {
    const jornadas = resultados.docs.map((documento) => ({
      id: documento.id,
      ...documento.data(),
    }))
    alActualizar(jornadas)
  })
}
