/**
 * @module ServicioMercado
 * @description Servicio para manejar las operaciones del mercado, incluyendo la suscripción a cambios, registro y eliminación de pujas, y carga de precios dinámicos.
 */
import { collection, doc, onSnapshot, getDocs, query, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './servicioFirebase'

const llamadaRegistrarPuja = httpsCallable(functions, 'registrarPuja')
const llamadaEliminarPuja = httpsCallable(functions, 'eliminarPuja')

/**
 * Suscribe a los cambios del mercado único de una liga. El mercado es único
 * por liga (un solo doc en `mercados/{idLiga}`); mientras su `estado` sea
 * `'abierto'` se notifica al caller, en caso contrario (rotación, doc
 * inexistente) se notifica `null`.
 * @param {string} idLiga - ID de la liga.
 * @param {Function} alCambiar - Función a ejecutar cuando cambie el mercado.
 * @returns {Function} - Función para cancelar la suscripción.
 */
export function suscribirMercadoActivo(idLiga, alCambiar) {
  const refDoc = doc(db, 'mercados', idLiga)
  return onSnapshot(refDoc, (snapshot) => {
    if (!snapshot.exists()) return alCambiar(null)
    const datos = snapshot.data()
    if (datos.estado !== 'abierto') return alCambiar(null)
    alCambiar({ id: idLiga, ...datos })
  })
}

/**
 * Registra una puja en el mercado.
 * @param {string} idLiga - ID de la liga.
 * @param {string} idCarta - ID de la carta.
 * @param {number} cantidad - Cantidad de la puja.
 * @returns {Promise<void>} - Promesa que se resuelve cuando la operación se completa.
 */
export async function registrarPuja(idLiga, idCarta, cantidad) {
  await llamadaRegistrarPuja({ idLiga, idCarta, cantidad })
}

/**
 * Elimina una puja en el mercado.
 * @param {string} idLiga - ID de la liga.
 * @param {string} idCarta - ID de la carta.
 * @returns {Promise<void>} - Promesa que se resuelve cuando la operación se completa.
 */
export async function eliminarPuja(idLiga, idCarta) {
  await llamadaEliminarPuja({ idLiga, idCarta })
}

/**
 * Carga las pujas de un usuario en un mercado.
 * @param {Object} mercado - Mercado activo.
 * @param {string} emailUsuario - Correo electrónico del usuario.
 * @returns {Object} - Mapa de pujas del usuario.
 */
export async function cargarMisPujas(mercado, emailUsuario) {
  const refPujas = collection(db, 'mercados', mercado.idLiga, 'pujas')
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
 * Carga el resumen de pujas de un mercado.
 * @param {Object} mercado - Mercado activo.
 * @returns {Object} - Resumen de pujas por carta.
 */
export async function cargarResumenPujas(mercado) {
  const refPujas = collection(db, 'mercados', mercado.idLiga, 'pujas')
  const resultado = await getDocs(refPujas)

  const resumen = {}
  resultado.forEach((documento) => {
    const { idCarta } = documento.data()
    resumen[idCarta] = (resumen[idCarta] || 0) + 1
  })
  return resumen
}
