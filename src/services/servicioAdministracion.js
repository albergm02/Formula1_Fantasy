/**
 * Servicio de administración — wrappers de las Callable Functions
 * para el disparo manual de procesos automatizados (mercado, pujas, jornada).
 *
 * Todas las funciones requieren que el usuario autenticado tenga el flag
 * `esAdministrador === true` en `usuarios/{email}`. El backend rechaza
 * la llamada con `permission-denied` en caso contrario.
 *
 * @module servicioAdministracion
 */

import { httpsCallable } from 'firebase/functions'
import { functions } from '@/services/servicioFirebase'

const llamadaMercado = httpsCallable(functions, 'dispararMercadoDiarioManual')
const llamadaPujas = httpsCallable(functions, 'dispararResolucionPujasManual')
const llamadaJornada = httpsCallable(functions, 'dispararJornadaSemanalManual')
const llamadaReset = httpsCallable(functions, 'resetearLigaManual')
const llamadaSeed = httpsCallable(functions, 'sembrarCatalogoManual')

/**
 * Dispara la generación del mercado diario.
 * @param {string} [idLiga] - Si se omite, procesa todas las ligas.
 * @param {Object} [opciones]
 * @param {boolean} [opciones.forzar=false] - Si true, recrea el mercado de hoy
 *        aunque ya exista (borra pujas previas).
 * @returns {Promise<Object>} { ok, resultados }
 */
export async function dispararGeneracionMercado(idLiga, opciones = {}) {
  const payload = { ...opciones }
  if (idLiga) payload.idLiga = idLiga
  const respuesta = await llamadaMercado(payload)
  return respuesta.data
}

/**
 * Dispara la resolución de pujas y cierre de un mercado concreto.
 * @param {string} idMercado - Ej: 'ligaABC_2026-04-23'
 * @returns {Promise<Object>} { ok, idMercado, estado }
 */
export async function dispararResolucionPujas(idMercado) {
  const respuesta = await llamadaPujas({ idMercado })
  return respuesta.data
}

/**
 * Dispara el procesamiento de la jornada del último GP finalizado.
 * @returns {Promise<Object>} { ok, idJornada, nombreGranPremio, participacionesProcesadas }
 */
export async function dispararProcesamientoJornada() {
  const respuesta = await llamadaJornada()
  return respuesta.data
}

/**
 * RESET COMPLETO de una liga: presupuestos, puntos, garajes, mercados y actividad.
 * Solo testing — operación destructiva e irreversible.
 * @param {string} idLiga
 * @returns {Promise<Object>} { ok, idLiga, participacionesReseteadas, mercadosBorrados, eventosActividadBorrados }
 */
export async function resetearLiga(idLiga) {
  const respuesta = await llamadaReset({ idLiga })
  return respuesta.data
}

/**
 * Siembra (o resiembra) el catálogo de pilotos, coches y potenciadores
 * en Firestore. Necesario una vez por entorno antes de generar mercados.
 * @returns {Promise<Object>} { ok, pilotos, coches, potenciadores, fechaSiembra }
 */
export async function sembrarCatalogo() {
  const respuesta = await llamadaSeed()
  return respuesta.data
}
