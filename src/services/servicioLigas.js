/**
 * Servicio de ligas: centraliza las operaciones de Firestore relacionadas con
 * ligas y participaciones. Los stores importan desde aquí, nunca desde Firebase.
 */
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  arrayUnion,
  arrayRemove,
  getDoc,
  deleteDoc,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './servicioFirebase'

const llamadaInicializarMercado = httpsCallable(functions, 'inicializarMercado')
const llamadaEliminarLigaOrganizador = httpsCallable(functions, 'eliminarLiga')
const llamadaExpulsarParticipante = httpsCallable(functions, 'expulsarParticipante')

export const inicializarMercado = async (idLiga) => {
  const respuesta = await llamadaInicializarMercado({ idLiga })
  return respuesta.data
}

export const eliminarLiga = async (idLiga) => {
  const respuesta = await llamadaEliminarLigaOrganizador({ idLiga })
  return respuesta.data
}

export const expulsarParticipante = async (idLiga, emailExpulsado) => {
  const respuesta = await llamadaExpulsarParticipante({ idLiga, emailExpulsado })
  return respuesta.data
}

/* ─── Ligas ──────────────────────────────────────────────────────────────── */

export const cargarLigas = async (idsLigas) => {
  const instantanea = await getDocs(collection(db, 'ligas'))
  return instantanea.docs
    .map((documento) => ({ id: documento.id, ...documento.data() }))
    .filter((liga) => idsLigas.includes(liga.id))
}

export const cargarLiga = async (idLiga) => {
  const documentoLiga = await getDoc(doc(db, 'ligas', idLiga))
  return documentoLiga.exists() ? { id: documentoLiga.id, ...documentoLiga.data() } : null
}

export const buscarLigaPorCodigo = async (codigoInvitacion) => {
  const consulta = query(
    collection(db, 'ligas'),
    where('codigo_invitacion', '==', codigoInvitacion),
  )
  const instantanea = await getDocs(consulta)
  if (instantanea.empty) return null
  const documento = instantanea.docs[0]
  return { id: documento.id, ...documento.data() }
}

export const crearLiga = async (datosLiga) => {
  const referencia = await addDoc(collection(db, 'ligas'), datosLiga)
  return referencia.id
}

export const actualizarLiga = async (idLiga, datos) => {
  await updateDoc(doc(db, 'ligas', idLiga), datos)
}

/* ─── Participaciones ────────────────────────────────────────────────────── */

export const crearParticipacion = async (datosParticipacion) => {
  const referencia = await addDoc(collection(db, 'participaciones'), datosParticipacion)
  return referencia.id
}

export const cargarParticipantes = async (idLiga) => {
  const consulta = query(collection(db, 'participaciones'), where('id_liga', '==', idLiga))
  const instantanea = await getDocs(consulta)
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

export const actualizarParticipacion = async (idParticipacion, datos) => {
  await updateDoc(doc(db, 'participaciones', idParticipacion), datos)
}

export const eliminarParticipacion = async (idParticipacion) => {
  await deleteDoc(doc(db, 'participaciones', idParticipacion))
}

/** Cuenta cuántas ligas administra un usuario (límite 2 por usuario). */
export const contarLigasOrganizadas = async (correoUsuario) => {
  const consulta = query(
    collection(db, 'participaciones'),
    where('email_usuario', '==', correoUsuario),
    where('rol', '==', 'organizador'),
  )
  const instantanea = await getDocs(consulta)
  return instantanea.size
}

/* ─── Usuarios ───────────────────────────────────────────────────────────── */

export const vincularLigaAlUsuario = async (uid, idLiga) => {
  await updateDoc(doc(db, 'usuarios', uid), { ligasIds: arrayUnion(idLiga) })
}

export const desvincularLigaDelUsuario = async (uid, idLiga) => {
  await updateDoc(doc(db, 'usuarios', uid), { ligasIds: arrayRemove(idLiga) })
}

export const cargarParticipacionDeUsuario = async (idLiga, correoUsuario) => {
  const consulta = query(
    collection(db, 'participaciones'),
    where('id_liga', '==', idLiga),
    where('email_usuario', '==', correoUsuario),
  )
  const instantanea = await getDocs(consulta)
  if (instantanea.empty) return null
  const documento = instantanea.docs[0]
  return { id: documento.id, ...documento.data() }
}

/* ─── Garaje de participante ─────────────────────────────────────────────── */

/** Garaje público de un rival (nunca expone el presupuesto). */
export const cargarGarajeRival = async (idParticipacion) => {
  const documento = await getDoc(doc(db, 'participaciones', idParticipacion))
  if (!documento.exists()) return null

  const datos = documento.data()
  const garajeOriginal = datos.garaje || {
    coches: [],
    pilotos: [],
    potenciadores: [],
  }

  const garajeMigrado = { ...garajeOriginal }
  if (garajeMigrado.coche !== undefined || !garajeMigrado.coches) {
    garajeMigrado.coches = garajeMigrado.coche ? [{ ...garajeMigrado.coche, equipado: true }] : []
    delete garajeMigrado.coche
  }
  garajeMigrado.pilotos = (garajeMigrado.pilotos || []).map((p) => ({
    ...p,
    equipado: p.equipado !== undefined ? p.equipado : true,
  }))
  garajeMigrado.potenciadores = garajeMigrado.potenciadores || []

  return {
    id: documento.id,
    nombreUsuario: datos.nombre_usuario || 'Desconocido',
    puntos: datos.puntos || 0,
    ultimaJornada: datos.ultimaJornada || null,
    garaje: garajeMigrado,
  }
}

/** Ranking ordenado por puntos desc, desempate por presupuesto desc. */
export const cargarClasificacion = async (idLiga) => {
  const participaciones = await cargarParticipantes(idLiga)

  const filasRanking = participaciones.map((participacion) => {
    const garaje = participacion.garaje || {}
    const todasLasCartas = [
      ...(garaje.coches || []),
      ...(garaje.pilotos || []),
      ...(garaje.potenciadores || []),
    ]
    const valorGaraje = todasLasCartas.reduce((suma, carta) => suma + Number(carta?.precio || 0), 0)

    return {
      id: participacion.id,
      correo: participacion.email_usuario,
      nombre: participacion.nombre_usuario || 'Desconocido',
      puntos: participacion.puntos || 0,
      presupuesto: participacion.presupuesto || 0,
      valorGaraje: Math.round(valorGaraje * 10) / 10,
    }
  })

  return filasRanking.sort(
    (primero, segundo) =>
      segundo.puntos - primero.puntos || segundo.presupuesto - primero.presupuesto,
  )
}
