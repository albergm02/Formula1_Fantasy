/**
 * @module ServicioJornada
 * @description Servicio para manejar las operaciones relacionadas con las jornadas, incluyendo la suscripción a cambios, carga de catálogo y cálculo de puntos.
 */

import { collection, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '@/services/servicioFirebase'

/**
 * Suscribe a los cambios en el historial de jornadas.
 * @param {Function} alActualizar - Función a ejecutar al actualizar el historial.
 * @returns {Function} - Función para cancelar la suscripción.
 */
export function suscribirseHistorialJornadas(alActualizar) {
  const consulta = query(collection(db, 'jornadas'), orderBy('fechaProcesamiento', 'desc'))

  return onSnapshot(consulta, (resultados) => {
    const jornadas = resultados.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
    alActualizar(jornadas)
  })
}

/**
 * Carga el catálogo y los perfiles de pilotos.
 * @returns {Promise<Array>} - Array de pilotos.
 */
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

/**
 * Obtiene la cuenta regresiva para el inicio de una carrera.
 * @param {string|Date} fechaInicio - Fecha de inicio de la carrera.
 * @param {Date} [ahora=new Date()] - Fecha actual.
 * @returns {string} - Cadena con la cuenta regresiva.
 */
export function obtenerCuentaRegresiva(fechaInicio, ahora = new Date()) {
  const inicioCarrera = new Date(fechaInicio)
  const tiempoRestante = inicioCarrera - ahora

  if (tiempoRestante <= 0) return '¡El gran premio ya ha comenzado!'

  const dias = Math.floor(tiempoRestante / (1000 * 60 * 60 * 24))
  const horas = Math.floor((tiempoRestante / (1000 * 60 * 60)) % 24)
  const minutos = Math.floor((tiempoRestante / (1000 * 60)) % 60)
  const segundos = Math.floor((tiempoRestante / 1000) % 60)

  return `${dias}d ${horas}h ${minutos}m ${segundos}s`
}

/**
 * Calcula los puntos de una variante.
 * @param {string} variante - Variante a calcular.
 * @param {Object} actuacion - Actuación del piloto.
 * @param {Object} condiciones - Condiciones de la carrera.
 * @returns {number} - Puntos calculados.
 */
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

/**
 * Calcula el factor de caos de una carrera.
 * @param {Object} opciones - Opciones para calcular el factor de caos.
 * @param {boolean} opciones.llovio - Indica si llovió durante la carrera.
 * @param {number} opciones.numeroSafetyCarActivos - Número de Safety Car activos.
 * @param {number} opciones.numeroVirtualSafetyCarActivos - Número de Virtual Safety Car activos.
 * @param {number} opciones.numeroDNFs - Número de pilotos que no terminaron la carrera.
 * @returns {number} - Factor de caos calculado.
 */
export function calcularFactorCaos({ llovio, numeroSafetyCarActivos = 0, numeroVirtualSafetyCarActivos = 0, numeroDNFs = 0 } = {}) {
  let factor = 0.75
  if (llovio) factor += 0.1
  factor += Math.min(3, numeroSafetyCarActivos + numeroVirtualSafetyCarActivos) * 0.05
  factor += Math.min(numeroDNFs, 5) * 0.05
  return Math.round(factor * 100) / 100
}

/**
 * Verifica si una actuación no es válida.
 * @param {Object} actuacion - Actuación del piloto.
 * @returns {boolean} - True si la actuación no es válida, false en caso contrario.
 */
function sinActuacionValida(actuacion) {
  return Boolean(actuacion?.dnf || actuacion?.dns || actuacion?.dsq || actuacion?.noClasificado)
}

const PUNTOS_POR_POSICION = {
  1: 25,
  2: 20,
  3: 18,
  4: 17,
  5: 16,
  6: 15,
  7: 14,
  8: 13,
  9: 12,
  10: 11,
  11: 10,
  12: 9,
  13: 8,
  14: 7,
  15: 6,
  16: 5,
  17: 4,
  18: 3,
  19: 2,
  20: 1,
}
/**
 * Calcula los puntos por posición con una escala decreciente y continua:
 * P1 = 25, P2 = 20, P3 = 18 y baja 1 punto por plaza hasta P20 = 1.
 * A partir de P20 se mantiene el suelo de 1 punto, de modo que siempre se puntúa.
 * @param {number} posicion - Posición del piloto.
 * @returns {number} - Puntos calculados.
 */
function puntosPorPosicion(posicion) {
  if (!Number.isInteger(posicion) || posicion < 1) return 0
  if (posicion > 20) return 1
  return PUNTOS_POR_POSICION[posicion] ?? 0
}

/**
 * Calcula los puntos para la variante "todo terreno".
 * @param {Object} actuacion - Actuación del piloto.
 * @param {Object} condiciones - Condiciones de la carrera.
 * @returns {number} - Puntos calculados.
 */
function puntosTodoTerreno(actuacion, condiciones) {
  const factor = calcularFactorCaos(condiciones || {})
  return redondear(puntosPorPosicion(actuacion.posicionCarrera) * factor)
}

const PUNTOS_REMONTADOR_POR_DIFERENCIAL = [0, 3, 7, 12, 18, 25]
/**
 * Calcula los puntos para la variante "remontador".
 * @param {Object} actuacion - Actuación del piloto.
 * @param {number} actuacion.numeroAdelantos - Número de adelantamientos realizados.
 * @param {number} actuacion.numeroVecesAdelantado - Número de veces que el piloto fue adelantado.
 * @returns {number} - Puntos calculados.
 */
function puntosRemontador({ numeroAdelantos = 0, numeroVecesAdelantado = 0 }) {
  const adelantamientosNetos = numeroAdelantos - numeroVecesAdelantado
  if (adelantamientosNetos <= 0) return 0
  const indice = Math.min(adelantamientosNetos, PUNTOS_REMONTADOR_POR_DIFERENCIAL.length - 1)
  return PUNTOS_REMONTADOR_POR_DIFERENCIAL[indice]
}

const FACTOR_ESTRATEGA_BASE = 0.75
const BONUS_PARADAS_ESTRATEGA = 0.25
const BONUS_STINT_ESTRATEGA = 0.25
const UMBRAL_STINT_ESTRATEGA = 0.5

/**
 * Calcula el factor del estratega según el número de paradas y el stint más largo.
 * Base 0.75, +0.25 si menos de 3 paradas, +0.25 si el stint supera el 50%. Tope: 1.25.
 * @param {number} numeroPitStops - Número de paradas en boxes.
 * @param {number} porcentajeStintMaximo - Fracción del stint más largo (0 a 1).
 * @returns {number} - Factor del estratega.
 */
function calcularFactorEstratega(numeroPitStops, porcentajeStintMaximo) {
  let factor = FACTOR_ESTRATEGA_BASE
  if (numeroPitStops < 3) factor += BONUS_PARADAS_ESTRATEGA
  if (porcentajeStintMaximo > UMBRAL_STINT_ESTRATEGA) factor += BONUS_STINT_ESTRATEGA
  return factor
}

/**
 * Calcula los puntos para la variante "estratega".
 * Los puntos por posición se multiplican por un factor que premia la estrategia:
 * pocas paradas y stint largo aumentan el factor (tope x1.25), muchas paradas y stint corto lo reducen (base x0.75).
 * Si el piloto no ha realizado ninguna parada, se anula la puntuación (0 paradas suele indicar abandono).
 * @param {Object} actuacion - Actuación del piloto.
 * @param {number} actuacion.posicionCarrera - Posición final en la carrera.
 * @param {number} actuacion.numeroPitStops - Número de paradas en boxes.
 * @param {number} actuacion.porcentajeStintMaximo - Fracción del stint más largo sobre el total de vueltas (0 a 1).
 * @returns {number} - Puntos: puntosPorPosicion(posicion) × factorEstratega.
 */
function puntosEstratega({ posicionCarrera = 20, numeroPitStops = 0, porcentajeStintMaximo = 0 }) {
  if (numeroPitStops === 0) return 0
  const factor = calcularFactorEstratega(numeroPitStops, porcentajeStintMaximo)
  return redondear(puntosPorPosicion(posicionCarrera) * factor)
}

/**
 * Calcula los puntos base de un piloto.
 * @param {Object} actuacion - Actuación del piloto.
 * @param {number} actuacion.posicionQualy - Posición en la clasificación.
 * @param {number} actuacion.posicionCarrera - Posición final en la carrera.
 * @returns {number} - Puntos calculados.
 */
function puntosBase(actuacion) {
  const puntosQualy = puntosPorPosicion(actuacion.posicionQualy)
  const puntosCarrera = sinActuacionValida(actuacion) ? 0 : puntosPorPosicion(actuacion.posicionCarrera)
  return redondear((puntosQualy + puntosCarrera) / 2)
}

function redondear(valor) {
  return Math.round(valor * 100) / 100
}
