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
  const respuesta = await llamadaEjecutarClausula({
    idParticipanteRival,
    idParticipantePropio,
    instanciaId,
  })
  return respuesta.data
}
