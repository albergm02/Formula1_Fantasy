/**
 * Servicio del feed de actividad de liga.
 * Cada acción relevante de un jugador (compra, venta, incorporación, abandono)
 * genera un documento en la colección 'actividad' de Firestore.
 * La vista de notificaciones muestra este feed ordenado cronológicamente.
 *
 * Esquema del documento:
 *   { idLiga, nombreUsuario, tipo, descripcion, fecha: Timestamp }
 *
 * @module servicioNotificaciones
 */
import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from './servicioFirebase'

/* ─── Tipos de actividad ────────────────────────────────────────────────── */

export const TIPOS_ACTIVIDAD = {
  COMPRA: 'compra',
  VENTA: 'venta',
  INCORPORACION: 'incorporacion',
  ABANDONO: 'abandono',
}

/* ─── Exportaciones públicas ────────────────────────────────────────────── */

/**
 * Registra un evento de actividad para una liga.
 * Debe llamarse desde los stores tras completar con éxito la operación correspondiente.
 * @param {string} idLiga
 * @param {{ nombreUsuario: string, tipo: string, descripcion: string }} datos
 * @returns {Promise<void>}
 */
export const registrarActividad = async (idLiga, { nombreUsuario, tipo, descripcion }) => {
  await addDoc(collection(db, 'actividad'), {
    idLiga,
    nombreUsuario,
    tipo,
    descripcion,
    fecha: serverTimestamp(),
  })
}

/**
 * Carga los últimos movimientos de una liga ordenados por fecha descendente.
 * @param {string} idLiga
 * @param {number} [maximo=30] - Número máximo de eventos a cargar.
 * @returns {Promise<Array<{ id: string, idLiga: string, nombreUsuario: string, tipo: string, descripcion: string, fecha: Date }>>}
 */
export const cargarActividadLiga = async (idLiga, maximo = 30) => {
  const consulta = query(
    collection(db, 'actividad'),
    where('idLiga', '==', idLiga),
    orderBy('fecha', 'desc'),
    limit(maximo),
  )

  const instantanea = await getDocs(consulta)

  return instantanea.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
    fecha: documento.data().fecha?.toDate() ?? new Date(),
  }))
}

