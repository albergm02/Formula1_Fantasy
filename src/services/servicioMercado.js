import { collection, doc, getDoc, onSnapshot, getDocs, query, where, limit } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './servicioFirebase'

const llamadaRegistrarPuja = httpsCallable(functions, 'registrarPuja')
const llamadaEliminarPuja = httpsCallable(functions, 'eliminarPuja')

export const suscribirMercadoActivo = (idLiga, alCambiar) => {
  const consulta = query(collection(db, 'mercados', idLiga, 'dias'), where('estado', '==', 'abierto'), limit(1))
  return onSnapshot(consulta, (snapshot) => {
    if (snapshot.empty) return alCambiar(null)
    const documento = snapshot.docs[0]
    alCambiar({ id: documento.id, ...documento.data() })
  })
}

export const registrarPuja = async (idLiga, idCarta, cantidad) => {
  await llamadaRegistrarPuja({ idLiga, idCarta, cantidad })
}

export const eliminarPuja = async (idLiga, idCarta) => {
  await llamadaEliminarPuja({ idLiga, idCarta })
}

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

export const cargarPreciosDinamicosMercado = async () => {
  const docPrecios = await getDoc(doc(collection(db, 'catalogo'), 'precios'))
  const datos = docPrecios.exists() ? docPrecios.data() : {}
  return { pilotos: datos.pilotos || {}, coches: datos.coches || {}, potenciadores: datos.potenciadores || {} }
}

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
