import { collection, doc, getDoc, onSnapshot, getDocs, query, where, limit } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './servicioFirebase'

const llamadaRegistrarPuja = httpsCallable(functions, 'registrarPuja')
const llamadaEliminarPuja = httpsCallable(functions, 'eliminarPuja')

/**
 * Suscribe a los cambios del mercado activo de una liga.
 * @param {string} idLiga - ID de la liga.
 * @param {Function} alCambiar - Función a ejecutar cuando cambie el mercado activo.
 * @returns {Function} - Función para cancelar la suscripción.
 */
export const suscribirMercadoActivo = (idLiga, alCambiar) => {
  const consulta = query(collection(db, 'mercados', idLiga, 'dias'), where('estado', '==', 'abierto'), limit(1))
  return onSnapshot(consulta, (snapshot) => {
    if (snapshot.empty) return alCambiar(null)
    const documento = snapshot.docs[0]
    alCambiar({ id: documento.id, ...documento.data() })
  })
}

/**
 * Registra una puja en el mercado.
 * @param {string} idLiga - ID de la liga.
 * @param {string} idCarta - ID de la carta.
 * @param {number} cantidad - Cantidad de la puja.
 * @returns {Promise<void>} - Promesa que se resuelve cuando la operación se completa.
 */
export const registrarPuja = async (idLiga, idCarta, cantidad) => {
  await llamadaRegistrarPuja({ idLiga, idCarta, cantidad })
}

/**
 * Elimina una puja en el mercado.
 * @param {string} idLiga - ID de la liga.
 * @param {string} idCarta - ID de la carta.
 * @returns {Promise<void>} - Promesa que se resuelve cuando la operación se completa.
 */
export const eliminarPuja = async (idLiga, idCarta) => {
  await llamadaEliminarPuja({ idLiga, idCarta })
}

/**
 * Carga las pujas de un usuario en un mercado.
 * @param {Object} mercado - Mercado activo.
 * @param {string} emailUsuario - Correo electrónico del usuario.
 * @returns {Object} - Mapa de pujas del usuario.
 */
export const cargarMisPujas = async (mercado, emailUsuario) => {
  const refPujas = collection(db, 'mercados', mercado.idLiga, 'dias', mercado.id, 'pujas')
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
 * Carga los precios dinámicos del mercado.
 * @returns {Object} - Precios dinámicos de pilotos, coches y potenciadores.
 */
export const cargarPreciosDinamicosMercado = async () => {
  const docPrecios = await getDoc(doc(collection(db, 'catalogo'), 'precios'))
  const datos = docPrecios.exists() ? docPrecios.data() : {}
  return { pilotos: datos.pilotos || {}, coches: datos.coches || {}, potenciadores: datos.potenciadores || {} }
}

/**
 * Carga el resumen de pujas de un mercado.
 * @param {Object} mercado - Mercado activo.
 * @returns {Object} - Resumen de pujas por carta.
 */
export const cargarResumenPujas = async (mercado) => {
  const refPujas = collection(db, 'mercados', mercado.idLiga, 'dias', mercado.id, 'pujas')
  const resultado = await getDocs(refPujas)

  const resumen = {}
  resultado.forEach((documento) => {
    const { idCarta } = documento.data()
    resumen[idCarta] = (resumen[idCarta] || 0) + 1
  })
  return resumen
}
