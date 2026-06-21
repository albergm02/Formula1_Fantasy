/**
 * Servicio del mercado diario. Las mutaciones (pujar/retirar) van por Cloud
 * Functions; las lecturas se hacen directas a Firestore.
 */
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  getDocs,
  query,
  where,
  limit,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './servicioFirebase'

const llamadaRegistrarPuja = httpsCallable(functions, 'registrarPuja')
const llamadaEliminarPuja = httpsCallable(functions, 'eliminarPuja')

/**
 * Escucha en tiempo real el mercado abierto de una liga. Cuando el scheduler
 * crea el nuevo mercado, Firestore empuja el cambio al cliente sin necesidad
 * de polling ni refresco manual.
 */
export const suscribirMercadoActivo = (idLiga, alCambiar) => {
  const consulta = query(
    collection(db, 'mercados', idLiga, 'dias'),
    where('estado', '==', 'abierto'),
    limit(1),
  )
  return onSnapshot(consulta, (snapshot) => {
    if (snapshot.empty) {
      alCambiar(null)
    } else {
      const documento = snapshot.docs[0]
      alCambiar({ id: documento.id, ...documento.data() })
    }
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

/**
 * Lee del catálogo los mapas de precios dinámicos vigentes para los tres
 * tipos de carta. Para pilotos la clave es `<numero>|<variante>`; para
 * coches y potenciadores se usa el `id` único del catálogo. Las cartas no
 * presentes en cada mapa mantienen su precio base.
 *
 * @returns {Promise<{pilotos: Object<string, number>, coches: Object<string, number>, potenciadores: Object<string, number>}>}
 */
export const cargarPreciosDinamicosMercado = async () => {
  const docPrecios = await getDoc(doc(collection(db, 'catalogo'), 'precios'))
  const datos = docPrecios.exists() ? docPrecios.data() : {}
  return {
    pilotos: datos.pilotos || {},
    coches: datos.coches || {},
    potenciadores: datos.potenciadores || {},
  }
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
