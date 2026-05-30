/**
 * Servicio del mercado diario.
 * Centraliza las operaciones de Firestore relacionadas con el mercado de cartas y pujas.
 * Los stores importan únicamente desde este módulo; nunca desde Firebase directamente.
 *
 * Esquema leído → mercados/{idLiga}_{YYYY-MM-DD}:
 *   { idLiga, estado, fechaCierre, cartas[] }
 *
 * Esquema pujas → mercados/{idMercado}/pujas/{emailSanitizado}_{idCarta}:
 *   { idCarta, tipoCarta, nombreCarta, precioCarta, emailUsuario, idParticipante, cantidad, fecha }
 *
 * @module servicioMercado
 */
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
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

const sanitizarEmail = (email) => email.replace(/[.@]/g, '_')

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

/* ─── Pujas ─────────────────────────────────────────────────────────────── */

/**
 * Registra o actualiza la puja de un usuario sobre una carta del mercado.
 * El ID del documento es determinístico: '{emailSanitizado}_{idCarta}'.
 * Si el usuario ya pujó por esa carta, se sobreescribe con la nueva cantidad.
 * @param {string} idMercado - ID del documento del mercado.
 * @param {Object} carta - La carta sobre la que se puja.
 * @param {string} emailUsuario - Email del usuario que puja.
 * @param {string} idParticipante - ID de participación del usuario en la liga.
 * @param {number} cantidad - Cantidad de la puja (debe ser >= precio base).
 */
export const registrarPuja = async (idMercado, carta, emailUsuario, idParticipante, cantidad) => {
  const idPuja = `${sanitizarEmail(emailUsuario)}_${carta.id}`
  const refPuja = doc(db, 'mercados', idMercado, 'pujas', idPuja)

  await setDoc(refPuja, {
    idCarta: carta.id,
    tipoCarta: carta.tipoCarta,
    nombreCarta: carta.nombre,
    precioCarta: carta.precio,
    emailUsuario: emailUsuario.trim(),
    idParticipante,
    cantidad: Number(cantidad),
    fecha: new Date().toISOString(),
  })
}

/**
 * Elimina la puja de un usuario sobre una carta del mercado.
 * @param {string} idMercado - ID del documento del mercado.
 * @param {string} idCarta - ID de la carta sobre la que se pujó.
 * @param {string} emailUsuario - Email del usuario que elimina su puja.
 */
export const eliminarPuja = async (idMercado, idCarta, emailUsuario) => {
  const idPuja = `${sanitizarEmail(emailUsuario)}_${idCarta}`
  const refPuja = doc(db, 'mercados', idMercado, 'pujas', idPuja)
  await deleteDoc(refPuja)
}

/**
 * Carga todas las pujas del usuario actual en el mercado activo.
 * Devuelve un mapa { idCarta → cantidad } para consulta rápida.
 * @param {string} idMercado - ID del documento del mercado.
 * @param {string} emailUsuario - Email del usuario.
 * @returns {Promise<Object>} Mapa idCarta → cantidad.
 */
export const cargarMisPujas = async (idMercado, emailUsuario) => {
  const refPujas = collection(db, 'mercados', idMercado, 'pujas')
  const consulta = query(refPujas, where('emailUsuario', '==', emailUsuario.trim()))
  const resultado = await getDocs(consulta)

  const mapa = {}
  resultado.forEach((documento) => {
    const datos = documento.data()
    mapa[datos.idCarta] = datos.cantidad
  })
  return mapa
}

/**
 * Carga todas las pujas de todas las cartas del mercado.
 * Devuelve un mapa { idCarta → { mejorPuja, totalPujas } } para mostrar en la UI.
 * @param {string} idMercado - ID del documento del mercado.
 * @returns {Promise<Object>} Mapa con la puja máxima y total de pujas por carta.
 */
export const cargarResumenPujas = async (idMercado) => {
  const refPujas = collection(db, 'mercados', idMercado, 'pujas')
  const resultado = await getDocs(refPujas)

  const resumen = {}
  resultado.forEach((documento) => {
    const datos = documento.data()
    if (!resumen[datos.idCarta]) {
      resumen[datos.idCarta] = { mejorPuja: 0, totalPujas: 0 }
    }
    resumen[datos.idCarta].totalPujas++
    if (datos.cantidad > resumen[datos.idCarta].mejorPuja) {
      resumen[datos.idCarta].mejorPuja = datos.cantidad
    }
  })
  return resumen
}
