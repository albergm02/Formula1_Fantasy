/**
 * @module functions/callable/Mercado
 * @description Funciones callable para manejar las operaciones relacionadas con el mercado, incluyendo la resolución de pujas y la gestión de cartas.
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { FieldValue } = require('firebase-admin/firestore')

const { db } = require('../middleware/firebase')
const { exigirEmailAutenticado } = require('../middleware/autenticacion')
const { cargarCatalogo, seleccionarCartasDiarias } = require('../logica/mercado')
const { seleccionarPujasGanadoras } = require('../logica/pujas')

const REGION = 'europe-west1'
const OPCIONES = { region: REGION, enforceAppCheck: true }
const BONO_DIARIO_CIERRE_MERCADO = 1

/**
 * Construye una carta ganada por un participante.
 * @param {Object} cartaCompleta - Datos completos de la carta.
 * @param {string} idCarta - ID de la carta.
 * @param {Object} pujaGanadora - Datos de la puja ganadora.
 * @param {number} cantidad - Cantidad ganada.
 * @param {string} tipoCarta - Tipo de carta.
 * @returns {Object} - Carta ganada.
 */
function construirCartaGanada(cartaCompleta, idCarta, pujaGanadora, cantidad, tipoCarta) {
  const base = cartaCompleta || { id: idCarta, nombre: pujaGanadora.nombreCarta, tipoCarta, precio: pujaGanadora.precioCarta }
  return { ...base, precioCompra: cantidad, instancia_id: crypto.randomUUID(), clausulaInvertida: 0, fechaAdquisicion: new Date().toISOString() }
}

/**
 * Obtiene la referencia al documento único del mercado de una liga. El mercado
 * es único por liga (sin histórico por día): al rotar, se sobrescribe el mismo
 * doc con nuevas cartas, evitando estados intermedios pegajosos.
 * @param {string} idLiga - ID de la liga.
 * @returns {FirebaseFirestore.DocumentReference} - Referencia al doc del mercado.
 */
function referenciaMercado(idLiga) {
  return db.collection('mercados').doc(idLiga)
}

/**
 * Adquiere de manera atómica el estado de cierre de mercado.
 *
 * @param {FirebaseFirestore.DocumentReference} mercadoRef - Referencia al mercado del día.
 * @returns {Promise<boolean>} - true si esta invocación tomó el cierre; false si ya estaba tomado.
 */
async function intentarBloquearCierreMercado(mercadoRef) {
  return db.runTransaction(async (transaccion) => {
    const snap = await transaccion.get(mercadoRef)
    if (!snap.exists) return false
    if (snap.data().estado !== 'abierto') return false
    transaccion.update(mercadoRef, { estado: 'cerrando' })
    return true
  })
}

/**
 * Resuelve todas las pujas de un mercado cerrado. La mayor por carta gana; en
 * caso de empate, la primera registrada. Si el mejor postor no tiene
 * presupuesto, la carta se cede al siguiente postor del ranking (y así
 * sucesivamente), evitando perder la carta por falta de saldo del líder.
 *
 * Todas las pujas (ganadas y perdedoras) se borran en el MISMO batch atómico
 * que los fichajes, lo que vuelve la resolución idempotente ante reintentos:
 * una segunda invocación vería `pujas` vacías y saldría sin duplicar nada.
 *
 * @param {FirebaseFirestore.DocumentReference} mercadoRef - Referencia al documento del mercado.
 * @returns {Promise<void>}
 */
async function resolverPujasMercado(mercadoRef) {
  const pujasSnapshot = await mercadoRef.collection('pujas').get()
  if (pujasSnapshot.empty) return {}

  const mercadoSnap = await mercadoRef.get()
  const cartasMercado = mercadoSnap.exists ? mercadoSnap.data().cartas || [] : []
  const mapaCartas = Object.fromEntries(cartasMercado.map((carta) => [carta.id, carta]))

  const pujasParaRanking = pujasSnapshot.docs.map((doc) => ({ ref: doc.ref, ...doc.data() }))
  const rankPorCarta = seleccionarPujasGanadoras(pujasParaRanking)

  // Procesamos las cartas en orden desc por la cantidad de la puja líder, así
  // los fichajes más valiosos se honran primero cuando el presupuesto justo
  // obligue a descartar alguno (determinismo, no dependiente del hash).
  const cartasOrdenadasPorValor = Object.entries(rankPorCarta).sort(
    ([, rankingA], [, rankingB]) => rankingB[0].cantidad - rankingA[0].cantidad,
  )

  const batch = db.batch()
  const estadoParticipantes = {}

  async function cargarEstadoParticipante(idParticipante) {
    if (idParticipante in estadoParticipantes) return estadoParticipantes[idParticipante]
    const ref = db.collection('participaciones').doc(idParticipante)
    const snap = await ref.get()
    if (!snap.exists) {
      estadoParticipantes[idParticipante] = null
      return null
    }
    const participacion = snap.data()
    const garaje = participacion.garaje || { coches: [], pilotos: [], potenciadores: [] }
    if (garaje.coche !== undefined || !garaje.coches) {
      garaje.coches = garaje.coche ? [garaje.coche] : []
      delete garaje.coche
    }
    const estado = { ref, participacion, presupuestoRestante: participacion.presupuesto || 0, garaje }
    estadoParticipantes[idParticipante] = estado
    return estado
  }

  for (const [idCarta, ranking] of cartasOrdenadasPorValor) {
    for (const puja of ranking) {
      const { idParticipante, cantidad, tipoCarta } = puja
      const estado = await cargarEstadoParticipante(idParticipante)
      if (!estado) continue
      if (cantidad > estado.presupuestoRestante) continue

      estado.presupuestoRestante -= cantidad
      const cartaCompleta = mapaCartas[idCarta]
      const cartaGanada = construirCartaGanada(cartaCompleta, idCarta, puja, cantidad, tipoCarta)
      const cartaEquipable = { ...cartaGanada, equipado: false }

      if (tipoCarta === 'coche') estado.garaje.coches.push(cartaEquipable)
      else if (tipoCarta === 'piloto') estado.garaje.pilotos = [...(estado.garaje.pilotos || []), cartaEquipable]
      else if (tipoCarta === 'potenciador') estado.garaje.potenciadores = [...(estado.garaje.potenciadores || []), cartaEquipable]

      if (!estado.cartasAdjudicadas) estado.cartasAdjudicadas = []
      estado.cartasAdjudicadas.push({ idCarta, puja })
      break
    }
  }

  for (const estado of Object.values(estadoParticipantes)) {
    if (!estado || !estado.cartasAdjudicadas) continue
    const { participacion } = estado
    const nombreUsuario = participacion.nombre_usuario || participacion.email_usuario

    batch.update(estado.ref, {
      presupuesto: estado.presupuestoRestante,
      garaje: estado.garaje,
    })

    for (const { idCarta, puja } of estado.cartasAdjudicadas) {
      const cartaCompleta = mapaCartas[idCarta]
      const nombreCarta = (cartaCompleta && cartaCompleta.nombre) || puja.nombreCarta
      const refEvento = db.collection('actividad').doc(participacion.id_liga).collection('eventos').doc()
      batch.create(refEvento, {
        idLiga: participacion.id_liga,
        nombreUsuario,
        tipo: 'compra',
        descripcion: `ha ganado la puja por ${puja.tipoCarta} ${nombreCarta} por ${puja.cantidad}M`,
        fecha: FieldValue.serverTimestamp(),
      })
    }
  }

  // Borramos TODA la subcolección de pujas en el mismo batch: el mercado
  // está cerrado y los docs ya son histórico. A la vez, vuelve idempotente un
  // eventual reintento: pujas inexistentes -> return temprano -> sin duplicar.
  for (const doc of pujasSnapshot.docs) batch.delete(doc.ref)

  await batch.commit()
}

/**
 * Reparte el bono diario de cierre de mercado a todas las participaciones
 * de una liga. Se invoca justo después de resolver las pujas del día cerrado,
 * @param {string} idLiga - ID de la liga cuyo mercado se ha cerrado.
 * @returns {Promise<number>} - Número de participaciones bonificadas.
 */
async function otorgarBonoDiarioCierreMercado(idLiga) {
  const participacionesSnap = await db.collection('participaciones').where('id_liga', '==', idLiga).get()
  if (participacionesSnap.empty) return 0

  const batch = db.batch()
  for (const documento of participacionesSnap.docs) {
    batch.update(documento.ref, { presupuesto: FieldValue.increment(BONO_DIARIO_CIERRE_MERCADO) })
  }
  await batch.commit()
  return participacionesSnap.size
}

/**
 * Recopila las cartas fichadas en una liga específica.
 * @param {string} idLiga - ID de la liga.
 * @returns {Promise<Object>} - Conjuntos de claves de pilotos bloqueadas y IDs de cartas.
 */
async function recopilarCartasFichadasEnLiga(idLiga) {
  const participacionesSnap = await db
    .collection('participaciones')
    .where('id_liga', '==', idLiga)
    .get()
  const clavesPilotoBloqueadas = new Set()
  const idsCartas = new Set()
  for (const documento of participacionesSnap.docs) {
    const garaje = documento.data().garaje || {}
    for (const carta of garaje.pilotos || []) {
      if (carta && carta.numero != null && carta.variante) {
        clavesPilotoBloqueadas.add(`${carta.numero}|${carta.variante}`)
      }
    }
    for (const carta of garaje.coches || []) {
      if (carta && carta.id) idsCartas.add(carta.id)
    }
    for (const carta of garaje.potenciadores || []) {
      if (carta && carta.id) idsCartas.add(carta.id)
    }
  }
  return { clavesPilotoBloqueadas, idsCartas }
}

/**
 * Genera el mercado para una liga específica.
 * @param {string} idLiga - ID de la liga.
 * @returns {Promise<Object>} - Resultado de la operación.
 */
async function ejecutarGeneracionMercadoParaLiga(idLiga) {
  const ref = referenciaMercado(idLiga)
  const snap = await ref.get()

  if (snap.exists) {
    const datos = snap.data()
    const sigueAbierto = datos.estado === 'abierto' && datos.fechaCierre && new Date(datos.fechaCierre).getTime() > Date.now()

    if (sigueAbierto) {
      return { mensaje: 'El mercado actual sigue abierto.', idLiga, omitido: true }
    }

    // Rotación del mercado. Puede ser rotación normal (abierto con fechaCierre
    // ya pasada) o recuperación de un cierre interrumpido (estado 'cerrando'
    // pegado por un crash previo). En ambos casos resolvemos las pujas y
    // sobrescribimos el doc con cartas nuevas en un único flujo, sin dejar
    // estados pegajosos.
    if (datos.estado === 'abierto') {
      const bloqueado = await intentarBloquearCierreMercado(ref)
      if (!bloqueado) return { mensaje: 'Otra invocación ya está cerrando el mercado.', idLiga, omitido: true }
      try {
        await resolverPujasMercado(ref)
        await otorgarBonoDiarioCierreMercado(idLiga)
      } catch (error) {
        await ref.update({ estado: 'abierto' }).catch(() => {})
        throw error
      }
    } else {
      // estado === 'cerrando' (recovery): resolverPujasMercado es idempotente
      // (si el batch previo commitó, las pujas ya no existen y retorna; si no
      // commitó, las adjudica ahora). Sin lock porque el camino de recovery
      // solo se alcanza tras un crash previo, no en concurrencia normal.
      await resolverPujasMercado(ref)
      await otorgarBonoDiarioCierreMercado(idLiga)
    }
  }

  // Sobrescribe (rotación) o crea el mercado con cartas frescas y nuevo cierre.
  const catalogoBase = await cargarCatalogo(db)
  const exclusionesLiga = await recopilarCartasFichadasEnLiga(idLiga)
  const cartasDelDia = seleccionarCartasDiarias(catalogoBase, exclusionesLiga)
  // Cierre al día siguiente a las 12:00 UTC (= 14:00 hora España, hora en que
  // el scheduler lanza la próxima generación). Rotación y apertura ocurren en
  // la misma ejecución, sin ventana muerta.
  const fechaCierre = new Date()
  fechaCierre.setUTCDate(fechaCierre.getUTCDate() + 1)
  fechaCierre.setUTCHours(12, 0, 0, 0)

  await ref.set({
    idLiga,
    estado: 'abierto',
    fechaCierre: fechaCierre.toISOString(),
    cartas: cartasDelDia,
  })

  return { mensaje: `Mercado generado para liga ${idLiga}.`, idLiga, totalCartas: cartasDelDia.length, fechaCierre: fechaCierre.toISOString() }
}

/**
 * Genera el mercado diario para todas las ligas mediante una Cloud Function programada (Scheduler).
 * Se ejecuta automáticamente a las 12:00 UTC cada día.
 *
 * @function generarMercado
 * @returns {Promise<void>}
 */
exports.generarMercado = onSchedule(
  {
    schedule: 'every day 16:00',
    timeZone: 'Europe/Madrid',
    region: REGION,
    retryCount: 3,
    minBackoffSeconds: 1800,
  },
  async () => {
    const todasLigas = await db.collection('ligas').get()
    const ligasFallidas = []

    for (const docLiga of todasLigas.docs) {
      try {
        await ejecutarGeneracionMercadoParaLiga(docLiga.id)
      } catch (error) {
        ligasFallidas.push(docLiga.id)
      }
    }

    if (ligasFallidas.length > 0) {
      throw new Error(`[Mercado Diario] ${ligasFallidas.length} liga(s) fallida(s): ${ligasFallidas.join(', ')}`)
    }
  },
)


function sanitizarEmailParaIdPuja(email) {
  return email.replace(/[.@]/g, '_')
}

/**
 * Suma la cantidad comprometida en el mercado por un usuario, excluyendo una carta específica.
 * @param {Object} mercadoRef - Referencia al documento del mercado.
 * @param {string} email - Email del usuario.
 * @param {string} idCartaExcluida - ID de la carta a excluir.
 * @returns {Promise<number>} - Cantidad comprometida.
 */
async function sumarComprometidoEnMercado(mercadoRef, email, idCartaExcluida) {
  const pujasSnap = await mercadoRef.collection('pujas').where('emailUsuario', '==', email).get()
  return pujasSnap.docs.reduce((suma, documento) => {
    const datos = documento.data()
    if (datos.idCarta === idCartaExcluida) return suma
    return suma + Number(datos.cantidad || 0)
  }, 0)
}

/**
 * Carga el mercado abierto de una liga.
 * @param {string} idLiga - ID de la liga.
 * @returns {Promise<Object|null>} - Documento del mercado abierto o null si no existe.
 */
async function cargarMercadoAbiertoDeLiga(idLiga) {
  const snap = await db.collection('mercados').doc(idLiga).get()
  if (!snap.exists || snap.data().estado !== 'abierto') return null
  return snap
}

/**
 * Registra una puja en el mercado abierto de una liga mediante una Cloud Function (Callable).
 * Verifica que la carta exista, la puja supere el precio base y el presupuesto sea suficiente.
 *
 * @function registrarPuja
 * @param {Object} request - Objeto de solicitud proporcionado por Firebase.
 * @param {Object} request.data - Carga útil (payload) enviada desde el cliente Frontend.
 * @param {string} request.data.idLiga - El identificador único de la liga.
 * @param {string} request.data.idCarta - El identificador único de la carta por la que se puja.
 * @param {number} request.data.cantidad - Cantidad de la puja, debe ser positiva y mayor o igual al precio base.
 * @returns {Promise<Object>} Resultado de la operación, indicando si fue exitosa y la cantidad registrada.
 */
exports.registrarPuja = onCall(OPCIONES, async (request) => {
  const email = exigirEmailAutenticado(request)
  const { idLiga, idCarta, cantidad } = request.data || {}
  if (!idLiga || !idCarta) {
    throw new HttpsError('invalid-argument', 'Faltan idLiga o idCarta.')
  }
  const cantidadNumerica = Number(cantidad)
  if (!Number.isFinite(cantidadNumerica) || cantidadNumerica <= 0) {
    throw new HttpsError('invalid-argument', 'La cantidad de la puja debe ser positiva.')
  }

  const mercadoDoc = await cargarMercadoAbiertoDeLiga(idLiga)
  if (!mercadoDoc) {
    throw new HttpsError('failed-precondition', 'No hay mercado abierto para esta liga.')
  }
  const datosMercado = mercadoDoc.data()
  const fechaCierre = datosMercado.fechaCierre ? new Date(datosMercado.fechaCierre).getTime() : null
  if (fechaCierre !== null && Date.now() >= fechaCierre) {
    throw new HttpsError('failed-precondition', 'El mercado ya está cerrado, no se aceptan pujas.')
  }
  const cartas = datosMercado.cartas || []
  const cartaObjetivo = cartas.find((carta) => carta.id === idCarta)
  if (!cartaObjetivo) {
    throw new HttpsError('not-found', 'La carta no está en el mercado de hoy.')
  }
  if (cantidadNumerica < Number(cartaObjetivo.precio || 0)) {
    throw new HttpsError('failed-precondition', `La puja mínima es ${cartaObjetivo.precio}M (precio base actual).`)
  }

  const participacionSnap = await db.collection('participaciones').where('id_liga', '==', idLiga).where('email_usuario', '==', email).limit(1).get()
  if (participacionSnap.empty) {
    throw new HttpsError('not-found', 'No participas en esta liga.')
  }
  const participacion = participacionSnap.docs[0]
  const presupuestoActual = Number(participacion.data().presupuesto || 0)
  const comprometidoEnOtras = await sumarComprometidoEnMercado(mercadoDoc.ref, email, idCarta)
  if (cantidadNumerica + comprometidoEnOtras > presupuestoActual) {
    throw new HttpsError('failed-precondition', 'Presupuesto insuficiente para esta puja.')
  }

  const idPuja = `${sanitizarEmailParaIdPuja(email)}_${idCarta}`
  await mercadoDoc.ref.collection('pujas').doc(idPuja).set({
    idCarta,
    tipoCarta: cartaObjetivo.tipoCarta,
    nombreCarta: cartaObjetivo.nombre,
    precioCarta: cartaObjetivo.precio,
    emailUsuario: email,
    idParticipante: participacion.id,
    cantidad: cantidadNumerica,
    fecha: new Date().toISOString(),
  })

  return { ok: true, cantidad: cantidadNumerica }
})

/**
 * Elimina una puja del mercado abierto de una liga mediante una Cloud Function (Callable).
 * Solo el usuario propietario de la puja puede retirarla.
 *
 * @function eliminarPuja
 * @param {Object} request - Objeto de solicitud proporcionado por Firebase.
 * @param {Object} request.data - Carga útil (payload) enviada desde el cliente Frontend.
 * @param {string} request.data.idLiga - El identificador único de la liga.
 * @param {string} request.data.idCarta - El identificador único de la carta cuya puja se desea retirar.
 * @returns {Promise<Object>} Resultado de la operación, indicando si la puja fue eliminada.
 */
exports.eliminarPuja = onCall(OPCIONES, async (request) => {
  const email = exigirEmailAutenticado(request)
  const { idLiga, idCarta } = request.data || {}
  if (!idLiga || !idCarta) {
    throw new HttpsError('invalid-argument', 'Faltan idLiga o idCarta.')
  }

  const mercadoDoc = await cargarMercadoAbiertoDeLiga(idLiga)
  if (!mercadoDoc) return { ok: true, eliminado: false }

  const idPuja = `${sanitizarEmailParaIdPuja(email)}_${idCarta}`
  const refPuja = mercadoDoc.ref.collection('pujas').doc(idPuja)
  const pujaSnap = await refPuja.get()
  if (!pujaSnap.exists) {
    return { ok: true, eliminado: false }
  }
  if (pujaSnap.data().emailUsuario !== email) {
    throw new HttpsError('permission-denied', 'Solo puedes retirar tus propias pujas.')
  }
  await refPuja.delete()
  return { ok: true, eliminado: true }
})

/**
 * Añade al lote el borrado de todas las pujas de un usuario en cualquier
 * mercado de la liga. Evita pujas huérfanas que el planificador intentaría
 * adjudicar a una participación ya inexistente tras abandonar o ser expulsado.
 * @param {Object} batch - Lote de operaciones de Firestore.
 * @param {string} idLiga - ID de la liga.
 * @param {string} email - Email del usuario.
 * @returns {Promise<number>} - Número de pujas eliminadas.
 */
async function agregarBorradoPujasUsuario(batch, idLiga, email) {
  const correo = String(email).trim().toLowerCase()
  const pujasSnapshot = await db.collection('mercados').doc(idLiga).collection('pujas').where('emailUsuario', '==', correo).get()
  for (const documentoPuja of pujasSnapshot.docs) {
    batch.delete(documentoPuja.ref)
  }
  return pujasSnapshot.size
}

module.exports.cargarMercadoAbiertoDeLiga = cargarMercadoAbiertoDeLiga
module.exports.agregarBorradoPujasUsuario = agregarBorradoPujasUsuario
module.exports.ejecutarGeneracionMercadoParaLiga = ejecutarGeneracionMercadoParaLiga
