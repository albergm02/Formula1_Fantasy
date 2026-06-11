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

const llamadaRegistrarPuja = httpsCallable(functions, 'registrarPujaCarta')
const llamadaEliminarPuja = httpsCallable(functions, 'eliminarPujaPropia')
const llamadaEliminarMisPujasDeLiga = httpsCallable(functions, 'eliminarMisPujasDeLiga')

export const registrarPuja = async (idLiga, idCarta, cantidad) => {
  await llamadaRegistrarPuja({ idLiga, idCarta, cantidad })
}

export const eliminarPuja = async (idLiga, idCarta) => {
  await llamadaEliminarPuja({ idLiga, idCarta })
}

export const eliminarMisPujasDeLiga = async (idLiga) => {
  await llamadaEliminarMisPujasDeLiga({ idLiga })
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
