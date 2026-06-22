import { httpsCallable } from 'firebase/functions'
import { functions } from './servicioFirebase'

const llamadaVender = httpsCallable(functions, 'venderCarta')
const llamadaAlternar = httpsCallable(functions, 'alternarAlineacion')
const llamadaGestionarClausula = httpsCallable(functions, 'gestionarClausula')
const llamadaEjecutarClausula = httpsCallable(functions, 'ejecutarClausula')

export const venderCarta = async (idParticipante, instanciaId) => {
  const respuesta = await llamadaVender({ idParticipante, instanciaId })
  return respuesta.data
}

export const alternarAlineacion = async (idParticipante, instanciaId) => {
  const respuesta = await llamadaAlternar({ idParticipante, instanciaId })
  return respuesta.data
}

export const gestionarClausula = async (idParticipante, instanciaId, cantidad) => {
  const respuesta = await llamadaGestionarClausula({ idParticipante, instanciaId, cantidad })
  return respuesta.data
}

export const ejecutarClausula = async (idParticipanteRival, idParticipantePropio, instanciaId) => {
  const respuesta = await llamadaEjecutarClausula({ idParticipanteRival, idParticipantePropio, instanciaId })
  return respuesta.data
}

const HORAS_PERIODO_GRACIA = 48

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
