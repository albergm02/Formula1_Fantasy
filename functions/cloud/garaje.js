const { onCall, HttpsError } = require('firebase-functions/v2/https')

const { db } = require('../comun/firebase')
const { OPCIONES } = require('../comun/constantes')
const { exigirEmailAutenticado } = require('../comun/autenticacion')
const { exigirJornadaProcesada } = require('../comun/jornada')

const PORCENTAJE_REVENTA = 0.9
const MAX_COCHES_ALINEADOS = 1
const MAX_PILOTOS_ALINEADOS = 2

async function cargarParticipacionPropia(idParticipante, emailInvocador) {
  if (!idParticipante) {
    throw new HttpsError('invalid-argument', 'Falta idParticipante.')
  }
  const referencia = db.collection('participaciones').doc(idParticipante)
  const instantanea = await referencia.get()
  if (!instantanea.exists) {
    throw new HttpsError('not-found', 'Participación no encontrada.')
  }
  const datos = instantanea.data()
  if (datos.email_usuario !== emailInvocador) {
    throw new HttpsError('permission-denied', 'Solo puedes operar sobre tu propio equipo.')
  }
  return { referencia, datos }
}

function localizarCartaEnGaraje(garaje, instanciaId) {
  for (const coleccion of ['coches', 'pilotos', 'potenciadores']) {
    const lista = garaje[coleccion] || []
    const indice = lista.findIndex((carta) => carta.instancia_id === instanciaId)
    if (indice !== -1) {
      return { coleccion, indice, carta: lista[indice] }
    }
  }
  return null
}

function calcularValorReventa(precio) {
  return Math.round(Number(precio || 0) * PORCENTAJE_REVENTA * 100) / 100
}

exports.venderCartaParticipante = onCall(OPCIONES, async (request) => {
  const email = exigirEmailAutenticado(request)
  const { idParticipante, instanciaId } = request.data || {}
  if (instanciaId === undefined) {
    throw new HttpsError('invalid-argument', 'Falta instanciaId.')
  }

  const { referencia, datos } = await cargarParticipacionPropia(idParticipante, email)
  const garaje = datos.garaje || {}
  const localizada = localizarCartaEnGaraje(garaje, instanciaId)
  if (!localizada) {
    throw new HttpsError('not-found', 'La carta no está en tu garaje.')
  }

  const { coleccion, indice, carta } = localizada
  if (carta.equipado) await exigirJornadaProcesada()

  const valorReventa = calcularValorReventa(carta.precio)
  const listaActualizada = [...garaje[coleccion]]
  listaActualizada.splice(indice, 1)

  await referencia.update({
    garaje: { ...garaje, [coleccion]: listaActualizada },
    presupuesto: Number((datos.presupuesto || 0) + valorReventa),
  })

  return { ok: true, nombre: carta.nombre, valorReventa }
})

// Reglas: 1 chasis máx, 2 pilotos titulares, potenciador exige ≥1 piloto.
// Al equipar un chasis con otro ya equipado, desalineo el anterior para que
// el cambio sea atómico desde el punto de vista del usuario.
function aplicarCambioAlineacion(garaje, coleccion, indiceObjetivo) {
  const lista = [...(garaje[coleccion] || [])]
  const cartaObjetivo = { ...lista[indiceObjetivo] }
  const pasaAEquipado = !cartaObjetivo.equipado

  if (pasaAEquipado && coleccion === 'coches') {
    const yaAlineados = lista.filter((c) => c.equipado).length
    if (yaAlineados >= MAX_COCHES_ALINEADOS) {
      for (let i = 0; i < lista.length; i++) {
        lista[i] = { ...lista[i], equipado: false }
      }
    }
  }

  if (pasaAEquipado && coleccion === 'pilotos') {
    const yaAlineados = lista.filter((c) => c.equipado).length
    if (yaAlineados >= MAX_PILOTOS_ALINEADOS) {
      throw new HttpsError(
        'failed-precondition',
        'Ya tienes dos pilotos titulares. Desalinea uno antes de añadir otro.',
      )
    }
  }

  if (pasaAEquipado && coleccion === 'potenciadores') {
    const pilotosFichados = (garaje.pilotos || []).length
    if (pilotosFichados === 0) {
      throw new HttpsError(
        'failed-precondition',
        'Necesitas al menos un piloto fichado para instalar un potenciador.',
      )
    }
  }

  cartaObjetivo.equipado = pasaAEquipado
  lista[indiceObjetivo] = cartaObjetivo
  return { ...garaje, [coleccion]: lista }
}

exports.alternarCartaEquipada = onCall(OPCIONES, async (request) => {
  const email = exigirEmailAutenticado(request)
  await exigirJornadaProcesada()
  const { idParticipante, instanciaId } = request.data || {}
  if (instanciaId === undefined) {
    throw new HttpsError('invalid-argument', 'Falta instanciaId.')
  }

  const { referencia, datos } = await cargarParticipacionPropia(idParticipante, email)
  const garaje = datos.garaje || {}
  const localizada = localizarCartaEnGaraje(garaje, instanciaId)
  if (!localizada) {
    throw new HttpsError('not-found', 'La carta no está en tu garaje.')
  }

  const garajeActualizado = aplicarCambioAlineacion(garaje, localizada.coleccion, localizada.indice)
  await referencia.update({ garaje: garajeActualizado })

  const cartaResultante = garajeActualizado[localizada.coleccion][localizada.indice]
  return { ok: true, equipado: cartaResultante.equipado, nombre: cartaResultante.nombre }
})

// Cada €1 invertido sube la cláusula en €2 (precio efectivo = precioCompra
// + 2 × clausulaInvertida). Bloqueado durante la jornada activa.
exports.invertirEnClausulaCarta = onCall(OPCIONES, async (request) => {
  const email = exigirEmailAutenticado(request)
  await exigirJornadaProcesada()
  const { idParticipante, instanciaId, cantidad } = request.data || {}
  if (instanciaId === undefined) {
    throw new HttpsError('invalid-argument', 'Falta instanciaId.')
  }
  const cantidadNumerica = Number(cantidad)
  if (!Number.isFinite(cantidadNumerica) || cantidadNumerica <= 0) {
    throw new HttpsError('invalid-argument', 'La cantidad a invertir debe ser positiva.')
  }

  const { referencia, datos } = await cargarParticipacionPropia(idParticipante, email)
  const garaje = datos.garaje || {}
  const localizada = localizarCartaEnGaraje(garaje, instanciaId)
  if (!localizada) {
    throw new HttpsError('not-found', 'La carta no está en tu garaje.')
  }
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
