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
  let factor = 0.7
  if (llovio) factor += 0.3
  factor += Math.min(3, numeroSafetyCarActivos + numeroVirtualSafetyCarActivos) * 0.05
  if (numeroDNFs >= 5) factor += 0.3
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

const PUNTOS_FIA_POR_POSICION = { 1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1 }
/**
 * Calcula los puntos por posición.
 * @param {number} posicion - Posición del piloto.
 * @returns {number} - Puntos calculados.
 */
function puntosPorPosicion(posicion) {
  return PUNTOS_FIA_POR_POSICION[posicion] || 0
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

/**
 * Calcula los puntos para la variante "estratega".
 * @param {Object} actuacion - Actuación del piloto.
 * @param {number} actuacion.posicionCarrera - Posición final en la carrera.
 * @param {number} actuacion.numeroPitStops - Número de paradas en boxes.
 * @param {number} actuacion.porcentajeStintMaximo - Porcentaje del stint más largo.
 * @returns {number} - Puntos calculados.
 */
function puntosEstratega({ posicionCarrera = 20, numeroPitStops = 0, porcentajeStintMaximo = 0 }) {
  if (numeroPitStops === 0) return 0
  return bonusParadas(numeroPitStops) + bonusStint(porcentajeStintMaximo) + bonusPosicionEstratega(posicionCarrera)
}

/**
 * Calcula el bonus por número de paradas en boxes.
 * @param {number} numeroPitStops - Número de paradas en boxes.
 * @returns {number} - Bonus calculado.
 */
function bonusParadas(numeroPitStops) {
  if (numeroPitStops === 1) return 10
  if (numeroPitStops === 2) return 5
  return 0
}

/**
 * Calcula el bonus por porcentaje del stint más largo.
 * @param {number} porcentajeStintMaximo - Porcentaje del stint más largo.
 * @returns {number} - Bonus calculado.
 */
function bonusStint(porcentajeStintMaximo) {
  return Math.round((porcentajeStintMaximo || 0) * 10)
}

/**
 * Calcula el bonus por posición en la variante "estratega".
 * @param {number} posicion - Posición final en la carrera.
 * @returns {number} - Bonus calculado.
 */
function bonusPosicionEstratega(posicion) {
  if (posicion <= 3) return 10
  if (posicion <= 6) return 7
  if (posicion <= 10) return 4
  return 0
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
