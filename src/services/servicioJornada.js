/**
 * Acceso a las jornadas procesadas en Firestore.
 * @module servicioJornada
 */

import { collection, doc, getDoc, onSnapshot, orderBy, query, limit } from 'firebase/firestore'
import { db } from '@/services/servicioFirebase'

/**
 * Suscribe al historial de jornadas procesadas (más recientes primero).
 * @param {(jornadas: Array<Object>) => void} alActualizar
 * @param {number} [limiteJornadas=24]
 * @returns {() => void}
 */
export function suscribirseHistorialJornadas(alActualizar, limiteJornadas = 24) {
  const consulta = query(
    collection(db, 'jornadas'),
    orderBy('fechaProcesamiento', 'desc'),
    limit(limiteJornadas),
  )

  return onSnapshot(consulta, (resultados) => {
    const jornadas = resultados.docs.map((documento) => ({
      id: documento.id,
      ...documento.data(),
    }))
    alActualizar(jornadas)
  })
}

/**
 * Recupera la lista única de pilotos del catálogo central (catalogo/pilotos).
 * El documento contiene cartas con variantes; se deduplica por número de piloto
 * para devolver una entrada por cada uno con los campos visuales y de atributos.
 * @returns {Promise<Array<{ numero: number, nombre: string, equipo: string, imagen: string, atributos: Object }>>}
 */
export async function cargarCatalogoPilotos() {
  const documento = await getDoc(doc(db, 'catalogo', 'pilotos'))
  if (!documento.exists()) {
    throw new Error('Catálogo de pilotos no encontrado en Firestore (catalogo/pilotos).')
  }

  const cartas = documento.data().items || []
  const pilotosPorNumero = new Map()

  for (const carta of cartas) {
    if (pilotosPorNumero.has(carta.numero)) continue
    pilotosPorNumero.set(carta.numero, {
      numero: carta.numero,
      nombre: carta.nombre,
      equipo: carta.equipo,
      imagen: carta.imagen,
      atributos: carta.atributos,
    })
  }

  return Array.from(pilotosPorNumero.values())
}

/**
 * Extrae los perfiles de puntuación (pesos y reglas) embebidos en las cartas
 * del catálogo `catalogo/pilotos`. Devuelve un mapa indexado por el identificador
 * del perfil (qualy, carrera, todo_terreno, base, remontador, estratega).
 * @returns {Promise<Object<string, { pesos: Object, reglasUsuario: string[] }>>}
 */
export async function cargarPerfilesPuntuacion() {
  const documento = await getDoc(doc(db, 'catalogo', 'pilotos'))
  if (!documento.exists()) {
    throw new Error('Catálogo de pilotos no encontrado en Firestore (catalogo/pilotos).')
  }

  const cartas = documento.data().items || []
  const perfiles = {}

  for (const carta of cartas) {
    const clavePerfil = carta.perfilPuntuacion
    if (!clavePerfil || perfiles[clavePerfil]) continue
    perfiles[clavePerfil] = {
      pesos: carta.pesos,
      reglasUsuario: carta.reglasUsuario || [],
    }
  }

  return perfiles
}
