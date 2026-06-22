const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { FieldValue } = require('firebase-admin/firestore')

const { db } = require('../middleware/firebase')
const { exigirEmailAutenticado } = require('../middleware/autenticacion')
const { agregarBorradoPujasUsuario, ejecutarGeneracionMercadoParaLiga } = require('./mercado')

const OPCIONES = { region: 'europe-west1', enforceAppCheck: true }

// Borra la liga y todo lo asociado (participaciones, mercados con pujas,
// actividad, vínculos en `usuarios.ligasIds`) en un único commit. Si quedara
// una colección a medio borrar, el usuario vería "fantasmas" en la UI.
async function borrarLigaEnCascada(idLiga, ligaSnap) {
  const batch = db.batch()

  const participacionesSnap = await db.collection('participaciones').where('id_liga', '==', idLiga).get()
  for (const documento of participacionesSnap.docs) batch.delete(documento.ref)

  const mercadosSnap = await db.collection('mercados').doc(idLiga).collection('dias').get()
  for (const documentoMercado of mercadosSnap.docs) {
    const pujasSnap = await documentoMercado.ref.collection('pujas').get()
    for (const documentoPuja of pujasSnap.docs) batch.delete(documentoPuja.ref)
    batch.delete(documentoMercado.ref)
  }

  const actividadSnap = await db.collection('actividad').doc(idLiga).collection('eventos').get()
  for (const documento of actividadSnap.docs) batch.delete(documento.ref)
  batch.delete(db.collection('actividad').doc(idLiga))

  const usuariosSnap = await db.collection('usuarios').where('ligasIds', 'array-contains', idLiga).get()
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

exports.inicializarMercado = onCall(OPCIONES, async (request) => {
  const email = exigirEmailAutenticado(request)
  const { idLiga } = request.data || {}
  if (!idLiga) throw new HttpsError('invalid-argument', 'Falta idLiga.')

  const ligaSnap = await db.collection('ligas').doc(idLiga).get()
  if (!ligaSnap.exists) throw new HttpsError('not-found', `Liga ${idLiga} no encontrada.`)
  if (ligaSnap.data().correoOrganizador !== email) {
    throw new HttpsError('permission-denied', 'Solo el organizador de la liga puede inicializarla.')
  }

  const resultado = await ejecutarGeneracionMercadoParaLiga(idLiga)
  return { ok: true, ...resultado }
})

exports.eliminarPujas = onCall(OPCIONES, async (request) => {
  const email = exigirEmailAutenticado(request)
  const { idLiga } = request.data || {}
  if (!idLiga) throw new HttpsError('invalid-argument', 'Falta idLiga.')

  const batch = db.batch()
  const pujasEliminadas = await agregarBorradoPujasUsuario(batch, idLiga, email)
  await batch.commit()

  return { ok: true, pujasEliminadas }
})

exports.eliminarLiga = onCall(OPCIONES, async (request) => {
  const email = exigirEmailAutenticado(request)
  const { idLiga } = request.data || {}
  if (!idLiga) throw new HttpsError('invalid-argument', 'Falta idLiga.')

  const ligaSnap = await db.collection('ligas').doc(idLiga).get()
  if (!ligaSnap.exists) throw new HttpsError('not-found', `Liga ${idLiga} no encontrada.`)
  if (ligaSnap.data().correoOrganizador !== email) {
    throw new HttpsError('permission-denied', 'Solo el organizador puede eliminar la liga.')
  }

  const resumen = await borrarLigaEnCascada(idLiga, ligaSnap)
  return { ok: true, idLiga, ...resumen }
})

// Uso FieldValue.increment(-1) para el contador `participantes`: dos
// expulsiones simultáneas se sumarían correctamente, cosa que un
// `participantes - 1` calculado en cliente no garantiza.
exports.expulsarParticipante = onCall(OPCIONES, async (request) => {
  const emailOrganizador = exigirEmailAutenticado(request)
  const { idLiga, emailExpulsado } = request.data || {}
  if (!idLiga || !emailExpulsado) throw new HttpsError('invalid-argument', 'Falta idLiga o emailExpulsado.')

  const correoExpulsado = String(emailExpulsado).trim().toLowerCase()
  if (correoExpulsado === emailOrganizador.toLowerCase()) {
    throw new HttpsError('failed-precondition', 'No puedes expulsarte a ti mismo.')
  }

  const ligaSnap = await db.collection('ligas').doc(idLiga).get()
  if (!ligaSnap.exists) throw new HttpsError('not-found', `Liga ${idLiga} no encontrada.`)
  const datosLiga = ligaSnap.data()
  if (datosLiga.correoOrganizador !== emailOrganizador) {
    throw new HttpsError('permission-denied', 'Solo el organizador puede expulsar participantes.')
  }

  const participacionSnap = await db.collection('participaciones').where('id_liga', '==', idLiga).where('email_usuario', '==', correoExpulsado).limit(1).get()
  if (participacionSnap.empty) throw new HttpsError('not-found', 'El participante no pertenece a esta liga.')
  const participacionExpulsado = participacionSnap.docs[0]
  const datosParticipacion = participacionExpulsado.data()

  // Las participaciones antiguas no guardan uid_usuario: lo busco por correo
  // para poder limpiar también su array ligasIds.
  let uidExpulsado = datosParticipacion.uid_usuario || null
  if (!uidExpulsado) {
    const usuarioSnap = await db.collection('usuarios').where('correoAutenticacion', '==', correoExpulsado).limit(1).get()
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
  batch.create(db.collection('actividad').doc(idLiga).collection('eventos').doc(), {
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

exports.crearLiga = onCall(OPCIONES, async (request) => {
  const email = exigirEmailAutenticado(request)
  const uid = request.auth.uid
  const { nombreLiga } = request.data || {}

  if (!nombreLiga || !String(nombreLiga).trim()) {
    throw new HttpsError('invalid-argument', 'El nombre de la liga es obligatorio.')
  }

  const nombre = String(nombreLiga).trim()

  const ligasOrganizadasSnap = await db.collection('participaciones').where('email_usuario', '==', email).where('rol', '==', 'organizador').get()
  if (ligasOrganizadasSnap.size >= 2) {
    throw new HttpsError('failed-precondition', 'Has alcanzado el límite máximo de 2 ligas creadas.')
  }

  const usuarioSnap = await db.collection('usuarios').doc(uid).get()
  const datosUsuario = usuarioSnap.data() || {}
  const ligasActuales = datosUsuario.ligasIds || []
  if (ligasActuales.length >= 5) {
    throw new HttpsError('failed-precondition', 'Solo puedes pertenecer a un máximo de 5 ligas.')
  }

  const codigoInvitacion = Math.random().toString(36).substring(2, 10).toUpperCase()
  const nombreVisible = datosUsuario.nombreVisible || datosUsuario.nombre || email

  const batch = db.batch()

  const ligaRef = db.collection('ligas').doc()
  batch.create(ligaRef, {
    nombre,
    correoOrganizador: email,
    codigo_invitacion: codigoInvitacion,
    participantes: 1,
    fecha_creacion: FieldValue.serverTimestamp(),
  })

  batch.create(db.collection('participaciones').doc(), {
    id_liga: ligaRef.id,
    uid_usuario: uid,
    email_usuario: email,
    nombre_usuario: nombreVisible,
    rol: 'organizador',
    presupuesto: 50.0,
    puntos: 0,
    garaje: { coches: [], pilotos: [], potenciadores: [] },
    fecha_union: FieldValue.serverTimestamp(),
  })

  batch.update(db.collection('usuarios').doc(uid), {
    ligasIds: FieldValue.arrayUnion(ligaRef.id),
  })

  batch.create(db.collection('actividad').doc(ligaRef.id).collection('eventos').doc(), {
    idLiga: ligaRef.id,
    nombreUsuario: nombreVisible,
    tipo: 'creacion',
    descripcion: `ha creado el campeonato ${nombre}`,
    fecha: FieldValue.serverTimestamp(),
  })

  await batch.commit()

  ejecutarGeneracionMercadoParaLiga(ligaRef.id).catch((error) => {
    console.error(`Error al generar mercado inicial para liga ${ligaRef.id}:`, error)
  })

  return { ok: true, idLiga: ligaRef.id, codigoInvitacion, nombreLiga: nombre }
})

exports.unirseALiga = onCall(OPCIONES, async (request) => {
  const email = exigirEmailAutenticado(request)
  const uid = request.auth.uid
  const { codigoInvitacion } = request.data || {}

  if (!codigoInvitacion) throw new HttpsError('invalid-argument', 'Falta el código de invitación.')

  const usuarioSnap = await db.collection('usuarios').doc(uid).get()
  const datosUsuario = usuarioSnap.data() || {}
  const ligasActuales = datosUsuario.ligasIds || []
  if (ligasActuales.length >= 5) {
    throw new HttpsError('failed-precondition', 'Solo puedes pertenecer a un máximo de 5 ligas.')
  }

  const ligaSnap = await db.collection('ligas').where('codigo_invitacion', '==', String(codigoInvitacion).trim().toUpperCase()).limit(1).get()
  if (ligaSnap.empty) throw new HttpsError('not-found', 'Código de invitación no válido.')

  const ligaDoc = ligaSnap.docs[0]
  const idLiga = ligaDoc.id
  const datosLiga = ligaDoc.data()

  if (ligasActuales.includes(idLiga)) throw new HttpsError('already-exists', 'Ya perteneces a esta liga.')

  const expulsados = datosLiga.expulsados || []
  if (expulsados.includes(email)) {
    throw new HttpsError('permission-denied', 'Has sido expulsado de esta liga y no puedes volver a unirte.')
  }

  const nombreVisible = datosUsuario.nombreVisible || datosUsuario.nombre || email

  const batch = db.batch()

  batch.create(db.collection('participaciones').doc(), {
    id_liga: idLiga,
    uid_usuario: uid,
    email_usuario: email,
    nombre_usuario: nombreVisible,
    rol: 'miembro',
    presupuesto: 50.0,
    puntos: 0,
    garaje: { coches: [], pilotos: [], potenciadores: [] },
    fecha_union: FieldValue.serverTimestamp(),
  })

  batch.update(ligaDoc.ref, { participantes: FieldValue.increment(1) })

  batch.update(db.collection('usuarios').doc(uid), {
    ligasIds: FieldValue.arrayUnion(idLiga),
  })

  batch.create(db.collection('actividad').doc(idLiga).collection('eventos').doc(), {
    idLiga,
    nombreUsuario: nombreVisible,
    tipo: 'incorporacion',
    descripcion: `se ha unido al campeonato ${datosLiga.nombre}`,
    fecha: FieldValue.serverTimestamp(),
  })

  await batch.commit()

  return { ok: true, idLiga, nombreLiga: datosLiga.nombre }
})

exports.abandonarLiga = onCall(OPCIONES, async (request) => {
  const email = exigirEmailAutenticado(request)
  const uid = request.auth.uid
  const { idLiga } = request.data || {}

  if (!idLiga) throw new HttpsError('invalid-argument', 'Falta idLiga.')

  const ligaSnap = await db.collection('ligas').doc(idLiga).get()
  if (!ligaSnap.exists) throw new HttpsError('not-found', `Liga ${idLiga} no encontrada.`)

  const participacionesSnap = await db.collection('participaciones').where('id_liga', '==', idLiga).get()
  const todasLasParticipaciones = participacionesSnap.docs.map((doc) => ({ ref: doc.ref, ...doc.data() }))

  const participacionPropia = todasLasParticipaciones.find((p) => p.email_usuario === email)
  if (!participacionPropia) throw new HttpsError('not-found', 'No perteneces a esta liga.')

  const participacionesRestantes = todasLasParticipaciones.filter((p) => p.email_usuario !== email)

  if (participacionesRestantes.length === 0) {
    const resumen = await borrarLigaEnCascada(idLiga, ligaSnap)
    return { ok: true, idLiga, ligaEliminada: true, ...resumen }
  }

  const batch = db.batch()

  if (participacionPropia.rol === 'organizador') {
    const siguienteOrganizador = [...participacionesRestantes].sort((a, b) => a.fecha_union.toMillis() - b.fecha_union.toMillis())[0]
    batch.update(siguienteOrganizador.ref, { rol: 'organizador' })
    batch.update(ligaSnap.ref, {
      correoOrganizador: siguienteOrganizador.email_usuario,
      participantes: FieldValue.increment(-1),
    })
  } else {
    batch.update(ligaSnap.ref, { participantes: FieldValue.increment(-1) })
  }

  batch.delete(participacionPropia.ref)

  batch.update(db.collection('usuarios').doc(uid), {
    ligasIds: FieldValue.arrayRemove(idLiga),
  })

  batch.create(db.collection('actividad').doc(idLiga).collection('eventos').doc(), {
    idLiga,
    nombreUsuario: participacionPropia.nombre_usuario || email,
    tipo: 'abandono',
    descripcion: `ha abandonado el campeonato ${ligaSnap.data().nombre}`,
    fecha: FieldValue.serverTimestamp(),
  })

  await agregarBorradoPujasUsuario(batch, idLiga, email)

  await batch.commit()

  return { ok: true, idLiga, ligaEliminada: false, nombreLiga: ligaSnap.data().nombre }
})
