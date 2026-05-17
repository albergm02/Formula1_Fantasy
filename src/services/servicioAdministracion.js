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

const llamadaPujas = httpsCallable(functions, 'dispararResolucionPujasManual')
const llamadaJornada = httpsCallable(functions, 'dispararJornadaSemanalManual')
const llamadaReset = httpsCallable(functions, 'resetearLigaManual')
const llamadaObtenerRachas = httpsCallable(functions, 'obtenerRachasPilotos')
const llamadaGuardarRachas = httpsCallable(functions, 'guardarRachasPilotos')
const llamadaObtenerRachasCoches = httpsCallable(functions, 'obtenerRachasCoches')
const llamadaGuardarRachasCoches = httpsCallable(functions, 'guardarRachasCoches')

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
 * @param {Object} [opciones]
 * @param {boolean} [opciones.forzar=false] - Si true, reprocesa la jornada
 *        aunque ya exista, revirtiendo los puntos y premio previos.
 * @returns {Promise<Object>} { ok, idJornada, nombreGranPremio, participacionesProcesadas }
 */
export async function dispararProcesamientoJornada(opciones = {}) {
  const respuesta = await llamadaJornada(opciones)
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
 * Lee la racha actual asignada a cada piloto desde `catalogo/rachas`.
 * @returns {Promise<{ ok: boolean, rachas: Object<string, number> }>}
 */
export async function obtenerRachasPilotos() {
  const respuesta = await llamadaObtenerRachas()
  return respuesta.data
}

/**
 * Persiste el mapa completo de rachas. Cada punto suma 0,5M al precio
 * del piloto en el siguiente mercado y 1 punto a su puntuación de jornada.
 * @param {Object<string, number>} rachas - Mapa { numeroPiloto: enteroRacha }.
 * @returns {Promise<{ ok: boolean, rachas: Object<string, number> }>}
 */
export async function guardarRachasPilotos(rachas) {
  const respuesta = await llamadaGuardarRachas({ rachas })
  return respuesta.data
}

/**
 * Lee la racha actual asignada a cada coche desde `catalogo/rachas_coches`.
 * @returns {Promise<{ ok: boolean, rachas: Object<string, number> }>}
 */
export async function obtenerRachasCoches() {
  const respuesta = await llamadaObtenerRachasCoches()
  return respuesta.data
}

/**
 * Persiste el mapa completo de rachas de coches. Cada punto suma 0,5M al precio
 * del coche en el siguiente mercado y 1 punto a su puntuación de jornada.
 * @param {Object<string, number>} rachas - Mapa { idCoche: enteroRacha }.
 * @returns {Promise<{ ok: boolean, rachas: Object<string, number> }>}
 */
export async function guardarRachasCoches(rachas) {
  const respuesta = await llamadaGuardarRachasCoches({ rachas })
  return respuesta.data
}
