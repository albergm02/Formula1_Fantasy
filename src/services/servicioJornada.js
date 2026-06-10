import { collection, doc, getDoc, onSnapshot, orderBy, query, limit } from 'firebase/firestore'
import { db } from '@/services/servicioFirebase'

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

/** Lista única de pilotos del catálogo (deduplicada por número). */
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

/** Mapa de perfiles de puntuación embebidos en el catálogo, indexado por clave. */
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
