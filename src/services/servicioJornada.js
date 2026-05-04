/**
 * Servicio de acceso a las jornadas procesadas en Firestore.
 * Centraliza la lectura del documento `jornadas/{idJornada}` para que las
 * vistas no dependan directamente del SDK de Firebase.
 * @module servicioJornada
 */

import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore'
import { db } from '@/services/servicioFirebase'

/**
 * Suscribe a la jornada más reciente procesada en Firestore.
 * Cada vez que el documento cambia (procesar / reprocesar), invoca el callback
 * con los datos actualizados, permitiendo a la vista refrescarse en vivo.
 * @param {(jornada: Object|null) => void} alActualizar - Callback con la jornada nueva.
 * @returns {() => void} Función de cancelación de la suscripción.
 */
export function suscribirseUltimaJornada(alActualizar) {
  const referenciaColeccion = collection(db, 'jornadas')
  const consulta = query(referenciaColeccion, orderBy('fechaProcesamiento', 'desc'), limit(1))

  return onSnapshot(consulta, (resultados) => {
    if (resultados.empty) {
      alActualizar(null)
      return
    }
    const documento = resultados.docs[0]
    alActualizar({ id: documento.id, ...documento.data() })
  })
}
