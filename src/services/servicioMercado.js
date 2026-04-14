/**
 * Servicio del mercado diario.
 * Centraliza las lecturas de Firestore relacionadas con el mercado de cartas.
 * Los stores importan únicamente desde este módulo; nunca desde Firebase directamente.
 *
 * Esquema leído → mercados/{idLiga}_{YYYY-MM-DD}:
 *   { idLiga, estado, fechaApertura, fechaCierre, totalCartas, cartas[] }
 *
 * @module servicioMercado
 */
import { doc, getDoc } from 'firebase/firestore'
import { db } from './servicioFirebase'

/* ─── Utilidades ────────────────────────────────────────────────────────── */

/**
 * Calcula el ID del documento de mercado para una liga y fecha dadas.
 * Formato: '{idLiga}_{YYYY-MM-DD}' (coincide con el ID que genera la Cloud Function).
 * @param {string} idLiga
 * @param {Date} fecha
 * @returns {string} Ej: 'xi060FGM9iG33KvBuBQv_2026-04-14'
 */
export const calcularIdMercado = (idLiga, fecha = new Date()) => {
  const fechaStr = fecha.toISOString().split('T')[0]
  return `${idLiga}_${fechaStr}`
}

/* ─── Consultas al mercado ──────────────────────────────────────────────── */

/**
 * Carga el mercado activo de hoy para una liga específica.
 * Usa lectura directa por ID del documento (sin query compuesta ni índices).
 * Devuelve null si no existe o si el mercado ya está cerrado.
 * @param {string} idLiga - ID de la liga activa del usuario.
 * @returns {Promise<Object|null>}
 */
export const cargarMercadoActivo = async (idLiga) => {
  const idMercado = calcularIdMercado(idLiga)
  const documento = await getDoc(doc(db, 'mercados', idMercado))

  if (!documento.exists()) return null

  const datos = documento.data()
  if (datos.estado !== 'abierto') return null

  return { id: documento.id, ...datos }
}
