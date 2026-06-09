/**
 * Gestión de perfil del usuario en servidor: cambio de correo y baja de cuenta.
 *
 * Estas operaciones son sensibles (afectan a credenciales y a datos en
 * cascada de varias colecciones) y deben validarse fuera del cliente:
 *  - El cambio de correo exige reautenticación reciente y respeta un
 *    bloqueo de 7 días entre cambios consecutivos.
 *  - La baja de cuenta borra participaciones, pujas, perfil y usuario de
 *    Auth en una sola operación.
 *
 * Si hubiera puesto esta lógica en cliente, un usuario con la app modificada
 * podría saltarse el bloqueo de correo o dejar datos huérfanos al borrarse.
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { FieldValue } = require('firebase-admin/firestore')

const { db, adminAuth } = require('../comun/firebase')
const { OPCIONES, DIAS_BLOQUEO_CAMBIO_CORREO } = require('../comun/constantes')
const {
  exigirAdministrador,
  exigirEmailAutenticado,
  exigirReautenticacionReciente,
} = require('../comun/autenticacion')

/* ─── Cambio de correo ──────────────────────────────────────────────────── */

/**
 * Comprueba si ya transcurrió el periodo de bloqueo entre cambios de correo.
 * Acepta `Timestamp` de Firestore o cualquier valor que `Date` admita.
 */
function haExpiradoElBloqueoDeCorreo(marcaTemporal) {
  const fecha = marcaTemporal.toDate ? marcaTemporal.toDate() : new Date(marcaTemporal)
  const milisegundosBloqueo = DIAS_BLOQUEO_CAMBIO_CORREO * 24 * 60 * 60 * 1000
  return Date.now() - fecha.getTime() >= milisegundosBloqueo
}

/**
 * Callable — autoriza el inicio de un cambio de correo.
 *
 * El cliente debe invocarla ANTES de `verifyBeforeUpdateEmail`. Aquí valido la
 * reautenticación reciente y el bloqueo de 7 días, y dejo registrada la
 * marca temporal del cambio. Así la restricción no depende del cliente, que
 * podría haberse manipulado.
 */
exports.autorizarCambioCorreo = onCall(OPCIONES, async (request) => {
  exigirEmailAutenticado(request)
  exigirReautenticacionReciente(request)
  const uid = request.auth.uid

  const docUsuario = await db.collection('usuarios').doc(uid).get()
  if (!docUsuario.exists) {
    throw new HttpsError('not-found', 'No existe el perfil del usuario.')
  }

  const ultimoCambio = docUsuario.data().fechaUltimoCambioCorreo
  if (ultimoCambio && !haExpiradoElBloqueoDeCorreo(ultimoCambio)) {
    throw new HttpsError(
      'failed-precondition',
      `Solo puedes cambiar el correo una vez cada ${DIAS_BLOQUEO_CAMBIO_CORREO} días.`,
    )
  }

  await docUsuario.ref.update({ fechaUltimoCambioCorreo: FieldValue.serverTimestamp() })
  return { ok: true }
})

/**
 * Callable — migra los documentos de Firestore tras un cambio de correo en Auth.
 *
 * Al estar el documento de usuario indexado por UID (no por email), no hace
 * falta copiar ni borrar nada: actualizo el campo `correoAutenticacion` y
 * propago el cambio a participaciones (clave `email_usuario`) y a las ligas
 * que el usuario organice (`correoOrganizador`).
 *
 * Exijo que el token ya refleje el correo nuevo (`verifyBeforeUpdateEmail`
 * + login con el correo confirmado) para evitar dejar el sistema en un
 * estado inconsistente.
 */
exports.migrarCorreoUsuario = onCall(OPCIONES, async (request) => {
  const emailToken = exigirEmailAutenticado(request)
  exigirReautenticacionReciente(request)
  const uid = request.auth.uid
  const correoAnterior = String(request.data?.correoAnterior || '')
    .trim()
    .toLowerCase()
  const correoNuevo = String(request.data?.correoNuevo || '')
    .trim()
    .toLowerCase()

  if (!correoAnterior || !correoNuevo || correoAnterior === correoNuevo) {
    throw new HttpsError('invalid-argument', 'Correos inválidos.')
  }
  if (emailToken.toLowerCase() !== correoNuevo) {
    throw new HttpsError(
      'failed-precondition',
      'Debes actualizar el correo en Auth y refrescar el token antes de migrar.',
    )
  }

  const docUsuario = await db.collection('usuarios').doc(uid).get()
  if (!docUsuario.exists) {
    throw new HttpsError('not-found', 'No existe el perfil del usuario.')
  }

  const [participacionesSnap, ligasAdminSnap] = await Promise.all([
    db.collection('participaciones').where('email_usuario', '==', correoAnterior).get(),
    db.collection('ligas').where('correoOrganizador', '==', correoAnterior).get(),
  ])

  const batch = db.batch()
  batch.update(db.collection('usuarios').doc(uid), { correoAutenticacion: correoNuevo })

  for (const documento of participacionesSnap.docs) {
    batch.update(documento.ref, { email_usuario: correoNuevo })
  }
  for (const documento of ligasAdminSnap.docs) {
    batch.update(documento.ref, { correoOrganizador: correoNuevo })
  }

  await batch.commit()

  return {
    ok: true,
    correoNuevo,
    participacionesMigradas: participacionesSnap.size,
    ligasMigradas: ligasAdminSnap.size,
  }
})

/* ─── Baja de cuenta ────────────────────────────────────────────────────── */

/**
 * Cede el rol de organizador al siguiente participante por fecha de unión.
 * Lo uso cuando el organizador se da de baja pero la liga sigue viva.
 */
function elegirSiguienteAdministrador(participacionesRestantes) {
  if (participacionesRestantes.length === 0) return null
  const ordenadas = [...participacionesRestantes].sort((a, b) => {
    const fechaA = a.fecha_union?.toMillis ? a.fecha_union.toMillis() : 0
    const fechaB = b.fecha_union?.toMillis ? b.fecha_union.toMillis() : 0
    return fechaA - fechaB
  })
  return ordenadas[0]
}

/**
 * Borra una liga huérfana: mercados (con pujas), actividad y la propia liga.
 *
 * Distinto de `borrarLigaEnCascada` (en `cloud/ligas.js`): aquí asumo que la
 * participación del usuario ya está borrada y el contador `participantes` no
 * importa porque la liga entera va a desaparecer. Lo invoco solo cuando se
 * elimina al último miembro.
 */
async function borrarLigaCompleta(idLiga) {
  const mercadosSnap = await db.collection('mercados').where('idLiga', '==', idLiga).get()
  for (const docMercado of mercadosSnap.docs) {
    const pujasSnap = await docMercado.ref.collection('pujas').get()
    const batchPujas = db.batch()
    for (const pujaDoc of pujasSnap.docs) batchPujas.delete(pujaDoc.ref)
    await batchPujas.commit()
    await docMercado.ref.delete()
  }

  const actividadSnap = await db.collection('actividad').where('idLiga', '==', idLiga).get()
  const batchActividad = db.batch()
  for (const documento of actividadSnap.docs) batchActividad.delete(documento.ref)
  await batchActividad.commit()

  await db.collection('ligas').doc(idLiga).delete()
}

/**
 * Borra en cascada todos los datos de un usuario.
 *
 * Distingo tres casos por liga:
 *  1. El usuario era el único participante → borro la liga entera.
 *  2. Era organizador con más miembros → cedo el rol al siguiente.
 *  3. Era participante normal → solo decremento el contador.
 *
 * Después limpio sus pujas activas en mercados abiertos, borro el documento
 * `usuarios/{uid}` y, por último, lo elimino de Firebase Auth con
 * `deleteUser`. Revoco también sus tokens activos para invalidar cualquier
 * sesión que tuviera abierta en otros dispositivos.
 *
 * @param {string} uid - UID de Firebase Auth (clave del documento).
 * @param {string} email - Correo del usuario (para localizar participaciones y pujas).
 */
async function eliminarCuentaUsuarioEnCascada(uid, email) {
  const participacionesSnap = await db
    .collection('participaciones')
    .where('email_usuario', '==', email)
    .get()

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

    const restantesSnap = await db
      .collection('participaciones')
      .where('id_liga', '==', idLiga)
      .get()
    const restantes = restantesSnap.docs
      .filter((d) => d.id !== documentoPropio.id)
      .map((d) => ({ id: d.id, ...d.data() }))

    if (restantes.length === 0) {
      await documentoPropio.ref.delete()
      await borrarLigaCompleta(idLiga)
      ligasBorradas += 1
      continue
    }

    if (datosPropios.rol === 'organizador') {
      const siguiente = elegirSiguienteAdministrador(restantes)
      await db.collection('participaciones').doc(siguiente.id).update({ rol: 'organizador' })
      await db
        .collection('ligas')
        .doc(idLiga)
        .update({
          correoOrganizador: siguiente.email_usuario,
          participantes: (datosLiga.participantes || restantes.length + 1) - 1,
        })
    } else {
      await db
        .collection('ligas')
        .doc(idLiga)
        .update({
          participantes: (datosLiga.participantes || restantes.length + 1) - 1,
        })
    }

    await documentoPropio.ref.delete()
  }

  const mercadosAbiertosSnap = await db
    .collection('mercados')
    .where('estado', '==', 'abierto')
    .get()
  for (const docMercado of mercadosAbiertosSnap.docs) {
    const pujasSnap = await docMercado.ref
      .collection('pujas')
      .where('emailUsuario', '==', email)
      .get()
    const batchPujas = db.batch()
    for (const pujaDoc of pujasSnap.docs) batchPujas.delete(pujaDoc.ref)
    if (!pujasSnap.empty) await batchPujas.commit()
  }

  await db.collection('usuarios').doc(uid).delete()

  try {
    await adminAuth.revokeRefreshTokens(uid)
    await adminAuth.deleteUser(uid)
  } catch (error) {
    throw new HttpsError(
      'internal',
      `Perfil borrado pero el usuario de Auth no pudo eliminarse: ${error.message}`,
    )
  }

  return { participacionesBorradas: participacionesSnap.size, ligasBorradas }
}

/**
 * Callable — el propio usuario elimina su cuenta.
 *
 * Exijo reautenticación reciente: una sesión vieja robada no debería poder
 * dejar al usuario sin cuenta. El cliente debe pedirle la contraseña justo
 * antes de invocar esta callable.
 */
exports.eliminarMiCuenta = onCall(OPCIONES, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
  exigirReautenticacionReciente(request)
  const uid = request.auth.uid
  const email = request.auth.token.email || ''
  const resultado = await eliminarCuentaUsuarioEnCascada(uid, email)
  return { ok: true, email, ...resultado }
})

/**
 * Callable — el administrador global elimina la cuenta de cualquier usuario.
 *
 * Acepta `{ uid }`. Bloqueo expresamente la eliminación de otros
 * administradores desde el panel para evitar "tiroteos" entre admins.
 */
exports.eliminarUsuarioManual = onCall(OPCIONES, async (request) => {
  await exigirAdministrador(request)
  const { uid } = request.data || {}
  if (!uid) {
    throw new HttpsError('invalid-argument', 'Falta uid.')
  }

  const usuarioSnap = await db.collection('usuarios').doc(uid).get()
  if (!usuarioSnap.exists) {
    throw new HttpsError('not-found', `Usuario ${uid} no encontrado.`)
  }
  if (usuarioSnap.data().esAdministrador === true) {
    throw new HttpsError(
      'failed-precondition',
      'No se puede eliminar a otro administrador desde el panel.',
    )
  }

  const email = usuarioSnap.data().correoAutenticacion || ''
  const resultado = await eliminarCuentaUsuarioEnCascada(uid, email)
  return { ok: true, uid, email, ...resultado }
})
