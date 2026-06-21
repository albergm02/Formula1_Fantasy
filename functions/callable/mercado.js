const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { FieldValue } = require('firebase-admin/firestore')

const { db } = require('../middleware/firebase')
const { exigirEmailAutenticado } = require('../middleware/autenticacion')

const REGION = 'europe-west1'
const OPCIONES = { region: REGION, enforceAppCheck: true }

const {
  cargarCatalogo,
  cargarPreciosDinamicos,
  aplicarPreciosDinamicosACatalogo,
  seleccionarCartasDiarias,
} = require('../logica/mercado')
const { seleccionarPujasGanadoras } = require('../logica/pujas')

const HISTORIAL_MAX_MUESTRAS = 5
const FACTOR_DESINTERES = 0.95
const PRECIO_MINIMO = 5

function construirCartaGanada(cartaCompleta, idCarta, pujaGanadora, cantidad, tipoCarta) {
  const propiedadesClausula = {
    clausulaInvertida: 0,
    fechaAdquisicion: new Date().toISOString(),
  }
  const base = cartaCompleta || {
    id: idCarta,
    nombre: pujaGanadora.nombreCarta,
    tipoCarta,
    precio: pujaGanadora.precioCarta,
  }
  return {
    ...base,
    precioCompra: cantidad,
    instancia_id: Date.now() + Math.random(),
    ...propiedadesClausula,
  }
}

// Si hubo puja ganadora, la muestra es la cantidad pagada; si quedó desierta,
// se aplica FACTOR_DESINTERES como penalización suave al precio anterior.
function calcularPrecioMuestra(carta, pujaGanadora) {
  if (pujaGanadora) return Number(pujaGanadora.cantidad)
  return Number(carta.precio) * FACTOR_DESINTERES
}

// Formato "YYYY-MM-DD": ordena lexicográficamente igual que cronológicamente,
// lo que permite browsing natural en la consola de Firebase.
function calcularFechaMercado(fecha) {
  return fecha.toISOString().split('T')[0]
}

// Ruta canónica: mercados/{idLiga}/dias/{YYYY-MM-DD}
function referenciaDiaMercado(idLiga, fecha) {
  return db.collection('mercados').doc(idLiga).collection('dias').doc(calcularFechaMercado(fecha))
}

// Día siguiente a las 12:00 UTC (= 14:00 hora España, hora en que el
// scheduler lanza la generación). Cierre y apertura del nuevo mercado
// ocurren en la misma ejecución del scheduler, sin ventana muerta.
function calcularFechaCierre(fechaApertura) {
  const cierre = new Date(fechaApertura)
  cierre.setUTCDate(cierre.getUTCDate() + 1)
  cierre.setUTCHours(12, 0, 0, 0)
  return cierre
}

// Resuelve todas las pujas de un mercado cerrado. La mayor por carta gana.
// Las perdedoras se descartan sin reembolso: el dinero comprometido nunca se
// dedujo del presupuesto real, solo se "reservaba" a nivel UI.
async function resolverPujasMercado(mercadoRef) {
  const pujasSnapshot = await mercadoRef.collection('pujas').get()
  if (pujasSnapshot.empty) return

  // Necesito los datos completos de cada carta (imagen, número, variante…)
  // para guardarlos en el garaje del ganador. La puja solo conserva el ID.
  const mercadoSnap = await mercadoRef.get()
  const cartasMercado = mercadoSnap.exists ? mercadoSnap.data().cartas || [] : []
  const mapaCartas = {}
  for (const carta of cartasMercado) {
    mapaCartas[carta.id] = carta
  }

  const pujasPorCarta = seleccionarPujasGanadoras(pujasSnapshot.docs.map((doc) => doc.data()))

  // Agrupo por participante para no sobreescribir el mismo documento varias
  // veces dentro del mismo batch (cada update reemplazaría al anterior).
  const cartasPorParticipante = {}
  for (const [idCarta, pujaGanadora] of Object.entries(pujasPorCarta)) {
    const { idParticipante } = pujaGanadora
    if (!cartasPorParticipante[idParticipante]) {
      cartasPorParticipante[idParticipante] = []
    }
    cartasPorParticipante[idParticipante].push({ idCarta, pujaGanadora })
  }

  const batch = db.batch()

  for (const [idParticipante, cartasGanadas] of Object.entries(cartasPorParticipante)) {
    const participacionRef = db.collection('participaciones').doc(idParticipante)
    const participacionSnap = await participacionRef.get()
    if (!participacionSnap.exists) continue

    const participacion = participacionSnap.data()
    let presupuestoRestante = participacion.presupuesto || 0

    const garaje = participacion.garaje || {
      coches: [],
      pilotos: [],
      potenciadores: [],
    }

    // Migración del formato antiguo (coche singular) al nuevo (coches[]).
    if (garaje.coche !== undefined || !garaje.coches) {
      garaje.coches = garaje.coche ? [garaje.coche] : []
      delete garaje.coche
    }

    const emailUsuario = participacion.email_usuario
    const nombreUsuario = participacion.nombre_usuario || emailUsuario

    for (const { idCarta, pujaGanadora } of cartasGanadas) {
      const { cantidad, tipoCarta } = pujaGanadora

      // Si el presupuesto ya no llega tras lo ganado en esta misma resolución,
      // descarto la siguiente. No reembolso: la puja nunca tocó el presupuesto.
      if (cantidad > presupuestoRestante) continue

      const cartaCompleta = mapaCartas[idCarta]
      const cartaGanada = construirCartaGanada(
        cartaCompleta,
        idCarta,
        pujaGanadora,
        cantidad,
        tipoCarta,
      )

      if (tipoCarta === 'coche') {
        garaje.coches.push({ ...cartaGanada, equipado: false })
      } else if (tipoCarta === 'piloto') {
        garaje.pilotos = [...(garaje.pilotos || []), { ...cartaGanada, equipado: false }]
      } else if (tipoCarta === 'potenciador') {
        garaje.potenciadores = [
          ...(garaje.potenciadores || []),
          { ...cartaGanada, equipado: false },
        ]
      }

      presupuestoRestante -= cantidad

      const nombreCarta = cartaGanada.nombre || pujaGanadora.nombreCarta
      batch.create(
        db.collection('actividad').doc(participacion.id_liga).collection('eventos').doc(),
        {
          idLiga: participacion.id_liga,
          nombreUsuario,
          tipo: 'compra',
          descripcion: `ha ganado la puja por ${tipoCarta} ${nombreCarta} por ${cantidad}M`,
          fecha: FieldValue.serverTimestamp(),
        },
      )
    }

    batch.update(participacionRef, {
      presupuesto: presupuestoRestante,
      garaje,
    })
  }

  await batch.commit()

  await actualizarPreciosTrasResolucion(cartasMercado, pujasPorCarta)
}

// Evita ofrecer una carta que nadie podría comprar porque ya tiene dueño en
// la liga. El mismo piloto puede aparecer en otras variantes.
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

async function ejecutarGeneracionMercadoParaLiga(idLiga) {
  // Exportado para que callable/ligas.js pueda reutilizarlo al inicializar
  // una liga recién creada sin duplicar la lógica de generación.
  const ahora = new Date()
  const fechaHoy = calcularFechaMercado(ahora)
  const refHoy = referenciaDiaMercado(idLiga, ahora)

  const mercadoExistente = await refHoy.get()
  if (mercadoExistente.exists) {
    return {
      mensaje: `El mercado ${fechaHoy} ya fue generado previamente.`,
      idMercado: fechaHoy,
      omitido: true,
    }
  }

  // Si el mercado de ayer sigue abierto, lo resuelvo ANTES de crear el de hoy
  // para cerrar el ciclo pujas ganadoras → garajes → precios dinámicos.
  const ayer = new Date(ahora)
  ayer.setUTCDate(ayer.getUTCDate() - 1)
  const refAyer = referenciaDiaMercado(idLiga, ayer)
  const mercadoAyer = await refAyer.get()

  if (mercadoAyer.exists && mercadoAyer.data().estado === 'abierto') {
    await resolverPujasMercado(refAyer)
    await refAyer.update({ estado: 'cerrado' })
  }

  const catalogoBase = await cargarCatalogo(db)
  const preciosDinamicos = await cargarPreciosDinamicos(db)
  const catalogoConPrecios = aplicarPreciosDinamicosACatalogo(catalogoBase, preciosDinamicos)
  const exclusionesLiga = await recopilarCartasFichadasEnLiga(idLiga)
  const cartasDelDia = seleccionarCartasDiarias(catalogoConPrecios, exclusionesLiga)
  const fechaCierre = calcularFechaCierre(ahora)

  await refHoy.set({
    idLiga,
    estado: 'abierto',
    fechaCierre: fechaCierre.toISOString(),
    cartas: cartasDelDia,
  })

  return {
    mensaje: `Mercado generado para liga ${idLiga}.`,
    idMercado: fechaHoy,
    totalCartas: cartasDelDia.length,
    fechaCierre: fechaCierre.toISOString(),
  }
}

function claveCartaPorTipo(carta, tipo) {
  return tipo === 'piloto' ? `${carta.numero}|${carta.variante}` : carta.id
}

function coleccionGaraje(tipo) {
  if (tipo === 'piloto') return 'pilotos'
  if (tipo === 'coche') return 'coches'
  return 'potenciadores'
}

async function actualizarPreciosTrasResolucion(cartasMercado, pujasPorCarta) {
  const refPrecios = db.collection('catalogo').doc('precios')
  const refHistorial = db.collection('catalogo').doc('historial')
  const [snapPrecios, snapHistorial] = await Promise.all([refPrecios.get(), refHistorial.get()])

  const preciosActuales = snapPrecios.exists ? snapPrecios.data() : {}
  const historialActual = snapHistorial.exists ? snapHistorial.data() : {}

  const preciosNuevos = {
    pilotos: { ...(preciosActuales.pilotos || {}) },
    coches: { ...(preciosActuales.coches || {}) },
    potenciadores: { ...(preciosActuales.potenciadores || {}) },
  }
  const historialNuevo = {
    pilotos: { ...(historialActual.pilotos || {}) },
    coches: { ...(historialActual.coches || {}) },
    potenciadores: { ...(historialActual.potenciadores || {}) },
  }

  const deltasPorTipo = { piloto: {}, coche: {}, potenciador: {} }
  const nuevosAbsolutosPorTipo = { piloto: {}, coche: {}, potenciador: {} }

  for (const tipo of ['piloto', 'coche', 'potenciador']) {
    const campo = coleccionGaraje(tipo)
    for (const carta of cartasMercado) {
      if (carta.tipoCarta !== tipo) continue
      const clave = claveCartaPorTipo(carta, tipo)
      if (!clave) continue

      const muestra = calcularPrecioMuestra(carta, pujasPorCarta[carta.id])
      const previas = historialNuevo[campo][clave] || []
      const combinadas = [...previas, muestra].slice(-HISTORIAL_MAX_MUESTRAS)
      historialNuevo[campo][clave] = combinadas

      const media = combinadas.reduce((a, v) => a + v, 0) / combinadas.length
      const precioNuevo = Math.max(PRECIO_MINIMO, Math.round(media * 10) / 10)
      const precioAnterior = preciosActuales[campo]?.[clave]
      preciosNuevos[campo][clave] = precioNuevo

      if (precioAnterior == null) {
        nuevosAbsolutosPorTipo[tipo][clave] = precioNuevo
      } else {
        const delta = Math.round((precioNuevo - precioAnterior) * 10) / 10
        if (delta !== 0) deltasPorTipo[tipo][clave] = delta
      }
    }
  }

  const fecha = new Date().toISOString()
  await Promise.all([
    refPrecios.set({ ...preciosNuevos, fechaActualizacion: fecha }),
    refHistorial.set({ ...historialNuevo, fechaActualizacion: fecha }),
  ])

  const tareas = []
  for (const tipo of ['piloto', 'coche', 'potenciador']) {
    const coleccion = coleccionGaraje(tipo)
    if (Object.keys(deltasPorTipo[tipo]).length > 0) {
      tareas.push(propagarAGarajes(tipo, coleccion, deltasPorTipo[tipo], false))
      tareas.push(propagarAMercadosAbiertos(tipo, deltasPorTipo[tipo]))
    }
    if (Object.keys(nuevosAbsolutosPorTipo[tipo]).length > 0) {
      tareas.push(propagarAGarajes(tipo, coleccion, nuevosAbsolutosPorTipo[tipo], true))
    }
  }
  if (tareas.length > 0) await Promise.all(tareas)
}

async function propagarAGarajes(tipo, coleccion, cambiosPorClave, esAbsoluto) {
  const snap = await db.collection('participaciones').get()
  const batch = db.batch()
  let cambios = 0

  for (const doc of snap.docs) {
    const garaje = doc.data().garaje
    const cartas = garaje && garaje[coleccion]
    if (!Array.isArray(cartas)) continue

    let huboCambio = false
    const actualizadas = cartas.map((carta) => {
      if (!carta) return carta
      const clave = claveCartaPorTipo(carta, tipo)
      if (!clave || cambiosPorClave[clave] == null) return carta
      const precio = esAbsoluto
        ? cambiosPorClave[clave]
        : Math.max(
            PRECIO_MINIMO,
            Math.round((Number(carta.precio || 0) + cambiosPorClave[clave]) * 10) / 10,
          )
      huboCambio = true
      return { ...carta, precio }
    })

    if (huboCambio) {
      batch.update(doc.ref, { [`garaje.${coleccion}`]: actualizadas })
      cambios++
    }
  }

  if (cambios > 0) await batch.commit()
}

async function propagarAMercadosAbiertos(tipo, deltas) {
  const snap = await db.collectionGroup('dias').where('estado', '==', 'abierto').get()
  if (snap.empty) return

  const batch = db.batch()
  let cambios = 0

  for (const doc of snap.docs) {
    const cartas = doc.data().cartas || []
    let huboCambio = false

    const actualizadas = cartas.map((carta) => {
      if (carta.tipoCarta !== tipo) return carta
      const clave = claveCartaPorTipo(carta, tipo)
      if (!clave || deltas[clave] == null) return carta
      huboCambio = true
      return {
        ...carta,
        precio: Math.max(
          PRECIO_MINIMO,
          Math.round((Number(carta.precio || 0) + deltas[clave]) * 10) / 10,
        ),
      }
    })

    if (huboCambio) {
      batch.update(doc.ref, { cartas: actualizadas })
      cambios++
    }
  }

  if (cambios > 0) await batch.commit()
}

// Si una liga falla, registro y sigo: prefiero N-1 ligas con mercado nuevo a
// fallar todas por una. El throw final hace que Scheduler reintente; las
// ligas ya procesadas son idempotentes y no se duplican.
exports.generarMercado = onSchedule(
  {
    schedule: 'every day 12:00',
    timeZone: 'UTC',
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
      throw new Error(
        `[Mercado Diario] ${ligasFallidas.length} liga(s) fallida(s): ${ligasFallidas.join(', ')}`,
      )
    }
  },
)

// Saneado idéntico al histórico del cliente para que las pujas existentes
// sigan localizables.
function sanitizarEmailParaIdPuja(email) {
  return email.replace(/[.@]/g, '_')
}

// Se ignora la puja sobre idCartaExcluida para que actualizar una puja
// existente no cuente dos veces su importe anterior.
async function sumarComprometidoEnMercado(mercadoRef, email, idCartaExcluida) {
  const pujasSnap = await mercadoRef.collection('pujas').where('emailUsuario', '==', email).get()
  return pujasSnap.docs.reduce((suma, documento) => {
    const datos = documento.data()
    if (datos.idCarta === idCartaExcluida) return suma
    return suma + Number(datos.cantidad || 0)
  }, 0)
}

async function cargarMercadoAbiertoDeLiga(idLiga) {
  const snap = await db
    .collection('mercados')
    .doc(idLiga)
    .collection('dias')
    .where('estado', '==', 'abierto')
    .limit(1)
    .get()
  return snap.empty ? null : snap.docs[0]
}

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
  const cartas = mercadoDoc.data().cartas || []
  const cartaObjetivo = cartas.find((carta) => carta.id === idCarta)
  if (!cartaObjetivo) {
    throw new HttpsError('not-found', 'La carta no está en el mercado de hoy.')
  }
  if (cantidadNumerica < Number(cartaObjetivo.precio || 0)) {
    throw new HttpsError(
      'failed-precondition',
      `La puja mínima es ${cartaObjetivo.precio}M (precio base actual).`,
    )
  }

  const participacionSnap = await db
    .collection('participaciones')
    .where('id_liga', '==', idLiga)
    .where('email_usuario', '==', email)
    .limit(1)
    .get()
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

// Añade al lote el borrado de todas las pujas de un usuario en cualquier
// mercado de la liga. Evita pujas huérfanas que el planificador intentaría
// adjudicar a una participación ya inexistente tras abandonar o ser expulsado.
async function agregarBorradoPujasUsuario(batch, idLiga, email) {
  const correo = String(email).trim().toLowerCase()
  const diasSnapshot = await db.collection('mercados').doc(idLiga).collection('dias').get()
  let pujasEliminadas = 0
  for (const documentoDia of diasSnapshot.docs) {
    const pujasSnapshot = await documentoDia.ref
      .collection('pujas')
      .where('emailUsuario', '==', correo)
      .get()
    for (const documentoPuja of pujasSnapshot.docs) {
      batch.delete(documentoPuja.ref)
      pujasEliminadas += 1
    }
  }
  return pujasEliminadas
}

// Exportados para reutilización en callable/ligas.js y callable/garaje.js.
module.exports.cargarMercadoAbiertoDeLiga = cargarMercadoAbiertoDeLiga
module.exports.agregarBorradoPujasUsuario = agregarBorradoPujasUsuario
module.exports.ejecutarGeneracionMercadoParaLiga = ejecutarGeneracionMercadoParaLiga
