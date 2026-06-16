const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { FieldValue } = require('firebase-admin/firestore')

const { db } = require('../comun/firebase')
const { OPCIONES } = require('../comun/constantes')
const { exigirAdministrador, exigirEmailAutenticado } = require('../comun/autenticacion')
const { agregarBorradoPujasUsuario } = require('./mercado')

// Borra la liga y todo lo asociado (participaciones, mercados con pujas,
// actividad, vínculos en `usuarios.ligasIds`) en un único commit. Si quedara
// una colección a medio borrar, el usuario vería "fantasmas" en la UI.
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

exports.borrarLigaEnCascada = borrarLigaEnCascada

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

// Uso FieldValue.increment(-1) para el contador `participantes`: dos
// expulsiones simultáneas se sumarían correctamente, cosa que un
// `participantes - 1` calculado en cliente no garantiza.
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

  // Las participaciones antiguas no guardan uid_usuario: lo busco por correo
  // para poder limpiar también su array ligasIds.
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

  await agregarBorradoPujasUsuario(batch, idLiga, correoExpulsado)

  await batch.commit()

  return {
    ok: true,
    idLiga,
    emailExpulsado: correoExpulsado,
    nombreExpulsado: datosParticipacion.nombre_usuario || correoExpulsado,
  }
})
