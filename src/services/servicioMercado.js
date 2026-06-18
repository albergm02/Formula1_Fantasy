/**
 * Servicio del mercado diario. Las mutaciones (pujar/retirar) van por Cloud
 * Functions; las lecturas se hacen directas a Firestore.
 */
import { collection, getDocs, onSnapshot, query, where, limit } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './servicioFirebase'

/**
 * Carga puntualmente el mercado abierto de una liga.
 *
 * @param {string} idLiga
 * @returns {Promise<Object|null>}
 */
export const cargarMercadoActivo = async (idLiga) => {
  const consulta = query(
    collection(db, 'mercados'),
    where('idLiga', '==', idLiga),
    where('estado', '==', 'abierto'),
    limit(1),
  )
  const resultado = await getDocs(consulta)
  if (resultado.empty) return null
  const documento = resultado.docs[0]
  return { id: documento.id, ...documento.data() }
}

/**
 * Escucha en tiempo real el mercado abierto de una liga. Cuando el scheduler
 * crea el nuevo mercado, Firestore empuja el cambio al cliente sin necesidad
 * de polling ni refresco manual.
 *
 * @param {string} idLiga
 * @param {(mercado: Object|null) => void} alCambiar - callback con el mercado o null si no hay ninguno abierto
 * @returns {() => void} función para cancelar el listener
 */
export const suscribirMercadoActivo = (idLiga, alCambiar) => {
  const consulta = query(
    collection(db, 'mercados'),
    where('idLiga', '==', idLiga),
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
