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
const llamadaEliminarLiga = httpsCallable(functions, 'eliminarLigaManual')
const llamadaEliminarUsuario = httpsCallable(functions, 'eliminarUsuarioManual')
const llamadaResembrarCatalogo = httpsCallable(functions, 'resembrarCatalogoManual')

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
 * @param {string} [opciones.idLiga] - Si se indica, sólo se reprocesan las
 *        participaciones de esa liga (no se modifican otras ligas ni el
 *        documento global de la jornada). Pensado para testing puntual.
 * @returns {Promise<Object>} { ok, idJornada, nombreGranPremio, participacionesProcesadas }
 */
export async function dispararProcesamientoJornada(opciones = {}) {
  const respuesta = await llamadaJornada(opciones)
  return respuesta.data
}

/**
 * ELIMINACIÓN COMPLETA de una liga por parte del administrador global.
 * Borra la liga, sus participaciones, mercados, pujas y actividad, y la
 * desvincula del array `ligasIds` de todos los usuarios.
 * Operación destructiva e irreversible.
 * @param {string} idLiga
 * @returns {Promise<Object>} { ok, idLiga, nombreLiga, participacionesBorradas, mercadosBorrados, eventosActividadBorrados, usuariosDesvinculados }
 */
export async function eliminarLigaComoAdministrador(idLiga) {
  const respuesta = await llamadaEliminarLiga({ idLiga })
  return respuesta.data
}

/**
 * ELIMINACIÓN COMPLETA de un usuario por parte del administrador global.
 * Borra su perfil, participaciones, pujas activas y el usuario de Firebase Auth,
 * desvinculándolo de todas sus ligas (con cesión de admin o borrado de liga
 * si quedaba como único participante).
 * Operación destructiva e irreversible.
 * @param {string} email
 * @returns {Promise<Object>} { ok, email, participacionesBorradas, ligasBorradas }
 */
export async function eliminarUsuarioComoAdministrador(email) {
  const respuesta = await llamadaEliminarUsuario({ email })
  return respuesta.data
}

/**
 * Re-siembra el catálogo completo (pilotos, coches, potenciadores) en
 * Firestore con los datos actuales de `catalogoBase.js` del backend.
 * Sobrescribe los documentos `catalogo/{pilotos|coches|potenciadores}`
 * e invalida la cache en memoria de las Cloud Functions.
 * @returns {Promise<Object>} { ok, pilotosSembrados, cochesSembrados, potenciadoresSembrados }
 */
export async function resembrarCatalogo() {
  const respuesta = await llamadaResembrarCatalogo()
  return respuesta.data
}
