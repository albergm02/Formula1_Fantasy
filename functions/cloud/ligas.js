/**
 * Gestión de ligas en servidor: borrado en cascada y expulsión de participantes.
 *
 * Estas operaciones afectan a varias colecciones (participaciones, mercados,
 * pujas, actividad, vínculos en `usuarios.ligasIds`…) y por eso vive en
 * Cloud Functions: el Admin SDK ignora las reglas de Firestore, así que aquí
 * puedo recoger todo en un único batch atómico y validar los permisos a mano.
 *
 * El criterio de autorización es siempre el correo del token: el invocador
 * debe ser administrador global o el organizador de la liga concreta.
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { FieldValue } = require('firebase-admin/firestore')

const { db } = require('../comun/firebase')
const { OPCIONES } = require('../comun/constantes')
const { exigirAdministrador, exigirEmailAutenticado } = require('../comun/autenticacion')

/**
 * Borra una liga completa en un único batch atómico:
 *  - Participaciones (con sus garajes y presupuestos).
 *  - Mercados de la liga con sus subcolecciones de pujas.
 *  - Eventos de la colección `actividad` asociados a la liga.
 *  - Desvinculación del array `ligasIds` de cada usuario afectado.
 *  - El propio documento de la liga.
 *
 * Lo hago en un solo `commit` porque, si quedara una sola colección a medio
 * borrar, el usuario vería "fantasmas" de su antigua liga en la UI o la
 * volvería a recibir como invitación. Atomicidad o nada.
 *
 * @param {string} idLiga
 * @param {FirebaseFirestore.DocumentSnapshot} ligaSnap - Snapshot ya cargado.
 * @returns {Promise<Object>} Resumen con los conteos de lo borrado.
 */
async function borrarLigaEnCascada(idLiga, ligaSnap) {
  const batch = db.batch()

  const participacionesSnap = await db
    .collection('participaciones')
    .where('id_liga', '==', idLiga)
    .get()
  for (const documento of participacionesSnap.docs) {
    batch.delete(documento.ref)
  }

  const mercadosSnap = await db.collection('mercados').where('idLiga', '==', idLiga).get()
  for (const documentoMercado of mercadosSnap.docs) {
    const pujasSnap = await documentoMercado.ref.collection('pujas').get()
    for (const documentoPuja of pujasSnap.docs) {
      batch.delete(documentoPuja.ref)
    }
    batch.delete(documentoMercado.ref)
  }

  const actividadSnap = await db.collection('actividad').where('idLiga', '==', idLiga).get()
  for (const documento of actividadSnap.docs) {
    batch.delete(documento.ref)
  }

  const usuariosSnap = await db
    .collection('usuarios')
    .where('ligasIds', 'array-contains', idLiga)
    .get()
  for (const documentoUsuario of usuariosSnap.docs) {
    batch.update(documentoUsuario.ref, { ligasIds: FieldValue.arrayRemove(idLiga) })
  }

  batch.delete(ligaSnap.ref)

  await batch.commit()

  return {
    nombreLiga: ligaSnap.data().nombre || idLiga,
    participacionesBorradas: participacionesSnap.size,
    mercadosBorrados: mercadosSnap.size,
    eventosActividadBorrados: actividadSnap.size,
    usuariosDesvinculados: usuariosSnap.size,
  }
}

/**
 * Callable — el administrador global elimina cualquier liga del sistema.
 *
 * La uso desde el panel de administración (AdministracionView.vue) como
 * "botón rojo" para limpiar ligas problemáticas o de pruebas.
 */
exports.eliminarLigaManual = onCall(OPCIONES, async (request) => {
  await exigirAdministrador(request)
  const { idLiga } = request.data || {}
  if (!idLiga) {
    throw new HttpsError('invalid-argument', 'Falta idLiga.')
  }

  const ligaSnap = await db.collection('ligas').doc(idLiga).get()
  if (!ligaSnap.exists) {
    throw new HttpsError('not-found', `Liga ${idLiga} no encontrada.`)
  }

  const resumen = await borrarLigaEnCascada(idLiga, ligaSnap)
  return { ok: true, idLiga, ...resumen }
})

/**
 * Callable — el organizador de una liga la elimina en cascada.
 *
 * Ejecuta la misma limpieza atómica que `eliminarLigaManual`, pero el
 * permiso aquí es más restrictivo: solo el organizador de esa liga
 * concreta puede invocarla.
 */
exports.eliminarLigaComoOrganizador = onCall(OPCIONES, async (request) => {
  const email = exigirEmailAutenticado(request)
  const { idLiga } = request.data || {}
  if (!idLiga) {
    throw new HttpsError('invalid-argument', 'Falta idLiga.')
  }

  const ligaSnap = await db.collection('ligas').doc(idLiga).get()
  if (!ligaSnap.exists) {
    throw new HttpsError('not-found', `Liga ${idLiga} no encontrada.`)
  }
  if (ligaSnap.data().correoOrganizador !== email) {
    throw new HttpsError('permission-denied', 'Solo el organizador puede eliminar la liga.')
  }

  const resumen = await borrarLigaEnCascada(idLiga, ligaSnap)
  return { ok: true, idLiga, ...resumen }
})

/**
 * Callable — el organizador expulsa a un participante concreto de su liga.
 *
 * Ejecuta en un único batch:
 *  - Borrar la participación del expulsado.
 *  - Añadir su correo al array `expulsados` de la liga (para impedir reingreso).
 *  - Decrementar el contador `participantes` con `FieldValue.increment(-1)`
 *    (atómico: si dos expulsiones simultáneas ocurriesen, el contador
 *    quedaría correcto, cosa que un `participantes - 1` calculado en cliente
 *    no garantiza).
 *  - Quitar la liga del array `ligasIds` del usuario expulsado.
 *  - Crear un evento de actividad para que el resto de jugadores vea qué pasó.
 *
 * Acepta `{ idLiga, emailExpulsado }`.
 */
exports.expulsarParticipanteComoOrganizador = onCall(OPCIONES, async (request) => {
  const emailOrganizador = exigirEmailAutenticado(request)
  const { idLiga, emailExpulsado } = request.data || {}
  if (!idLiga || !emailExpulsado) {
    throw new HttpsError('invalid-argument', 'Falta idLiga o emailExpulsado.')
  }

  const correoExpulsado = String(emailExpulsado).trim().toLowerCase()
  if (correoExpulsado === emailOrganizador.toLowerCase()) {
    throw new HttpsError('failed-precondition', 'No puedes expulsarte a ti mismo.')
  }

  const ligaSnap = await db.collection('ligas').doc(idLiga).get()
  if (!ligaSnap.exists) {
    throw new HttpsError('not-found', `Liga ${idLiga} no encontrada.`)
  }
  const datosLiga = ligaSnap.data()
  if (datosLiga.correoOrganizador !== emailOrganizador) {
    throw new HttpsError('permission-denied', 'Solo el organizador puede expulsar participantes.')
  }

  const participacionSnap = await db
    .collection('participaciones')
    .where('id_liga', '==', idLiga)
    .where('email_usuario', '==', correoExpulsado)
    .limit(1)
    .get()
  if (participacionSnap.empty) {
    throw new HttpsError('not-found', 'El participante no pertenece a esta liga.')
  }
  const participacionExpulsado = participacionSnap.docs[0]
  const datosParticipacion = participacionExpulsado.data()

  /* Las participaciones antiguas no guardan `uid_usuario`. Si no lo tengo, lo
   * busco por correo para poder limpiar también su array `ligasIds`. */
  let uidExpulsado = datosParticipacion.uid_usuario || null
  if (!uidExpulsado) {
    const usuarioSnap = await db
      .collection('usuarios')
      .where('correoAutenticacion', '==', correoExpulsado)
      .limit(1)
      .get()
    if (!usuarioSnap.empty) uidExpulsado = usuarioSnap.docs[0].id
  }

  const batch = db.batch()
  batch.delete(participacionExpulsado.ref)
  batch.update(ligaSnap.ref, {
    expulsados: FieldValue.arrayUnion(correoExpulsado),
    participantes: FieldValue.increment(-1),
  })
  if (uidExpulsado) {
    batch.update(db.collection('usuarios').doc(uidExpulsado), {
      ligasIds: FieldValue.arrayRemove(idLiga),
    })
  }
  batch.create(db.collection('actividad').doc(), {
    idLiga,
    nombreUsuario: datosParticipacion.nombre_usuario || correoExpulsado,
    tipo: 'abandono',
    descripcion: `ha sido expulsado del campeonato ${datosLiga.nombre}`,
    fecha: FieldValue.serverTimestamp(),
  })

  await batch.commit()

  return {
    ok: true,
    idLiga,
    emailExpulsado: correoExpulsado,
    nombreExpulsado: datosParticipacion.nombre_usuario || correoExpulsado,
  }
})
