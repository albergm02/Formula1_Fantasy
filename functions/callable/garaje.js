/**
 * @module functions/callable/Garaje
 * @description Funciones callable para manejar las operaciones relacionadas con el garaje del usuario, incluyendo la venta de cartas, la gestión de alineación y la ejecución de cláusulas.
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { FieldValue } = require('firebase-admin/firestore')

const { db } = require('../middleware/firebase')
const { exigirEmailAutenticado } = require('../middleware/autenticacion')
const { exigirJornadaProcesada } = require('../middleware/jornada')
const { cargarMercadoAbiertoDeLiga } = require('./mercado')

const OPCIONES = { region: 'europe-west1', enforceAppCheck: true }
const HORAS_PERIODO_GRACIA = 48

const PORCENTAJE_REVENTA = 0.9
const MAX_COCHES_ALINEADOS = 1
const MAX_PILOTOS_ALINEADOS = 2

/**
 * Carga la participación propia de un usuario.
 * @param {string} idParticipante - ID de la participación.
 * @param {string} emailInvocador - Email del usuario que invoca la función.
 * @returns {Promise<Object>} - Referencia e información de la participación.
 */
async function cargarParticipacionPropia(idParticipante, emailInvocador) {
  if (!idParticipante) throw new HttpsError('invalid-argument', 'Falta idParticipante.')
  const referencia = db.collection('participaciones').doc(idParticipante)
  const instantanea = await referencia.get()
  if (!instantanea.exists) throw new HttpsError('not-found', 'Participación no encontrada.')
  const datos = instantanea.data()
  if (datos.email_usuario !== emailInvocador) {
    throw new HttpsError('permission-denied', 'Solo puedes operar sobre tu propio equipo.')
  }
  return { referencia, datos }
}


/**
 * Localiza una carta en el garaje de un usuario.
 * @param {Object} garaje - Garaje del usuario.
 * @param {string} instanciaId - ID de la instancia de la carta.
 * @returns {Object|null} - Información de la carta localizada o null si no se encuentra.
 */
function localizarCartaEnGaraje(garaje, instanciaId) {
  for (const coleccion of ['coches', 'pilotos', 'potenciadores']) {
    const lista = garaje[coleccion] || []
    const indice = lista.findIndex((carta) => carta.instancia_id === instanciaId)
    if (indice !== -1) return { coleccion, indice, carta: lista[indice] }
  }
  return null
}

/**
 * Vende una carta del garaje del usuario mediante una Cloud Function (Callable).
 * Reembolsa el porcentaje configurado del precio de la carta al presupuesto.
 *
 * @function venderCarta
 * @param {Object} request - Objeto de solicitud proporcionado por Firebase.
 * @param {Object} request.data - Carga útil (payload) enviada desde el cliente Frontend.
 * @param {string} request.data.idParticipante - El identificador único de la participación del usuario.
 * @param {string} request.data.instanciaId - El identificador único de la instancia de la carta a vender.
 * @returns {Promise<Object>} Resultado de la operación con el nombre de la carta y el valor de reventa.
 */
exports.venderCarta = onCall(OPCIONES, async (request) => {
  const email = exigirEmailAutenticado(request)
  const { idParticipante, instanciaId } = request.data || {}
  if (instanciaId === undefined) throw new HttpsError('invalid-argument', 'Falta instanciaId.')

  const { referencia, datos } = await cargarParticipacionPropia(idParticipante, email)
  const garaje = datos.garaje || {}
  const localizada = localizarCartaEnGaraje(garaje, instanciaId)
  if (!localizada) throw new HttpsError('not-found', 'La carta no está en tu garaje.')

  const { coleccion, indice, carta } = localizada
  if (carta.equipado) await exigirJornadaProcesada()

  const valorReventa = Math.round(Number(carta.precio || 0) * PORCENTAJE_REVENTA * 100) / 100
  const listaActualizada = [...garaje[coleccion]]
  listaActualizada.splice(indice, 1)

  const tipoElemento = carta.tipo || carta.tipoCarta

  const batch = db.batch()
  batch.update(referencia, {
    garaje: { ...garaje, [coleccion]: listaActualizada },
    presupuesto: Number((datos.presupuesto || 0) + valorReventa),
  })
  batch.create(db.collection('actividad').doc(datos.id_liga).collection('eventos').doc(), {
    idLiga: datos.id_liga,
    nombreUsuario: datos.nombre_usuario || email,
    tipo: 'venta',
    descripcion: `ha liberado ${tipoElemento} ${carta.nombre}`,
    fecha: FieldValue.serverTimestamp(),
  })
  await batch.commit()

  return { ok: true, nombre: carta.nombre, valorReventa }
})

/**
 * Aplica un cambio de alineación a una carta en el garaje de un usuario.
 * @param {Object} garaje - Garaje del usuario.
 * @param {string} coleccion - Colección a la que pertenece la carta.
 * @param {number} indiceObjetivo - Índice de la carta en la colección.
 * @returns {Object} - Garaje actualizado.
 */
function aplicarCambioAlineacion(garaje, coleccion, indiceObjetivo) {
  const lista = [...(garaje[coleccion] || [])]
  const cartaObjetivo = { ...lista[indiceObjetivo] }
  const pasaAEquipado = !cartaObjetivo.equipado

  if (pasaAEquipado && coleccion === 'coches') {
    const yaAlineados = lista.filter((c) => c.equipado).length
    if (yaAlineados >= MAX_COCHES_ALINEADOS) {
      for (let i = 0; i < lista.length; i++) lista[i] = { ...lista[i], equipado: false }
    }
  }

  if (pasaAEquipado && coleccion === 'pilotos') {
    const yaAlineados = lista.filter((c) => c.equipado).length
    if (yaAlineados >= MAX_PILOTOS_ALINEADOS) {
      throw new HttpsError('failed-precondition', 'Ya tienes dos pilotos titulares. Desalinea uno antes de añadir otro.')
    }
  }

  if (pasaAEquipado && coleccion === 'potenciadores') {
    const pilotosFichados = (garaje.pilotos || []).length
    if (pilotosFichados === 0) {
      throw new HttpsError('failed-precondition', 'Necesitas al menos un piloto fichado para instalar un potenciador.')
    }
  }

  cartaObjetivo.equipado = pasaAEquipado
  lista[indiceObjetivo] = cartaObjetivo
  return { ...garaje, [coleccion]: lista }
}

/**
 * Alterna la alineación de una carta en el garaje del usuario mediante una Cloud Function (Callable).
 * Equipa o desequipa la carta según su estado actual, respetando los límites por tipo.
 *
 * @function alternarAlineacion
 * @param {Object} request - Objeto de solicitud proporcionado por Firebase.
 * @param {Object} request.data - Carga útil (payload) enviada desde el cliente Frontend.
 * @param {string} request.data.idParticipante - El identificador único de la participación del usuario.
 * @param {string} request.data.instanciaId - El identificador único de la instancia de la carta a alinear/desalinear.
 * @returns {Promise<Object>} Resultado de la operación con el nombre de la carta y su nuevo estado de alineación.
 */
exports.alternarAlineacion = onCall(OPCIONES, async (request) => {
  const email = exigirEmailAutenticado(request)
  await exigirJornadaProcesada()
  const { idParticipante, instanciaId } = request.data || {}
  if (instanciaId === undefined) throw new HttpsError('invalid-argument', 'Falta instanciaId.')

  const { referencia, datos } = await cargarParticipacionPropia(idParticipante, email)
  const garaje = datos.garaje || {}
  const localizada = localizarCartaEnGaraje(garaje, instanciaId)
  if (!localizada) throw new HttpsError('not-found', 'La carta no está en tu garaje.')

  const garajeActualizado = aplicarCambioAlineacion(garaje, localizada.coleccion, localizada.indice)
  await referencia.update({ garaje: garajeActualizado })

  const cartaResultante = garajeActualizado[localizada.coleccion][localizada.indice]
  return { ok: true, equipado: cartaResultante.equipado, nombre: cartaResultante.nombre }
})

/**
 * Gestiona la cláusula de una carta en el garaje del usuario mediante una Cloud Function (Callable).
 * Invierte una cantidad del presupuesto en la cláusula de la carta.
 *
 * @function gestionarClausula
 * @param {Object} request - Objeto de solicitud proporcionado por Firebase.
 * @param {Object} request.data - Carga útil (payload) enviada desde el cliente Frontend.
 * @param {string} request.data.idParticipante - El identificador único de la participación del usuario.
 * @param {string} request.data.instanciaId - El identificador único de la instancia de la carta.
 * @param {number} request.data.cantidad - Cantidad a invertir en la cláusula, debe ser positiva.
 * @returns {Promise<Object>} Resultado de la operación con el total invertido en la cláusula.
 */ 
exports.gestionarClausula = onCall(OPCIONES, async (request) => {
  const email = exigirEmailAutenticado(request)
  await exigirJornadaProcesada()
  const { idParticipante, instanciaId, cantidad } = request.data || {}
  if (instanciaId === undefined) throw new HttpsError('invalid-argument', 'Falta instanciaId.')
  const cantidadNumerica = Number(cantidad)
  if (!Number.isFinite(cantidadNumerica) || cantidadNumerica <= 0) {
    throw new HttpsError('invalid-argument', 'La cantidad a invertir debe ser positiva.')
  }

  const { referencia, datos } = await cargarParticipacionPropia(idParticipante, email)
  const garaje = datos.garaje || {}
  const localizada = localizarCartaEnGaraje(garaje, instanciaId)
  if (!localizada) throw new HttpsError('not-found', 'La carta no está en tu garaje.')
  const { coleccion, indice, carta } = localizada
  const tipoCarta = carta.tipo || carta.tipoCarta
  if (tipoCarta === 'potenciador') {
    throw new HttpsError('failed-precondition', 'Los potenciadores no admiten cláusula.')
  }

  const presupuestoActual = Number(datos.presupuesto || 0)
  if (cantidadNumerica > presupuestoActual) {
    throw new HttpsError('failed-precondition', 'Presupuesto insuficiente para esta inversión.')
  }

  const lista = [...garaje[coleccion]]
  lista[indice] = {
    ...carta,
    clausulaInvertida: Number(carta.clausulaInvertida || 0) + cantidadNumerica,
  }

  await referencia.update({
    garaje: { ...garaje, [coleccion]: lista },
    presupuesto: presupuestoActual - cantidadNumerica,
  })

  return { ok: true, clausulaInvertida: lista[indice].clausulaInvertida }
})

/**
 * Calcula el precio de la cláusula de una carta.
 * @param {Object} carta - Carta para la que se calcula el precio.
 * @returns {number} - Precio de la cláusula.
 */
function calcularPrecioClausula(carta) {
  const precioBase = carta.precioCompra ?? carta.precio
  const inversionDueño = carta.clausulaInvertida || 0
  return precioBase + inversionDueño * 2
}

/**
 * Extrae una carta del garaje por su instancia.
 * @param {Object} garaje - Garaje del usuario.
 * @param {string} instanciaId - ID de la instancia de la carta.
 * @returns {Object} - Carta extraída o null si no se encuentra.
 */
function extraerCartaPorInstancia(garaje, instanciaId) {
  for (const coleccion of ['coches', 'pilotos', 'potenciadores']) {
    const lista = garaje[coleccion] || []
    const indice = lista.findIndex((carta) => carta.instancia_id === instanciaId)
    if (indice !== -1) {
      const carta = lista.splice(indice, 1)[0]
      garaje[coleccion] = lista
      return { carta }
    }
  }
  return { carta: null }
}

/**
 * Calcula el monto comprometido en pujas de un usuario en una liga.
 * @param {string} idLiga - ID de la liga.
 * @param {string} email - Email del usuario.
 * @returns {Promise<number>} - Monto comprometido en pujas.
 */
async function calcularComprometidoEnPujas(idLiga, email) {
  const mercadoDoc = await cargarMercadoAbiertoDeLiga(idLiga)
  if (!mercadoDoc) return 0
  const pujasSnap = await db.collection('mercados').doc(mercadoDoc.id).collection('pujas').where('emailUsuario', '==', email).get()
  return pujasSnap.docs.reduce((suma, documento) => suma + (documento.data().cantidad || 0), 0)
}

/**
 * Ejecuta la cláusula de una carta en el garaje de un rival mediante una Cloud Function (Callable).
 * Transfiere la carta del rival al equipo propio pagando el precio de cláusula correspondiente.
 *
 * @function ejecutarClausula
 * @param {Object} request - Objeto de solicitud proporcionado por Firebase.
 * @param {Object} request.data - Carga útil (payload) enviada desde el cliente Frontend.
 * @param {string} request.data.idParticipanteRival - El identificador único de la participación del rival.
 * @param {string} request.data.idParticipantePropio - El identificador único de la participación propia.
 * @param {string} request.data.instanciaId - El identificador único de la instancia de la carta a fichar.
 * @returns {Promise<Object>} Resultado de la operación con el nombre de la carta fichada y el precio de cláusula pagado.
 */
exports.ejecutarClausula = onCall(OPCIONES, async (request) => {
  const emailAtacante = exigirEmailAutenticado(request)
  await exigirJornadaProcesada()
  const { idParticipanteRival, idParticipantePropio, instanciaId } = request.data || {}
  if (!idParticipanteRival || !idParticipantePropio || instanciaId === undefined) {
    throw new HttpsError('invalid-argument', 'Faltan datos de la cláusula.')
  }
  if (idParticipanteRival === idParticipantePropio) {
    throw new HttpsError('failed-precondition', 'No puedes fichar una carta de tu propio equipo.')
  }

  const refRival = db.collection('participaciones').doc(idParticipanteRival)
  const refPropio = db.collection('participaciones').doc(idParticipantePropio)
  const [snapRival, snapPropio] = await Promise.all([refRival.get(), refPropio.get()])
  if (!snapRival.exists || !snapPropio.exists) {
    throw new HttpsError('not-found', 'Participación no encontrada.')
  }

  const datosRival = snapRival.data()
  const datosPropio = snapPropio.data()
  if (datosPropio.email_usuario !== emailAtacante) {
    throw new HttpsError('permission-denied', 'Solo puedes fichar para tu propio equipo.')
  }
  if (datosRival.id_liga !== datosPropio.id_liga) {
    throw new HttpsError('failed-precondition', 'Ambos equipos deben competir en la misma liga.')
  }

  const garajeRival = datosRival.garaje || {}
  const { carta } = extraerCartaPorInstancia(garajeRival, instanciaId)
  if (!carta) throw new HttpsError('not-found', 'La carta ya no está en el equipo rival.')

  const tipoCarta = carta.tipo || carta.tipoCarta
  if (tipoCarta === 'potenciador') {
    throw new HttpsError('failed-precondition', 'Los potenciadores no admiten cláusula.')
  }
  
  if (carta.fechaAdquisicion) {
    const msTranscurridos = Date.now() - new Date(carta.fechaAdquisicion).getTime()
    if (msTranscurridos < HORAS_PERIODO_GRACIA * 60 * 60 * 1000) {
      throw new HttpsError('failed-precondition', 'La carta está protegida por periodo de gracia.')
    }
  }

  const precioClausula = calcularPrecioClausula(carta)
  const comprometidoEnPujas = await calcularComprometidoEnPujas(datosPropio.id_liga, emailAtacante)
  if (precioClausula + comprometidoEnPujas > datosPropio.presupuesto) {
    throw new HttpsError('failed-precondition', 'No tienes presupuesto suficiente.')
  }

  const garajePropio = datosPropio.garaje || {}
  const cartaNueva = { ...carta, precioCompra: precioClausula, clausulaInvertida: 0, fechaAdquisicion: new Date().toISOString(), equipado: false }
  const tipoDestino = cartaNueva.tipo || cartaNueva.tipoCarta
  const coleccionDestino = tipoDestino === 'coche' ? 'coches' : tipoDestino === 'piloto' ? 'pilotos' : 'potenciadores'
  if (!garajePropio[coleccionDestino]) garajePropio[coleccionDestino] = []
  garajePropio[coleccionDestino].push(cartaNueva)

  const batch = db.batch()
  batch.update(refRival, {
    garaje: garajeRival,
    presupuesto: datosRival.presupuesto + precioClausula,
  })
  batch.update(refPropio, {
    garaje: garajePropio,
    presupuesto: datosPropio.presupuesto - precioClausula,
  })
  batch.create(db.collection('actividad').doc(datosPropio.id_liga).collection('eventos').doc(), {
    idLiga: datosPropio.id_liga,
    nombreUsuario: datosPropio.nombre_usuario || emailAtacante,
    tipo: 'clausula',
    descripcion: `ha activado la cláusula de ${tipoCarta} ${carta.nombre} por ${precioClausula.toFixed(1)}M`,
    fecha: FieldValue.serverTimestamp(),
  })
  await batch.commit()

  return { ok: true, nombre: carta.nombre, precioClausula }
})
