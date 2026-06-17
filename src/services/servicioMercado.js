/**
 * Servicio del mercado diario. Las mutaciones (pujar/retirar) van por Cloud
 * Functions; las lecturas se hacen directas a Firestore.
 */
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './servicioFirebase'

export const calcularIdMercado = (idLiga, fecha = new Date()) => {
  const fechaStr = fecha.toISOString().split('T')[0]
  return `${idLiga}_${fechaStr}`
}

export const cargarMercadoActivo = async (idLiga) => {
  const idMercado = calcularIdMercado(idLiga)
  const documento = await getDoc(doc(db, 'mercados', idMercado))
  if (!documento.exists()) return null

  const datos = documento.data()
  if (datos.estado !== 'abierto') return null
  return { id: documento.id, ...datos }
}

const llamadaRegistrarPuja = httpsCallable(functions, 'registrarPuja')
const llamadaEliminarPuja = httpsCallable(functions, 'eliminarPuja')
const llamadaEliminarPujas = httpsCallable(functions, 'eliminarPujas')

export const registrarPuja = async (idLiga, idCarta, cantidad) => {
  await llamadaRegistrarPuja({ idLiga, idCarta, cantidad })
}

export const eliminarPuja = async (idLiga, idCarta) => {
  await llamadaEliminarPuja({ idLiga, idCarta })
}

export const eliminarPujas = async (idLiga) => {
  await llamadaEliminarPujas({ idLiga })
}

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
 * Lee del catálogo los mapas de precios dinámicos vigentes para los tres
 * tipos de carta. Para pilotos la clave es `<numero>|<variante>`; para
 * coches y potenciadores se usa el `id` único del catálogo. Las cartas no
 * presentes en cada mapa mantienen su precio base.
 *
 * @returns {Promise<{pilotos: Object<string, number>, coches: Object<string, number>, potenciadores: Object<string, number>}>}
 */
export const cargarPreciosDinamicosMercado = async () => {
  const referencia = collection(db, 'catalogo')
  const [docPilotos, docCoches, docPotenciadores] = await Promise.all([
    getDoc(doc(referencia, 'precios_pilotos')),
    getDoc(doc(referencia, 'precios_coches')),
    getDoc(doc(referencia, 'precios_potenciadores')),
  ])
  return {
    pilotos: docPilotos.exists() ? docPilotos.data().precios || {} : {},
    coches: docCoches.exists() ? docCoches.data().precios || {} : {},
    potenciadores: docPotenciadores.exists() ? docPotenciadores.data().precios || {} : {},
  }
}

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
