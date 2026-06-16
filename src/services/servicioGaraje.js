import { httpsCallable } from 'firebase/functions'
import { functions } from './servicioFirebase'

const llamadaVender = httpsCallable(functions, 'venderCartaParticipante')
const llamadaAlternar = httpsCallable(functions, 'alternarCartaEquipada')
const llamadaInvertirClausula = httpsCallable(functions, 'invertirEnClausulaCarta')
const llamadaEjecutarClausulazo = httpsCallable(functions, 'ejecutarClausulazo')

export const venderCartaParticipante = async (idParticipante, instanciaId) => {
  const respuesta = await llamadaVender({ idParticipante, instanciaId })
  return respuesta.data
}

export const alternarCartaEquipada = async (idParticipante, instanciaId) => {
  const respuesta = await llamadaAlternar({ idParticipante, instanciaId })
  return respuesta.data
}

export const invertirEnClausulaCarta = async (idParticipante, instanciaId, cantidad) => {
  const respuesta = await llamadaInvertirClausula({ idParticipante, instanciaId, cantidad })
  return respuesta.data
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
