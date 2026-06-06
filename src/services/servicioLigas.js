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
import { httpsCallable } from 'firebase/functions'
import { db, functions } from './servicioFirebase'

const llamadaInicializarMercado = httpsCallable(functions, 'generarMercadoInicialLiga')

/**
 * Solicita al backend que genere el primer mercado de una liga recién creada.
 * Idempotente: si el mercado de hoy ya existe para la liga, no lo recrea.
 * @param {string} idLiga
 * @returns {Promise<Object>} { ok, idMercado, totalCartas, fechaCierre } o el omitido.
 */
export const inicializarMercadoLiga = async (idLiga) => {
  const respuesta = await llamadaInicializarMercado({ idLiga })
  return respuesta.data
}

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
 * Añade un correo a la lista de usuarios expulsados de una liga.
 * Impide que el usuario pueda volver a unirse con el mismo código de invitación.
 * @param {string} idLiga
 * @param {string} correoExpulsado
 * @returns {Promise<void>}
 */
export const añadirEmailExpulsado = async (idLiga, correoExpulsado) => {
  await updateDoc(doc(db, 'ligas', idLiga), { expulsados: arrayUnion(correoExpulsado) })
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
 * @returns {Promise<string>} El ID del documento de participación creado.
 */
export const crearParticipacion = async (datosParticipacion) => {
  const referencia = await addDoc(collection(db, 'participaciones'), datosParticipacion)
  return referencia.id
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
 * El documento se identifica por el UID de Firebase Auth, no por el correo.
 * @param {string} uid - UID de Firebase Auth del usuario.
 * @param {string} idLiga
 * @returns {Promise<void>}
 */
export const vincularLigaAlUsuario = async (uid, idLiga) => {
  await updateDoc(doc(db, 'usuarios', uid), { ligasIds: arrayUnion(idLiga) })
}

/**
 * Elimina el ID de una liga del array de ligas del usuario en Firestore.
 * El documento se identifica por el UID de Firebase Auth, no por el correo.
 * @param {string} uid - UID de Firebase Auth del usuario.
 * @param {string} idLiga
 * @returns {Promise<void>}
 */
export const desvincularLigaDelUsuario = async (uid, idLiga) => {
  await updateDoc(doc(db, 'usuarios', uid), { ligasIds: arrayRemove(idLiga) })
}

/**
 * Carga la participación de un usuario concreto en una liga concreta.
 * Devuelve null si no existe participación (usuario no apuntado a esa liga).
 * @param {string} idLiga
 * @param {string} correoUsuario
 * @returns {Promise<Object|null>}
 */
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

/**
 * Carga el garaje público de un participante por su ID de participación.
 * Devuelve solo información visible para rivales: nunca incluye el presupuesto
 * (el dinero de cada usuario es información privada).
 * @param {string} idParticipacion
 * @returns {Promise<Object|null>}
 */
export const cargarGarajeDeParticipante = async (idParticipacion) => {
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

/**
 * Carga el ranking completo de una liga: une participaciones con nombres de usuario.
 * Ordena por puntos (desc) y usa presupuesto como criterio de desempate (desc).
 * @param {string} idLiga
 * @returns {Promise<Array<{ id: string, correo: string, nombre: string, puntos: number, presupuesto: number }>>}
 */
export const cargarRankingLiga = async (idLiga) => {
  const participaciones = await cargarParticipacionesLiga(idLiga)

  const filasRanking = participaciones.map((participacion) => ({
    id: participacion.id,
    correo: participacion.email_usuario,
    nombre: participacion.nombre_usuario || 'Desconocido',
    puntos: participacion.puntos || 0,
    presupuesto: participacion.presupuesto || 0,
  }))

  return filasRanking.sort(
    (primero, segundo) =>
      segundo.puntos - primero.puntos || segundo.presupuesto - primero.presupuesto,
  )
}
