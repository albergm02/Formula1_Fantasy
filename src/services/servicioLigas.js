import { collection, doc, getDocs, query, where, arrayRemove, getDoc, updateDoc, documentId } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './servicioFirebase'

const llamadaCrearLiga = httpsCallable(functions, 'crearLiga')
const llamadaUnirseALiga = httpsCallable(functions, 'unirseALiga')
const llamadaAbandonarLiga = httpsCallable(functions, 'abandonarLiga')
const llamadaEliminarLiga = httpsCallable(functions, 'eliminarLiga')
const llamadaExpulsarParticipante = httpsCallable(functions, 'expulsarParticipante')

/**
 * Crea una nueva liga.
 * @param {string} nombreLiga - Nombre de la liga.
 * @returns {Object} - Datos de la liga creada.
 */
export const crearLiga = async (nombreLiga) => {
  const respuesta = await llamadaCrearLiga({ nombreLiga })
  return respuesta.data
}

/**
 * Permite a un usuario unirse a una liga existente.
 * @param {string} codigoInvitacion - Código de invitación de la liga.
 * @returns {Object} - Datos de la participación del usuario en la liga.
 */
export const unirseALiga = async (codigoInvitacion) => {
  const respuesta = await llamadaUnirseALiga({ codigoInvitacion })
  return respuesta.data
}

/**
 * Permite a un usuario abandonar una liga.
 * @param {string} idLiga - ID de la liga.
 * @returns {Object} - Datos de la operación.
 */
export const abandonarLiga = async (idLiga) => {
  const respuesta = await llamadaAbandonarLiga({ idLiga })
  return respuesta.data
}

/**
 * Elimina una liga existente.
 * @param {string} idLiga - ID de la liga.
 * @returns {Object} - Datos de la operación.
 */
export const eliminarLiga = async (idLiga) => {
  const respuesta = await llamadaEliminarLiga({ idLiga })
  return respuesta.data
}

/**
 * Expulsa a un participante de una liga.
 * @param {string} idLiga - ID de la liga.
 * @param {string} emailExpulsado - Correo electrónico del participante a expulsar.
 * @returns {Object} - Datos de la operación.
 */
export const expulsarParticipante = async (idLiga, emailExpulsado) => {
  const respuesta = await llamadaExpulsarParticipante({ idLiga, emailExpulsado })
  return respuesta.data
}

/**
 * Carga las ligas correspondientes a los IDs proporcionados.
 * @param {Array<string>} idsLigas - IDs de las ligas.
 * @returns {Array<Object>} - Datos de las ligas.
 */
export const cargarLigas = async (idsLigas) => {
  const consulta = query(collection(db, 'ligas'), where(documentId(), 'in', idsLigas))
  const instantanea = await getDocs(consulta)
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

/**
 * Carga los participantes de una liga.
 * @param {string} idLiga - ID de la liga.
 * @returns {Array<Object>} - Datos de los participantes.
 */
export const cargarParticipantes = async (idLiga) => {
  const consulta = query(collection(db, 'participaciones'), where('id_liga', '==', idLiga))
  const instantanea = await getDocs(consulta)
  const participaciones = instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))

  const docsUsuario = await Promise.all(
    participaciones.map((p) => (p.uid_usuario ? getDoc(doc(db, 'usuarios', p.uid_usuario)) : Promise.resolve(null))),
  )

  return participaciones.map((participacion, indice) => {
    const datosUsuario = docsUsuario[indice]?.exists() ? docsUsuario[indice].data() : {}
    return { ...participacion, nombre_usuario: datosUsuario.nombreVisible || participacion.nombre_usuario }
  })
}

/**
 * Carga la participación de un usuario en una liga.
 * @param {string} idLiga - ID de la liga.
 * @param {string} correoUsuario - Correo electrónico del usuario.
 * @returns {Object|null} - Datos de la participación del usuario o null si no existe.
 */
export const cargarParticipacionDeUsuario = async (idLiga, correoUsuario) => {
  const consulta = query(collection(db, 'participaciones'), where('id_liga', '==', idLiga), where('email_usuario', '==', correoUsuario))
  const instantanea = await getDocs(consulta)
  if (instantanea.empty) return null
  const documento = instantanea.docs[0]
  return { id: documento.id, ...documento.data() }
}

/**
 * Desvincula una liga de un usuario.
 * @param {string} uid - ID del usuario.
 * @param {string} idLiga - ID de la liga.
 * @returns {Promise<void>} - Promesa que se resuelve cuando la operación se completa.
 */
export const desvincularLigaDelUsuario = async (uid, idLiga) => {
  await updateDoc(doc(db, 'usuarios', uid), { ligasIds: arrayRemove(idLiga) })
}

/**
 * Carga el garaje de un rival en una liga.
 * @param {string} idParticipacion - ID de la participación del rival.
 * @returns {Object|null} - Datos del garaje del rival o null si no existe.
 */
export const cargarGarajeRival = async (idParticipacion) => {
  const documento = await getDoc(doc(db, 'participaciones', idParticipacion))
  if (!documento.exists()) return null

  const datos = documento.data()
  const garajeOriginal = datos.garaje || { coches: [], pilotos: [], potenciadores: [] }

  const docUsuario = await getDoc(doc(db, 'usuarios', datos.uid_usuario))
  const nombreActual = docUsuario.exists() ? docUsuario.data().nombreVisible : datos.nombre_usuario

  return {
    id: documento.id,
    nombreUsuario: nombreActual || 'Desconocido',
    puntos: datos.puntos || 0,
    ultimaJornada: datos.ultimaJornada || null,
    garaje: garajeOriginal,
  }
}

/**
 * Carga la clasificación de una liga.
 * @param {string} idLiga - ID de la liga.
 * @returns {Array<Object>} - Datos de la clasificación.
 */
export const cargarClasificacion = async (idLiga) => {
  const participaciones = await cargarParticipantes(idLiga)
  const docsUsuario = await Promise.all(participaciones.map((p) => getDoc(doc(db, 'usuarios', p.uid_usuario))))

  const filasRanking = participaciones.map((participacion, indice) => {
    const datosUsuario = docsUsuario[indice].exists() ? docsUsuario[indice].data() : {}
    const garaje = participacion.garaje || {}
    const todasLasCartas = [...(garaje.coches || []), ...(garaje.pilotos || []), ...(garaje.potenciadores || [])]
    const valorGaraje = todasLasCartas.reduce((suma, carta) => suma + Number(carta?.precio || 0), 0)

    return {
      id: participacion.id,
      correo: participacion.email_usuario,
      nombre: datosUsuario.nombreVisible || participacion.nombre_usuario || 'Desconocido',
      puntos: participacion.puntos || 0,
      presupuesto: participacion.presupuesto || 0,
      valorGaraje: Math.round(valorGaraje * 10) / 10,
    }
  })

  return filasRanking.sort((primero, segundo) => segundo.puntos - primero.puntos || segundo.presupuesto - primero.presupuesto)
}
