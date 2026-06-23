/**
 * @module ServicioGaraje
 * @description Servicio para manejar las operaciones del garaje del usuario, incluyendo la venta de cartas, alternancia de alineación y gestión de cláusulas.
 */
import { httpsCallable } from 'firebase/functions'
import { functions } from './servicioFirebase'

const llamadaVender = httpsCallable(functions, 'venderCarta')
const llamadaAlternar = httpsCallable(functions, 'alternarAlineacion')
const llamadaGestionarClausula = httpsCallable(functions, 'gestionarClausula')
const llamadaEjecutarClausula = httpsCallable(functions, 'ejecutarClausula')
const HORAS_PERIODO_GRACIA = 48

/**
 * Vende una carta.
 * @param {string} idParticipante - ID del participante.
 * @param {string} instanciaId - ID de la instancia.
 * @returns {Promise<Object>} - Resultado de la operación.
 */
export async function venderCarta(idParticipante, instanciaId) {
  const respuesta = await llamadaVender({ idParticipante, instanciaId })
  return respuesta.data
}

/**
 * Alterna la alineación de un participante.
 * @param {string} idParticipante - ID del participante.
 * @param {string} instanciaId - ID de la instancia.
 * @returns {Promise<Object>} - Resultado de la operación.
 */
export async function alternarAlineacion(idParticipante, instanciaId) {
  const respuesta = await llamadaAlternar({ idParticipante, instanciaId })
  return respuesta.data
}

/**
 * Gestiona una cláusula.
 * @param {string} idParticipante - ID del participante.
 * @param {string} instanciaId - ID de la instancia.
 * @param {number} cantidad - Cantidad a gestionar.
 * @returns {Promise<Object>} - Resultado de la operación.
 */
export async function gestionarClausula(idParticipante, instanciaId, cantidad) {
  const respuesta = await llamadaGestionarClausula({ idParticipante, instanciaId, cantidad })
  return respuesta.data
}

/**
 * Ejecuta una cláusula.
 * @param {string} idParticipanteRival - ID del participante rival.
 * @param {string} idParticipantePropio - ID del participante propio.
 * @param {string} instanciaId - ID de la instancia.
 * @returns {Promise<Object>} - Resultado de la operación.
 */
export async function ejecutarClausula(idParticipanteRival, idParticipantePropio, instanciaId) {
  const respuesta = await llamadaEjecutarClausula({ idParticipanteRival, idParticipantePropio, instanciaId })
  return respuesta.data
}

/**
 * Calcula el precio de una cláusula.
 * @param {Object} elemento - Elemento a calcular.
 * @returns {number} - Precio de la cláusula.
 */
export function calcularPrecioClausula(elemento) {
  const precioBase = elemento.precioCompra ?? elemento.precio
  const inversionDueño = elemento.clausulaInvertida || 0
  return precioBase + inversionDueño * 2
}

/**
 * Verifica si un elemento está en período de gracia.
 * @param {Object} elemento - Elemento a verificar.
 * @returns {boolean} - True si está en período de gracia, false en caso contrario.
 */
export function estaEnPeriodoDeGracia(elemento) {
  if (!elemento.fechaAdquisicion) return false
  const fechaAdquisicion = new Date(elemento.fechaAdquisicion)
  const milisegundosGracia = HORAS_PERIODO_GRACIA * 60 * 60 * 1000
  return Date.now() - fechaAdquisicion.getTime() < milisegundosGracia
}

/**
 * Calcula las horas restantes del período de gracia.
 * @param {Object} elemento - Elemento a verificar.
 * @returns {number} - Horas restantes del período de gracia.
 */
export function horasRestantesDeGracia(elemento) {
  if (!elemento.fechaAdquisicion) return 0
  const fechaAdquisicion = new Date(elemento.fechaAdquisicion)
  const milisegundosGracia = HORAS_PERIODO_GRACIA * 60 * 60 * 1000
  const restante = milisegundosGracia - (Date.now() - fechaAdquisicion.getTime())
  return Math.max(0, Math.ceil(restante / (1000 * 60 * 60)))
}
