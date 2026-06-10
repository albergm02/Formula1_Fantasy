import { httpsCallable } from 'firebase/functions'
import { functions } from './servicioFirebase'

const HORAS_PERIODO_GRACIA = 48
const llamadaEjecutarClausulazo = httpsCallable(functions, 'ejecutarClausulazo')

/**
 * Precio de cláusula = lo que pagó el dueño + (su inversión × 2).
 * Se usa el precio histórico de compra, no el de mercado actual.
 */
export const calcularPrecioClausula = (elemento) => {
  const precioBase = elemento.precioCompra ?? elemento.precio
  const inversionDueño = elemento.clausulaInvertida || 0
  return precioBase + inversionDueño * 2
}

export const estaEnPeriodoDeGracia = (elemento) => {
  if (!elemento.fechaAdquisicion) return false
  const fechaAdquisicion = new Date(elemento.fechaAdquisicion)
  const milisegundosGracia = HORAS_PERIODO_GRACIA * 60 * 60 * 1000
  return Date.now() - fechaAdquisicion.getTime() < milisegundosGracia
}

export const horasRestantesDeGracia = (elemento) => {
  if (!elemento.fechaAdquisicion) return 0
  const fechaAdquisicion = new Date(elemento.fechaAdquisicion)
  const milisegundosGracia = HORAS_PERIODO_GRACIA * 60 * 60 * 1000
  const restante = milisegundosGracia - (Date.now() - fechaAdquisicion.getTime())
  return Math.max(0, Math.ceil(restante / (1000 * 60 * 60)))
}

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
