/**
 * Servicio de ligas: centraliza las operaciones de Firestore relacionadas con
 * ligas y participaciones. Los stores importan desde aquí, nunca desde Firebase.
 *
 * Principio Commands/Queries:
 *  - Queries (lecturas): se ejecutan directamente desde el cliente vía SDK.
 *  - Commands (escrituras): se delegan a Cloud Functions para garantizar
 *    atomicidad y validación server-side.
 */
import { collection, doc, getDocs, query, where, arrayRemove, getDoc, updateDoc, documentId } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './servicioFirebase'
import { migrarGaraje } from '@/utils/migracionGaraje'

const llamadaCrearLiga = httpsCallable(functions, 'crearLiga')
const llamadaUnirseALiga = httpsCallable(functions, 'unirseALiga')
const llamadaAbandonarLiga = httpsCallable(functions, 'abandonarLiga')
const llamadaEliminarLiga = httpsCallable(functions, 'eliminarLiga')
const llamadaExpulsarParticipante = httpsCallable(functions, 'expulsarParticipante')

/** @param {string} nombreLiga */
export const crearLiga = async (nombreLiga) => {
  const respuesta = await llamadaCrearLiga({ nombreLiga })
  return respuesta.data
}

/** @param {string} codigoInvitacion */
export const unirseALiga = async (codigoInvitacion) => {
  const respuesta = await llamadaUnirseALiga({ codigoInvitacion })
  return respuesta.data
}

/** @param {string} idLiga */
export const abandonarLiga = async (idLiga) => {
  const respuesta = await llamadaAbandonarLiga({ idLiga })
  return respuesta.data
}

/** @param {string} idLiga */
export const eliminarLiga = async (idLiga) => {
  const respuesta = await llamadaEliminarLiga({ idLiga })
  return respuesta.data
}

/**
 * @param {string} idLiga
 * @param {string} emailExpulsado
 */
export const expulsarParticipante = async (idLiga, emailExpulsado) => {
  const respuesta = await llamadaExpulsarParticipante({ idLiga, emailExpulsado })
  return respuesta.data
}

/** @param {string} idLiga */
export const inicializarMercado = async (idLiga) => {
  const respuesta = await httpsCallable(functions, 'inicializarMercado')({ idLiga })
  return respuesta.data
}

/* ─── Queries: Ligas ─────────────────────────────────────────────────────── */

export const cargarLigas = async (idsLigas) => {
  const consulta = query(collection(db, 'ligas'), where(documentId(), 'in', idsLigas))
  const instantanea = await getDocs(consulta)
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

export const cargarLiga = async (idLiga) => {
  const documentoLiga = await getDoc(doc(db, 'ligas', idLiga))
  return documentoLiga.exists() ? { id: documentoLiga.id, ...documentoLiga.data() } : null
}

export const buscarLigaPorCodigo = async (codigoInvitacion) => {
  const consulta = query(collection(db, 'ligas'), where('codigo_invitacion', '==', codigoInvitacion))
  const instantanea = await getDocs(consulta)
  if (instantanea.empty) return null
  const documento = instantanea.docs[0]
  return { id: documento.id, ...documento.data() }
}

/* ─── Queries: Participaciones ───────────────────────────────────────────── */

export const cargarParticipantes = async (idLiga) => {
  const consulta = query(collection(db, 'participaciones'), where('id_liga', '==', idLiga))
  const instantanea = await getDocs(consulta)
  const participaciones = instantanea.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  }))

  const docsUsuario = await Promise.all(
    participaciones.map((p) => (p.uid_usuario ? getDoc(doc(db, 'usuarios', p.uid_usuario)) : Promise.resolve(null))),
  )

  return participaciones.map((participacion, indice) => {
    const datosUsuario = docsUsuario[indice]?.exists() ? docsUsuario[indice].data() : {}
    return {
      ...participacion,
      nombre_usuario: datosUsuario.nombreVisible || participacion.nombre_usuario,
    }
  })
}

/** Cuenta cuántas ligas administra un usuario (límite 2 por usuario). */
export const contarLigasOrganizadas = async (correoUsuario) => {
  const consulta = query(collection(db, 'participaciones'), where('email_usuario', '==', correoUsuario), where('rol', '==', 'organizador'))
  const instantanea = await getDocs(consulta)
  return instantanea.size
}

export const cargarParticipacionDeUsuario = async (idLiga, correoUsuario) => {
  const consulta = query(collection(db, 'participaciones'), where('id_liga', '==', idLiga), where('email_usuario', '==', correoUsuario))
  const instantanea = await getDocs(consulta)
  if (instantanea.empty) return null
  const documento = instantanea.docs[0]
  return { id: documento.id, ...documento.data() }
}

/* ─── Queries: Usuarios ──────────────────────────────────────────────────── */

/**
 * Desvincula una liga del array `ligasIds` del usuario. Se usa exclusivamente
 * para limpiar referencias huérfanas detectadas durante la carga de ligas.
 */
export const desvincularLigaDelUsuario = async (uid, idLiga) => {
  await updateDoc(doc(db, 'usuarios', uid), { ligasIds: arrayRemove(idLiga) })
}

/* ─── Queries: Garaje de participante ────────────────────────────────────── */

/** Garaje público de un rival (nunca expone el presupuesto). */
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
    garaje: migrarGaraje(garajeOriginal),
  }
}

/** Ranking ordenado por puntos desc, desempate por presupuesto desc. */
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
