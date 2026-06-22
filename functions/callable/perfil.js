const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { FieldValue } = require('firebase-admin/firestore')

const { db, adminAuth } = require('../middleware/firebase')
const { exigirEmailAutenticado } = require('../middleware/autenticacion')
const { agregarBorradoPujasUsuario } = require('./mercado')
const { borrarLigaEnCascada } = require('./ligas')

const OPCIONES = { region: 'europe-west1', enforceAppCheck: true }
const DIAS_BLOQUEO_CAMBIO_CORREO = 7
const MS_BLOQUEO_CAMBIO_CORREO = DIAS_BLOQUEO_CAMBIO_CORREO * 24 * 60 * 60 * 1000

// El cliente invoca esta callable ANTES de verifyBeforeUpdateEmail: dejamos
// el bloqueo de 7 días registrado para que la restricción no dependa del
// cliente, que podría haberse manipulado.

exports.autorizarCambioCorreo = onCall(OPCIONES, async (request) => {
  exigirEmailAutenticado(request)
  const uid = request.auth.uid

  const docUsuario = await db.collection('usuarios').doc(uid).get()
  if (!docUsuario.exists) throw new HttpsError('not-found', 'No existe el perfil del usuario.')

  const ultimoCambio = docUsuario.data().fechaUltimoCambioCorreo
  if (ultimoCambio) {
    const fecha = ultimoCambio.toDate ? ultimoCambio.toDate() : new Date(ultimoCambio)
    if (Date.now() - fecha.getTime() < MS_BLOQUEO_CAMBIO_CORREO) {
      throw new HttpsError('failed-precondition', `Solo puedes cambiar el correo una vez cada ${DIAS_BLOQUEO_CAMBIO_CORREO} días.`)
    }
  }

  await docUsuario.ref.update({ fechaUltimoCambioCorreo: FieldValue.serverTimestamp() })
  return { ok: true }
})

// El usuario se indexa por UID (no por email), así que no hay que copiar/borrar
// nada: solo actualizo correoAutenticacion y propago el cambio a
// participaciones y a las ligas que el usuario organice.

exports.migrarCorreo = onCall(OPCIONES, async (request) => {
  const emailToken = exigirEmailAutenticado(request)
  const uid = request.auth.uid
  const correoAnterior = String(request.data?.correoAnterior || '').trim().toLowerCase()
  const correoNuevo = String(request.data?.correoNuevo || '').trim().toLowerCase()

  if (!correoAnterior || !correoNuevo || correoAnterior === correoNuevo) {
    throw new HttpsError('invalid-argument', 'Correos inválidos.')
  }
  if (emailToken.toLowerCase() !== correoNuevo) {
    throw new HttpsError('failed-precondition', 'Debes actualizar el correo en Auth y refrescar el token antes de migrar.')
  }

  const docUsuario = await db.collection('usuarios').doc(uid).get()
  if (!docUsuario.exists) throw new HttpsError('not-found', 'No existe el perfil del usuario.')

  const [participacionesSnap, ligasAdminSnap] = await Promise.all([
    db.collection('participaciones').where('email_usuario', '==', correoAnterior).get(),
    db.collection('ligas').where('correoOrganizador', '==', correoAnterior).get(),
  ])

  const batch = db.batch()
  batch.update(db.collection('usuarios').doc(uid), { correoAutenticacion: correoNuevo })

  for (const documento of participacionesSnap.docs) batch.update(documento.ref, { email_usuario: correoNuevo })
  for (const documento of ligasAdminSnap.docs) batch.update(documento.ref, { correoOrganizador: correoNuevo })

  await batch.commit()

  return { ok: true, correoNuevo, participacionesMigradas: participacionesSnap.size, ligasMigradas: ligasAdminSnap.size }
})


async function eliminarCuentaUsuarioEnCascada(uid, email) {
  const participacionesSnap = await db.collection('participaciones').where('email_usuario', '==', email).get()
  let ligasBorradas = 0

  for (const documentoPropio of participacionesSnap.docs) {
    const datosPropios = documentoPropio.data()
    const idLiga = datosPropios.id_liga

    const ligaSnap = await db.collection('ligas').doc(idLiga).get()
    if (!ligaSnap.exists) {
      await documentoPropio.ref.delete()
      continue
    }
    const datosLiga = ligaSnap.data()

    const restantesSnap = await db.collection('participaciones').where('id_liga', '==', idLiga).get()
    const restantes = restantesSnap.docs.filter((d) => d.id !== documentoPropio.id).map((d) => ({ id: d.id, ...d.data() }))

    if (restantes.length === 0) {
      await documentoPropio.ref.delete()
      await borrarLigaEnCascada(idLiga, ligaSnap)
      ligasBorradas += 1
      continue
    }

    const batchPujas = db.batch()
    await agregarBorradoPujasUsuario(batchPujas, idLiga, email)
    await batchPujas.commit()

    if (datosPropios.esOrganizador) {
      const siguiente = [...restantes].sort((a, b) => {
        const fechaA = a.fecha_union?.toMillis ? a.fecha_union.toMillis() : 0
        const fechaB = b.fecha_union?.toMillis ? b.fecha_union.toMillis() : 0
        return fechaA - fechaB
      })[0]
      await db.collection('participaciones').doc(siguiente.id).update({ esOrganizador: true })
      await db.collection('ligas').doc(idLiga).update({
        correoOrganizador: siguiente.email_usuario,
        participantes: (datosLiga.participantes || restantes.length + 1) - 1,
      })
    } else {
      await db.collection('ligas').doc(idLiga).update({ participantes: (datosLiga.participantes || restantes.length + 1) - 1 })
    }

    await documentoPropio.ref.delete()
  }

  await db.collection('usuarios').doc(uid).delete()

  try {
    await adminAuth.revokeRefreshTokens(uid)
    await adminAuth.deleteUser(uid)
  } catch (error) {
    throw new HttpsError('internal', `Perfil borrado pero el usuario de Auth no pudo eliminarse: ${error.message}`)
  }

  return { participacionesBorradas: participacionesSnap.size, ligasBorradas }
}

exports.eliminarCuentaUsuarioEnCascada = eliminarCuentaUsuarioEnCascada


exports.eliminarMiCuenta = onCall(OPCIONES, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
  const uid = request.auth.uid
  const email = request.auth.token.email || ''
  const resultado = await eliminarCuentaUsuarioEnCascada(uid, email)
  return { ok: true, email, ...resultado }
})


exports.crearPerfil = onCall(OPCIONES, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
  const uid = request.auth.uid
  const correo = request.auth.token.email || ''
  const nombreUsuario = String(request.data?.nombreUsuario || '').trim()

  if (!nombreUsuario) throw new HttpsError('invalid-argument', 'El nombre de usuario es obligatorio.')

  const docRef = db.collection('usuarios').doc(uid)
  const existente = await docRef.get()
  if (existente.exists) throw new HttpsError('already-exists', 'El perfil ya existe.')

  await docRef.set({
    correoAutenticacion: correo,
    nombreVisible: nombreUsuario,
    ligasIds: [],
    fechaRegistro: FieldValue.serverTimestamp(),
  })

  return { ok: true }
})
