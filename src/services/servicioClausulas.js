/**
 * Servicio de cláusulas de rescisión.
 * Centraliza las operaciones de Firestore relacionadas con la transferencia
 * de cartas entre participantes mediante el pago de una cláusula.
 *
 * Usa writeBatch de Firestore para garantizar atomicidad: la carta se transfiere
 * y los presupuestos se ajustan en una sola operación (todo o nada).
 *
 * @module servicioClausulas
 */
import { doc, getDoc, writeBatch } from 'firebase/firestore'
import { db } from './servicioFirebase'

const HORAS_PERIODO_GRACIA = 48

/**
 * Calcula el precio de cláusula de un elemento del garaje.
 * Se basa en el precio realmente pagado por el dueño al fichar la carta
 * (`precioCompra`), no en su valor de mercado actual: así la cláusula refleja
 * la inversión histórica + las mejoras que el dueño haya aplicado.
 * Fórmula: precioCompra + (inversión del dueño × 2).
 * @param {Object} elemento - Carta del garaje con campos precioCompra y clausulaInvertida.
 * @returns {number} Precio total de la cláusula.
 */
export const calcularPrecioClausula = (elemento) => {
  const precioBase = elemento.precioCompra ?? elemento.precio
  const inversionDueño = elemento.clausulaInvertida || 0
  return precioBase + inversionDueño * 2
}

/**
 * Determina si una carta está protegida por el periodo de gracia tras adquisición.
 * @param {Object} elemento - Carta del garaje con campo fechaAdquisicion (ISO string).
 * @returns {boolean} true si la carta aún está dentro del periodo de gracia.
 */
export const estaEnPeriodoDeGracia = (elemento) => {
  if (!elemento.fechaAdquisicion) return false

  const fechaAdquisicion = new Date(elemento.fechaAdquisicion)
  const milisegundosGracia = HORAS_PERIODO_GRACIA * 60 * 60 * 1000
  return Date.now() - fechaAdquisicion.getTime() < milisegundosGracia
}

/**
 * Calcula las horas restantes del periodo de gracia de una carta.
 * @param {Object} elemento - Carta del garaje con campo fechaAdquisicion.
 * @returns {number} Horas restantes (0 si ya expiró).
 */
export const horasRestantesDeGracia = (elemento) => {
  if (!elemento.fechaAdquisicion) return 0

  const fechaAdquisicion = new Date(elemento.fechaAdquisicion)
  const milisegundosGracia = HORAS_PERIODO_GRACIA * 60 * 60 * 1000
  const restante = milisegundosGracia - (Date.now() - fechaAdquisicion.getTime())
  return Math.max(0, Math.ceil(restante / (1000 * 60 * 60)))
}

/**
 * Ejecuta la cláusula de rescisión transfiriendo una carta de un participante a otro.
 * Opera como batch write atómico en Firestore: si cualquier paso falla, no se aplica ninguno.
 *
 * Flujo:
 *  1. Lee ambas participaciones desde Firestore (datos frescos).
 *  2. Extrae la carta del garaje origen por instancia_id.
 *  3. Añade la carta al garaje destino con nueva fechaAdquisicion y clausulaInvertida reseteada.
 *  4. Ajusta presupuestos: origen recibe precioClausula, destino paga precioClausula.
 *  5. Commit atómico.
 *
 * @param {string} idParticipanteOrigen - ID de la participación del dueño actual de la carta.
 * @param {string} idParticipanteDestino - ID de la participación del comprador.
 * @param {number} instanciaId - instancia_id de la carta a transferir.
 * @param {number} precioClausula - Precio total de la cláusula a pagar.
 * @returns {Promise<Object>} La carta transferida.
 */
export const ejecutarClausula = async (
  idParticipanteOrigen,
  idParticipanteDestino,
  instanciaId,
  precioClausula,
) => {
  const referenciaOrigen = doc(db, 'participaciones', idParticipanteOrigen)
  const referenciaDestino = doc(db, 'participaciones', idParticipanteDestino)

  const [documentoOrigen, documentoDestino] = await Promise.all([
    getDoc(referenciaOrigen),
    getDoc(referenciaDestino),
  ])

  if (!documentoOrigen.exists()) {
    throw new Error(`Participación origen no encontrada: ${idParticipanteOrigen}`)
  }
  if (!documentoDestino.exists()) {
    throw new Error(`Participación destino no encontrada: ${idParticipanteDestino}`)
  }

  const datosOrigen = documentoOrigen.data()
  const datosDestino = documentoDestino.data()
  const garajeOrigen = datosOrigen.garaje
  const garajeDestino = datosDestino.garaje

  const cartaTransferida = extraerCartaDelGaraje(garajeOrigen, instanciaId)
  if (!cartaTransferida.carta) {
    throw new Error(`Carta con instancia_id ${instanciaId} no encontrada en el garaje del rival.`)
  }

  const cartaParaDestino = {
    ...cartaTransferida.carta,
    precioCompra: precioClausula,
    clausulaInvertida: 0,
    fechaAdquisicion: new Date().toISOString(),
  }

  añadirCartaAlGaraje(garajeDestino, cartaParaDestino)

  const lote = writeBatch(db)

  lote.update(referenciaOrigen, {
    garaje: garajeOrigen,
    presupuesto: datosOrigen.presupuesto + precioClausula,
  })

  lote.update(referenciaDestino, {
    garaje: garajeDestino,
    presupuesto: datosDestino.presupuesto - precioClausula,
  })

  await lote.commit()

  return cartaTransferida.carta
}

/**
 * Actualiza la inversión en cláusula de un elemento del garaje en Firestore.
 * @param {string} idParticipante - ID de la participación.
 * @param {Object} garajeActualizado - Garaje con la clausulaInvertida ya modificada.
 * @param {number} nuevoPresupuesto - Presupuesto tras descontar la inversión.
 * @returns {Promise<void>}
 */
export const persistirInversionClausula = async (
  idParticipante,
  garajeActualizado,
  nuevoPresupuesto,
) => {
  const referencia = doc(db, 'participaciones', idParticipante)
  const lote = writeBatch(db)
  lote.update(referencia, {
    garaje: garajeActualizado,
    presupuesto: nuevoPresupuesto,
  })
  await lote.commit()
}

/* ─── Funciones internas ─────────────────────────────────────────────────── */

/**
 * Extrae una carta del garaje por instancia_id, mutando el garaje en el proceso.
 * @param {Object} garaje - Garaje del participante origen.
 * @param {number} instanciaId - instancia_id de la carta.
 * @returns {{ carta: Object|null }} La carta extraída o null si no existe.
 */
function extraerCartaDelGaraje(garaje, instanciaId) {
  const coches = garaje.coches || (garaje.coche ? [garaje.coche] : [])
  const indiceCoche = coches.findIndex((c) => c.instancia_id === instanciaId)
  if (indiceCoche !== -1) {
    const carta = coches.splice(indiceCoche, 1)[0]
    garaje.coches = coches
    delete garaje.coche
    return { carta }
  }

  const indicePiloto = (garaje.pilotos || []).findIndex((p) => p.instancia_id === instanciaId)
  if (indicePiloto !== -1) {
    const carta = garaje.pilotos.splice(indicePiloto, 1)[0]
    return { carta }
  }

  const indicePotenciador = (garaje.potenciadores || []).findIndex(
    (p) => p.instancia_id === instanciaId,
  )
  if (indicePotenciador !== -1) {
    const carta = garaje.potenciadores.splice(indicePotenciador, 1)[0]
    return { carta }
  }

  return { carta: null }
}

/**
 * Añade una carta al garaje destino según su tipo.
 * @param {Object} garaje - Garaje del participante destino.
 * @param {Object} carta - Carta a añadir.
 */
function añadirCartaAlGaraje(garaje, carta) {
  const tipo = carta.tipo || carta.tipoCarta

  if (tipo === 'coche') {
    if (!garaje.coches) garaje.coches = []
    garaje.coches.push({ ...carta, equipado: false })
    delete garaje.coche
  } else if (tipo === 'piloto') {
    garaje.pilotos.push({ ...carta, equipado: false })
  } else if (tipo === 'potenciador') {
    garaje.potenciadores.push({ ...carta, equipado: false })
  }
}
