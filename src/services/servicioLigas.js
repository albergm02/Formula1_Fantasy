/**
 * Servicio de ligas: centraliza TODAS las operaciones de Firestore relacionadas con ligas y participaciones.
 * Los stores importan únicamente desde este módulo; nunca desde Firebase directamente.
 * @module servicioLigas
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
import { db } from './servicioFirebase'

/* ─── Ligas ──────────────────────────────────────────────────────────────── */

/**
 * Carga los documentos de liga que coincidan con los IDs proporcionados.
 * @param {string[]} idsLigas - Lista de IDs de liga a cargar.
 * @returns {Promise<Array>} Array de objetos de liga con su ID incluido.
 */
export const cargarLigasPorIds = async (idsLigas) => {
  const instantanea = await getDocs(collection(db, 'ligas'))
  return instantanea.docs
    .map((documento) => ({ id: documento.id, ...documento.data() }))
    .filter((liga) => idsLigas.includes(liga.id))
}

/**
 * Obtiene un único documento de liga por su ID.
 * Devuelve null si no existe, para que el store décida cómo manejar la ausencia.
 * @param {string} idLiga
 * @returns {Promise<Object|null>}
 */
export const cargarLiga = async (idLiga) => {
  const documentoLiga = await getDoc(doc(db, 'ligas', idLiga))
  return documentoLiga.exists() ? { id: documentoLiga.id, ...documentoLiga.data() } : null
}

/**
 * Busca una liga por su código de invitación.
 * Devuelve null si no existe.
 * @param {string} codigoInvitacion - Código de 6 caracteres en mayúsculas.
 * @returns {Promise<Object|null>}
 */
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

/**
 * Crea un nuevo documento de liga en Firestore.
 * @param {Object} datosLiga - Campos del documento: nombre, admin, codigo_invitacion, participantes, fecha_creacion.
 * @returns {Promise<string>} El ID del documento creado.
 */
export const crearDocumentoLiga = async (datosLiga) => {
  const referencia = await addDoc(collection(db, 'ligas'), datosLiga)
  return referencia.id
}

/**
 * Actualiza campos de un documento de liga existente.
 * @param {string} idLiga
 * @param {Object} datos - Campos a actualizar.
 * @returns {Promise<void>}
 */
export const actualizarLiga = async (idLiga, datos) => {
  await updateDoc(doc(db, 'ligas', idLiga), datos)
}

/**
 * Elimina el documento de una liga de Firestore.
 * @param {string} idLiga
 * @returns {Promise<void>}
 */
export const eliminarDocumentoLiga = async (idLiga) => {
  await deleteDoc(doc(db, 'ligas', idLiga))
}

/* ─── Participaciones ────────────────────────────────────────────────────── */

/**
 * Crea una nueva participación de usuario en una liga.
 * @param {Object} datosParticipacion - Campos: id_liga, email_usuario, rol, presupuesto, puntos, garaje.
 * @returns {Promise<void>}
 */
export const crearParticipacion = async (datosParticipacion) => {
  await addDoc(collection(db, 'participaciones'), datosParticipacion)
}

/**
 * Carga todas las participaciones de una liga concreta.
 * @param {string} idLiga
 * @returns {Promise<Array>} Array de participaciones con su ID incluido.
 */
export const cargarParticipacionesLiga = async (idLiga) => {
  const consulta = query(collection(db, 'participaciones'), where('id_liga', '==', idLiga))
  const instantanea = await getDocs(consulta)
  return instantanea.docs.map((documento) => ({ id: documento.id, ...documento.data() }))
}

/**
 * Actualiza campos de una participación existente.
 * @param {string} idParticipacion
 * @param {Object} datos - Campos a actualizar.
 * @returns {Promise<void>}
 */
export const actualizarParticipacion = async (idParticipacion, datos) => {
  await updateDoc(doc(db, 'participaciones', idParticipacion), datos)
}

/**
 * Elimina una participación de Firestore.
 * @param {string} idParticipacion
 * @returns {Promise<void>}
 */
export const eliminarParticipacion = async (idParticipacion) => {
  await deleteDoc(doc(db, 'participaciones', idParticipacion))
}

/**
 * Cuenta cuántas ligas administra un usuario.
 * Se usa para aplicar el límite de 2 ligas creadas por usuario.
 * @param {string} correoUsuario
 * @returns {Promise<number>}
 */
export const contarLigasAdministradas = async (correoUsuario) => {
  const consulta = query(
    collection(db, 'participaciones'),
    where('email_usuario', '==', correoUsuario),
    where('rol', '==', 'admin'),
  )
  const instantanea = await getDocs(consulta)
  return instantanea.size
}

/* ─── Usuarios ───────────────────────────────────────────────────────────── */

/**
 * Añade el ID de una liga al array de ligas del usuario en Firestore.
 * @param {string} correoUsuario
 * @param {string} idLiga
 * @returns {Promise<void>}
 */
export const vincularLigaAlUsuario = async (correoUsuario, idLiga) => {
  await updateDoc(doc(db, 'usuarios', correoUsuario), { ligasIds: arrayUnion(idLiga) })
}

/**
 * Elimina el ID de una liga del array de ligas del usuario en Firestore.
 * @param {string} correoUsuario
 * @param {string} idLiga
 * @returns {Promise<void>}
 */
export const desvincularLigaDelUsuario = async (correoUsuario, idLiga) => {
  await updateDoc(doc(db, 'usuarios', correoUsuario), { ligasIds: arrayRemove(idLiga) })
}
