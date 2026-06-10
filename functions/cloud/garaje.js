/**
 * Operaciones del garaje del jugador en servidor.
 *
 * El cliente solo expresa la intención (vender una carta, alinearla, invertir
 * en su cláusula); aquí valido propiedad, presupuesto, restricciones de
 * alineación y bloqueo de jornada antes de mutar Firestore. Sin estas
 * callables, un usuario podría manipular su garaje desde la consola del
 * navegador y vender cartas alineadas, falsificar el presupuesto o
 * cambiar la alineación con un GP en juego.
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https')

const { db } = require('../comun/firebase')
const { OPCIONES } = require('../comun/constantes')
const { exigirEmailAutenticado } = require('../comun/autenticacion')
const { exigirJornadaProcesada } = require('../comun/jornada')

/* Porcentaje del precio actual que el jugador recupera al vender una carta. */
const PORCENTAJE_REVENTA = 0.9

/* Restricciones de alineación: solo se admite 1 chasis y 2 pilotos titulares. */
const MAX_COCHES_ALINEADOS = 1
const MAX_PILOTOS_ALINEADOS = 2

/* ─── Helpers comunes ───────────────────────────────────────────────────── */

/**
 * Carga la participación del invocador y comprueba que efectivamente le
 * pertenece. Devuelve la referencia y los datos para que el llamador opere
 * sobre ellos sin repetir lecturas.
 */
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

/**
 * Devuelve la colección del garaje correspondiente al tipo de carta.
 */
function nombreColeccionPorTipo(tipoCarta) {
  if (tipoCarta === 'coche') return 'coches'
  if (tipoCarta === 'piloto') return 'pilotos'
  if (tipoCarta === 'potenciador') return 'potenciadores'
  throw new HttpsError('invalid-argument', `Tipo de carta no soportado: ${tipoCarta}`)
}

/**
 * Localiza una carta del garaje por su `instancia_id` recorriendo las tres
 * colecciones. Devuelve la colección donde vive y el índice para que el
 * llamador pueda mutarla sin rebuscarla.
 */
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

/**
 * Calcula el valor de reventa redondeado a dos decimales. Sigue la misma
 * fórmula que la UI del cliente para que el jugador vea el mismo importe
 * antes y después de confirmar la venta.
 */
function calcularValorReventa(precio) {
  return Math.round(Number(precio || 0) * PORCENTAJE_REVENTA * 100) / 100
}

/* ─── Vender una carta del garaje ───────────────────────────────────────── */

/**
 * Callable — vende una carta del garaje del jugador y le devuelve el 90 %
 * de su precio dinámico actual. Bloquea la venta si la carta está alineada
 * y el GP en juego sigue sin procesar.
 *
 * @param {{ idParticipante: string, instanciaId: number }} datos
 */
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

/* ─── Alinear / desalinear una carta ────────────────────────────────────── */

/**
 * Aplica las reglas de alineación: solo un chasis y como máximo dos pilotos
 * titulares; los potenciadores requieren al menos un piloto fichado.
 */
function aplicarCambioAlineacion(garaje, coleccion, indiceObjetivo) {
  const lista = [...(garaje[coleccion] || [])]
  const cartaObjetivo = { ...lista[indiceObjetivo] }
  const pasaAEquipado = !cartaObjetivo.equipado

  if (pasaAEquipado && coleccion === 'coches') {
    const yaAlineados = lista.filter((c) => c.equipado).length
    if (yaAlineados >= MAX_COCHES_ALINEADOS) {
      /* Solo se permite un chasis: desalineo el actual para que el cambio
       * sea atómico desde el punto de vista del usuario. */
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

/**
 * Callable — alterna el estado `equipado` de una carta. Mientras haya un GP
 * en juego sin procesar, no se admite ningún cambio de alineación.
 */
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

/* ─── Invertir presupuesto en blindar la cláusula propia ────────────────── */

/**
 * Callable — convierte presupuesto del jugador en `clausulaInvertida` de una
 * de sus cartas (cada €1 sube la cláusula en €2). Lo bloqueo durante la
 * jornada activa para mantener todas las acciones del garaje bajo el mismo
 * régimen.
 */
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
