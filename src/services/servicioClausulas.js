/**
 * Servicio de cláusulas de rescisión.
 * La transferencia de cartas entre participantes se ejecuta en servidor
 * (Cloud Function `ejecutarClausulazo`), que valida permisos, precio y
 * presupuesto de forma atómica. Aquí se conservan los cálculos de apoyo para
 * la interfaz (precio y periodo de gracia) y la inversión en cláusula propia.
 *
 * @module servicioClausulas
 */
import { doc, writeBatch } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './servicioFirebase'

const HORAS_PERIODO_GRACIA = 48
const llamadaEjecutarClausulazo = httpsCallable(functions, 'ejecutarClausulazo')

/**
 * Calcula el precio de cláusula de un elemento del garaje.
 * Se basa en el precio realmente pagado por el dueño al fichar la carta
 * (`precioCompra`), no en su valor de mercado actual: así la cláusula refleja
 * la inversión histórica + las mejoras que el dueño haya aplicado.
 * Fórmula: precioCompra + (inversión del dueño × 2).
 * @param {Object} elemento - Carta del garaje con campos precioCompra y clausulaInvertida.
 * @returns {number} Precio total de la cláusula.
 */
export const calcularPrecioClausula = (elemento) => {
  const precioBase = elemento.precioCompra ?? elemento.precio
  const inversionDueño = elemento.clausulaInvertida || 0
  return precioBase + inversionDueño * 2
}

/**
 * Determina si una carta está protegida por el periodo de gracia tras adquisición.
 * @param {Object} elemento - Carta del garaje con campo fechaAdquisicion (ISO string).
 * @returns {boolean} true si la carta aún está dentro del periodo de gracia.
 */
export const estaEnPeriodoDeGracia = (elemento) => {
  if (!elemento.fechaAdquisicion) return false

  const fechaAdquisicion = new Date(elemento.fechaAdquisicion)
  const milisegundosGracia = HORAS_PERIODO_GRACIA * 60 * 60 * 1000
  return Date.now() - fechaAdquisicion.getTime() < milisegundosGracia
}

/**
 * Calcula las horas restantes del periodo de gracia de una carta.
 * @param {Object} elemento - Carta del garaje con campo fechaAdquisicion.
 * @returns {number} Horas restantes (0 si ya expiró).
 */
export const horasRestantesDeGracia = (elemento) => {
  if (!elemento.fechaAdquisicion) return 0

  const fechaAdquisicion = new Date(elemento.fechaAdquisicion)
  const milisegundosGracia = HORAS_PERIODO_GRACIA * 60 * 60 * 1000
  const restante = milisegundosGracia - (Date.now() - fechaAdquisicion.getTime())
  return Math.max(0, Math.ceil(restante / (1000 * 60 * 60)))
}

/**
 * Ejecuta una cláusula de rescisión delegando en la Cloud Function que valida
 * permisos, precio y presupuesto de forma atómica en servidor.
 * @param {string} idParticipanteRival - Participación del dueño actual de la carta.
 * @param {string} idParticipantePropio - Participación del comprador.
 * @param {number} instanciaId - instancia_id de la carta a fichar.
 * @returns {Promise<{ ok: boolean, nombre: string, precioClausula: number }>}
 */
export const ejecutarClausulazo = async (
  idParticipanteRival,
  idParticipantePropio,
  instanciaId,
) => {
  const respuesta = await llamadaEjecutarClausulazo({
    idParticipanteRival,
    idParticipantePropio,
    instanciaId,
  })
  return respuesta.data
}

/**
 * Actualiza la inversión en cláusula de un elemento del garaje en Firestore.
 * @param {string} idParticipante - ID de la participación.
 * @param {Object} garajeActualizado - Garaje con la clausulaInvertida ya modificada.
 * @param {number} nuevoPresupuesto - Presupuesto tras descontar la inversión.
 * @returns {Promise<void>}
 */
export const persistirInversionClausula = async (
  idParticipante,
  garajeActualizado,
  nuevoPresupuesto,
) => {
  const referencia = doc(db, 'participaciones', idParticipante)
  const lote = writeBatch(db)
  lote.update(referencia, {
    garaje: garajeActualizado,
    presupuesto: nuevoPresupuesto,
  })
  await lote.commit()
}
