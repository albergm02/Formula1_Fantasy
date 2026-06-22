import { collection, doc, getDoc, onSnapshot, orderBy, query, limit } from 'firebase/firestore'
import { db } from '@/services/servicioFirebase'

export function suscribirseHistorialJornadas(alActualizar, limiteJornadas = 24) {
  const consulta = query(collection(db, 'jornadas'), orderBy('fechaProcesamiento', 'desc'), limit(limiteJornadas))

  return onSnapshot(consulta, (resultados) => {
    const jornadas = resultados.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
    alActualizar(jornadas)
  })
}

export async function cargarCatalogoYPerfiles() {
  const documento = await getDoc(doc(db, 'catalogo', 'items'))
  if (!documento.exists()) throw new Error('Catálogo no encontrado en Firestore (catalogo/items).')

  const cartas = documento.data().pilotos || []
  const pilotosPorNumero = new Map()

  for (const carta of cartas) {
    if (!pilotosPorNumero.has(carta.numero)) {
      pilotosPorNumero.set(carta.numero, {
        numero: carta.numero,
        nombre: carta.nombre,
        equipo: carta.equipo,
        imagen: carta.imagen,
      })
    }
  }

  return Array.from(pilotosPorNumero.values())
}

export const obtenerCuentaRegresiva = (fechaInicio, ahora = new Date()) => {
  const inicioCarrera = new Date(fechaInicio)
  const tiempoRestante = inicioCarrera - ahora

  if (tiempoRestante <= 0) return '¡El gran premio ya ha comenzado!'

  const dias = Math.floor(tiempoRestante / (1000 * 60 * 60 * 24))
  const horas = Math.floor((tiempoRestante / (1000 * 60 * 60)) % 24)
  const minutos = Math.floor((tiempoRestante / (1000 * 60)) % 60)
  const segundos = Math.floor((tiempoRestante / 1000) % 60)

  return `${dias}d ${horas}h ${minutos}m ${segundos}s`
}

// ============================================================================
// Cálculo de puntos por variante (réplica frontend del sistema server-side).
// Mantengo el código duplicado en cliente y servidor a propósito: el cliente
// usa estas funciones para SIMULAR qué pasaría con cada variante en la vista
// de Jornadas, mientras que el servidor las usa al PROCESAR la jornada y
// guardar el resultado oficial en Firestore. Ambos deben coincidir.
// ============================================================================

const PUNTOS_FIA_POR_POSICION = { 1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1 }

export function calcularPuntosVariante(variante, actuacion, condiciones) {
  if (variante === 'qualy') return puntosPorPosicion(actuacion?.posicionQualy)
  if (sinActuacionValida(actuacion) && variante !== 'base') return 0
  if (variante === 'carrera') return puntosPorPosicion(actuacion.posicionCarrera)
  if (variante === 'todo_terreno') return puntosTodoTerreno(actuacion, condiciones)
  if (variante === 'remontador') return puntosRemontador(actuacion)
  if (variante === 'estratega') return puntosEstratega(actuacion)
  if (variante === 'base') return puntosBase(actuacion)
  return 0
}

export function calcularFactorCaos({ llovio, numeroSafetyCarActivos = 0, numeroVirtualSafetyCarActivos = 0, numeroDNFs = 0 } = {}) {
  let factor = 0.5
  if (llovio) factor += 0.4
  factor += Math.min(3, numeroSafetyCarActivos + numeroVirtualSafetyCarActivos) * 0.05
  if (numeroDNFs >= 5) factor += 0.1
  return Math.round(factor * 100) / 100
}

function sinActuacionValida(actuacion) {
  return Boolean(actuacion?.dnf || actuacion?.dns || actuacion?.dsq || actuacion?.noClasificado)
}

function puntosPorPosicion(posicion) {
  return PUNTOS_FIA_POR_POSICION[posicion] || 0
}

function puntosTodoTerreno(actuacion, condiciones) {
  const factor = calcularFactorCaos(condiciones || {})
  return redondear(puntosPorPosicion(actuacion.posicionCarrera) * factor)
}

const PUNTOS_REMONTADOR_POR_DIFERENCIAL = [0, 3, 7, 12, 18, 25]

function puntosRemontador({ numeroAdelantos = 0, numeroVecesAdelantado = 0 }) {
  const adelantamientosNetos = numeroAdelantos - numeroVecesAdelantado
  if (adelantamientosNetos <= 0) return 0
  const indice = Math.min(adelantamientosNetos, PUNTOS_REMONTADOR_POR_DIFERENCIAL.length - 1)
  return PUNTOS_REMONTADOR_POR_DIFERENCIAL[indice]
}

function puntosEstratega({ posicionCarrera = 20, numeroPitStops = 0, porcentajeStintMaximo = 0 }) {
  if (numeroPitStops === 0) return 0
  return bonusParadas(numeroPitStops) + bonusStint(porcentajeStintMaximo) + bonusPosicionEstratega(posicionCarrera)
}

function bonusParadas(numeroPitStops) {
  if (numeroPitStops === 1) return 10
  if (numeroPitStops === 2) return 5
  return 0
}

function bonusStint(porcentajeStintMaximo) {
  return Math.round((porcentajeStintMaximo || 0) * 10)
}

function bonusPosicionEstratega(posicion) {
  if (posicion <= 3) return 10
  if (posicion <= 6) return 7
  if (posicion <= 10) return 4
  return 0
}

function puntosBase(actuacion) {
  const puntosQualy = puntosPorPosicion(actuacion.posicionQualy)
  const puntosCarrera = sinActuacionValida(actuacion) ? 0 : puntosPorPosicion(actuacion.posicionCarrera)
  return redondear((puntosQualy + puntosCarrera) / 2)
}

function redondear(valor) {
  return Math.round(valor * 100) / 100
}
