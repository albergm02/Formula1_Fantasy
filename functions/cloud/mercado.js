const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { FieldValue } = require('firebase-admin/firestore')

const { db } = require('../comun/firebase')
const { OPCIONES, REGION } = require('../comun/constantes')
const { exigirEmailAutenticado } = require('../comun/autenticacion')

const {
  cargarCatalogo,
  cargarPreciosDinamicos,
  aplicarPreciosDinamicosACatalogo,
  seleccionarCartasDiarias,
} = require('../dominio/mercado')
const { seleccionarPujasGanadoras } = require('../dominio/pujas')

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
    tipo: tipoCarta,
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

// Formato "<idLiga>_<YYYY-MM-DD>": da idempotencia natural (dos ejecuciones
// el mismo día resuelven al mismo ID y el segundo `set` no duplica).
function calcularIdMercado(idLiga, fecha) {
  const fechaStr = fecha.toISOString().split('T')[0]
  return `${idLiga}_${fechaStr}`
}

// Día siguiente a las 12:00 UTC (= 14:00 hora España).
function calcularFechaCierre(fechaApertura) {
  const cierre = new Date(fechaApertura)
  cierre.setUTCDate(cierre.getUTCDate() + 1)
  cierre.setUTCHours(12, 0, 0, 0)
  return cierre
}

// Resuelve todas las pujas de un mercado cerrado. La mayor por carta gana.
// Las perdedoras se descartan sin reembolso: el dinero comprometido nunca se
// dedujo del presupuesto real, solo se "reservaba" a nivel UI.
async function resolverPujasMercado(idMercado) {
  const pujasSnapshot = await db.collection('mercados').doc(idMercado).collection('pujas').get()
  if (pujasSnapshot.empty) return

  // Necesito los datos completos de cada carta (imagen, número, variante…)
  // para guardarlos en el garaje del ganador. La puja solo conserva el ID.
  const mercadoSnap = await db.collection('mercados').doc(idMercado).get()
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
      batch.create(db.collection('actividad').doc(), {
        idLiga: participacion.id_liga,
        nombreUsuario,
        tipo: 'compra',
        descripcion: `ha ganado la puja por ${tipoCarta} ${nombreCarta} por ${cantidad}M`,
        fecha: FieldValue.serverTimestamp(),
      })
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
  const ahora = new Date()
  const idMercadoHoy = calcularIdMercado(idLiga, ahora)

  const mercadoExistente = await db.collection('mercados').doc(idMercadoHoy).get()
  if (mercadoExistente.exists) {
    return {
      mensaje: `El mercado ${idMercadoHoy} ya fue generado previamente.`,
      idMercado: idMercadoHoy,
      omitido: true,
    }
  }

  // Si el mercado de ayer sigue abierto, lo resuelvo ANTES de crear el de hoy
  // para cerrar el ciclo pujas ganadoras → garajes → precios dinámicos.
  const ayer = new Date(ahora)
  ayer.setUTCDate(ayer.getUTCDate() - 1)
  const idMercadoAyer = calcularIdMercado(idLiga, ayer)
  const mercadoAyer = await db.collection('mercados').doc(idMercadoAyer).get()

  if (mercadoAyer.exists && mercadoAyer.data().estado === 'abierto') {
    await resolverPujasMercado(idMercadoAyer)
    await db.collection('mercados').doc(idMercadoAyer).update({ estado: 'cerrado' })
  }

  const catalogoBase = await cargarCatalogo(db)
  const preciosDinamicos = await cargarPreciosDinamicos(db)
  const catalogoConPrecios = aplicarPreciosDinamicosACatalogo(catalogoBase, preciosDinamicos)
  const exclusionesLiga = await recopilarCartasFichadasEnLiga(idLiga)
  const cartasDelDia = seleccionarCartasDiarias(catalogoConPrecios, exclusionesLiga)
  const fechaCierre = calcularFechaCierre(ahora)

  await db.collection('mercados').doc(idMercadoHoy).set({
    idLiga,
    estado: 'abierto',
    fechaCierre: fechaCierre.toISOString(),
    cartas: cartasDelDia,
  })

  return {
    mensaje: `Mercado generado para liga ${idLiga}.`,
    idMercado: idMercadoHoy,
    totalCartas: cartasDelDia.length,
    fechaCierre: fechaCierre.toISOString(),
  }
}

// Configuración por categoría: doc Firestore donde se persisten precios e
// histórico, cómo construir la clave de una carta y a qué array del garaje
// pertenece. Centralizar aquí permite que muestreo y propagación sean los
// mismos algoritmos para pilotos, coches y potenciadores.
const CATEGORIAS_PRECIO_DINAMICO = {
  piloto: {
    docPrecios: 'precios_pilotos',
    docHistorial: 'historial_pujas',
    coleccionGaraje: 'pilotos',
    construirClave: (carta) => `${carta.numero}|${carta.variante}`,
    esCartaValida: (carta) => carta.numero != null && carta.variante != null,
  },
  coche: {
    docPrecios: 'precios_coches',
    docHistorial: 'historial_pujas_coches',
    coleccionGaraje: 'coches',
    construirClave: (carta) => carta.id,
    esCartaValida: (carta) => carta.id != null,
  },
  potenciador: {
    docPrecios: 'precios_potenciadores',
    docHistorial: 'historial_pujas_potenciadores',
    coleccionGaraje: 'potenciadores',
    construirClave: (carta) => carta.id,
    esCartaValida: (carta) => carta.id != null,
  },
}

// Si hubo puja ganadora la muestra es la cantidad pagada; si quedó desierta,
// se aplica FACTOR_DESINTERES como penalización suave al precio anterior.
async function actualizarPreciosTrasResolucion(cartasMercado, pujasPorCarta) {
  for (const [tipoCarta, configuracion] of Object.entries(CATEGORIAS_PRECIO_DINAMICO)) {
    const muestrasPorClave = recopilarMuestrasDeCategoria(
      cartasMercado,
      pujasPorCarta,
      tipoCarta,
      configuracion,
    )
    if (Object.keys(muestrasPorClave).length === 0) continue
    await fusionarMuestrasYRecalcularPrecios(tipoCarta, configuracion, muestrasPorClave)
  }
}

function recopilarMuestrasDeCategoria(cartasMercado, pujasPorCarta, tipoCarta, configuracion) {
  const muestrasPorClave = {}
  for (const carta of cartasMercado) {
    if (carta.tipoCarta !== tipoCarta) continue
    if (!configuracion.esCartaValida(carta)) continue
    const clave = configuracion.construirClave(carta)
    const pujaGanadora = pujasPorCarta[carta.id]
    const precioMuestra = calcularPrecioMuestra(carta, pujaGanadora)
    muestrasPorClave[clave] = Math.round(precioMuestra * 10) / 10
  }
  return muestrasPorClave
}

// Media móvil de las últimas HISTORIAL_MAX_MUESTRAS muestras por carta.
// Propaga deltas a garajes y mercados abiertos, o el precio absoluto cuando
// es la primera vez que esa carta tiene precio dinámico.
async function fusionarMuestrasYRecalcularPrecios(tipoCarta, configuracion, muestrasPorClave) {
  const refHistorial = db.collection('catalogo').doc(configuracion.docHistorial)
  const refPrecios = db.collection('catalogo').doc(configuracion.docPrecios)

  const [snapHistorial, snapPrecios] = await Promise.all([refHistorial.get(), refPrecios.get()])
  const historial = snapHistorial.exists ? snapHistorial.data().muestras || {} : {}
  const preciosAnteriores = snapPrecios.exists ? snapPrecios.data().precios || {} : {}

  const preciosNuevos = { ...preciosAnteriores }

  for (const [clave, muestra] of Object.entries(muestrasPorClave)) {
    const previas = historial[clave] || []
    const combinadas = [...previas, muestra].slice(-HISTORIAL_MAX_MUESTRAS)
    historial[clave] = combinadas
    const media = combinadas.reduce((acc, valor) => acc + valor, 0) / combinadas.length
    preciosNuevos[clave] = Math.max(PRECIO_MINIMO, Math.round(media * 10) / 10)
  }

  const fechaActualizacion = new Date().toISOString()
  await Promise.all([
    refHistorial.set({ muestras: historial, fechaActualizacion }),
    refPrecios.set({ precios: preciosNuevos, fechaActualizacion }),
  ])

  const deltasPorClave = calcularDeltasDePrecio(preciosAnteriores, preciosNuevos)
  const preciosPrimeraVezPorClave = {}
  for (const [clave, precioNuevo] of Object.entries(preciosNuevos)) {
    if (preciosAnteriores[clave] == null) {
      preciosPrimeraVezPorClave[clave] = precioNuevo
    }
  }

  const propagaciones = []
  if (Object.keys(deltasPorClave).length > 0) {
    propagaciones.push(
      propagarDeltasAGarajes(configuracion, deltasPorClave),
      propagarDeltasAMercadosAbiertos(tipoCarta, configuracion, deltasPorClave),
    )
  }
  if (Object.keys(preciosPrimeraVezPorClave).length > 0) {
    propagaciones.push(propagarPreciosAbsolutosAGarajes(configuracion, preciosPrimeraVezPorClave))
  }
  if (propagaciones.length > 0) await Promise.all(propagaciones)
}

function calcularDeltasDePrecio(preciosAnteriores, preciosNuevos) {
  const deltas = {}
  for (const [clave, precioNuevo] of Object.entries(preciosNuevos)) {
    const precioAnterior = preciosAnteriores[clave]
    if (precioAnterior == null) continue
    const delta = Math.round((precioNuevo - precioAnterior) * 10) / 10
    if (delta !== 0) deltas[clave] = delta
  }
  return deltas
}

// Recorre todos los garajes aplicando una estrategia de recálculo de precio a
// cada carta válida de la categoría. La estrategia recibe la carta y devuelve
// su nuevo precio, o null si esa carta no debe cambiar. Así una única función
// de recorrido sirve tanto para precios absolutos como para deltas.
async function propagarPreciosAGarajes(configuracion, calcularPrecioCarta) {
  const participacionesSnap = await db.collection('participaciones').get()
  const batch = db.batch()
  let garajesActualizados = 0

  for (const documento of participacionesSnap.docs) {
    const garaje = documento.data().garaje
    const cartasEnGaraje = garaje && garaje[configuracion.coleccionGaraje]
    if (!Array.isArray(cartasEnGaraje)) continue

    let huboCambio = false
    const cartasActualizadas = cartasEnGaraje.map((carta) => {
      if (!carta || !configuracion.esCartaValida(carta)) return carta
      const precioNuevo = calcularPrecioCarta(carta)
      if (precioNuevo == null) return carta
      huboCambio = true
      return { ...carta, precio: precioNuevo }
    })

    if (huboCambio) {
      batch.update(documento.ref, {
        [`garaje.${configuracion.coleccionGaraje}`]: cartasActualizadas,
      })
      garajesActualizados++
    }
  }

  if (garajesActualizados > 0) await batch.commit()
  return garajesActualizados
}

// Aplica un delta a un precio respetando el suelo PRECIO_MINIMO y un decimal.
function aplicarDelta(precioActual, delta) {
  return Math.max(PRECIO_MINIMO, Math.round((Number(precioActual || 0) + delta) * 10) / 10)
}

// Primera vez que una carta tiene precio dinámico: lo asigno como absoluto en
// todos los garajes que ya tengan esa carta (no hay precio previo con el que
// calcular un delta).
function propagarPreciosAbsolutosAGarajes(configuracion, preciosPorClave) {
  return propagarPreciosAGarajes(
    configuracion,
    (carta) => preciosPorClave[configuracion.construirClave(carta)] ?? null,
  )
}

function propagarDeltasAGarajes(configuracion, deltasPorClave) {
  return propagarPreciosAGarajes(configuracion, (carta) => {
    const delta = deltasPorClave[configuracion.construirClave(carta)]
    if (!delta) return null
    return aplicarDelta(carta.precio, delta)
  })
}

// Si no se aplica, dos mercados abiertos a la vez mostrarían precios
// inconsistentes entre sí.
async function propagarDeltasAMercadosAbiertos(tipoCarta, configuracion, deltasPorClave) {
  const mercadosSnap = await db.collection('mercados').where('estado', '==', 'abierto').get()
  if (mercadosSnap.empty) return 0

  const batch = db.batch()
  let mercadosActualizados = 0

  for (const documento of mercadosSnap.docs) {
    const cartas = documento.data().cartas || []
    let huboCambio = false

    const cartasActualizadas = cartas.map((carta) => {
      if (carta.tipoCarta !== tipoCarta) return carta
      if (!configuracion.esCartaValida(carta)) return carta
      const delta = deltasPorClave[configuracion.construirClave(carta)]
      if (!delta) return carta
      huboCambio = true
      return { ...carta, precio: aplicarDelta(carta.precio, delta) }
    })

    if (huboCambio) {
      batch.update(documento.ref, { cartas: cartasActualizadas })
      mercadosActualizados++
    }
  }

  if (mercadosActualizados > 0) await batch.commit()
  return mercadosActualizados
}

// Si una liga falla, registro y sigo: prefiero N-1 ligas con mercado nuevo a
// fallar todas por una. El throw final hace que Scheduler reintente; las
// ligas ya procesadas son idempotentes y no se duplican.
exports.generarMercadoDiario = onSchedule(
  {
    schedule: 'every day 12:05',
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
        console.error(`[Mercado Diario] Liga ${docLiga.id} fallida: ${error.message}`)
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

exports.generarMercadoInicialLiga = onCall(OPCIONES, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
  }
  const email = request.auth.token.email
  const { idLiga } = request.data || {}
  if (!idLiga) {
    throw new HttpsError('invalid-argument', 'Falta idLiga.')
  }

  const ligaSnap = await db.collection('ligas').doc(idLiga).get()
  if (!ligaSnap.exists) {
    throw new HttpsError('not-found', `Liga ${idLiga} no encontrada.`)
  }
  if (ligaSnap.data().correoOrganizador !== email) {
    throw new HttpsError('permission-denied', 'Solo el organizador de la liga puede inicializarla.')
  }

  const resultado = await ejecutarGeneracionMercadoParaLiga(idLiga)
  return { ok: true, ...resultado }
})

// Saneado idéntico al histórico del cliente para que las pujas existentes
// sigan localizables.
function sanitizarEmailParaIdPuja(email) {
  return email.replace(/[.@]/g, '_')
}

// Se ignora la puja sobre idCartaExcluida para que actualizar una puja
// existente no cuente dos veces su importe anterior.
async function sumarComprometidoEnMercado(idMercado, email, idCartaExcluida) {
  const pujasSnap = await db
    .collection('mercados')
    .doc(idMercado)
    .collection('pujas')
    .where('emailUsuario', '==', email)
    .get()
  return pujasSnap.docs.reduce((suma, documento) => {
    const datos = documento.data()
    if (datos.idCarta === idCartaExcluida) return suma
    return suma + Number(datos.cantidad || 0)
  }, 0)
}

exports.registrarPujaCarta = onCall(OPCIONES, async (request) => {
  const email = exigirEmailAutenticado(request)
  const { idLiga, idCarta, cantidad } = request.data || {}
  if (!idLiga || !idCarta) {
    throw new HttpsError('invalid-argument', 'Faltan idLiga o idCarta.')
  }
  const cantidadNumerica = Number(cantidad)
  if (!Number.isFinite(cantidadNumerica) || cantidadNumerica <= 0) {
    throw new HttpsError('invalid-argument', 'La cantidad de la puja debe ser positiva.')
  }

  const idMercado = calcularIdMercado(idLiga, new Date())
  const mercadoSnap = await db.collection('mercados').doc(idMercado).get()
  if (!mercadoSnap.exists || mercadoSnap.data().estado !== 'abierto') {
    throw new HttpsError('failed-precondition', 'El mercado de hoy no está abierto.')
  }

  const cartas = mercadoSnap.data().cartas || []
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
  const comprometidoEnOtras = await sumarComprometidoEnMercado(idMercado, email, idCarta)
  if (cantidadNumerica + comprometidoEnOtras > presupuestoActual) {
    throw new HttpsError('failed-precondition', 'Presupuesto insuficiente para esta puja.')
  }

  const idPuja = `${sanitizarEmailParaIdPuja(email)}_${idCarta}`
  await db.collection('mercados').doc(idMercado).collection('pujas').doc(idPuja).set({
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

exports.eliminarPujaPropia = onCall(OPCIONES, async (request) => {
  const email = exigirEmailAutenticado(request)
  const { idLiga, idCarta } = request.data || {}
  if (!idLiga || !idCarta) {
    throw new HttpsError('invalid-argument', 'Faltan idLiga o idCarta.')
  }

  const idMercado = calcularIdMercado(idLiga, new Date())
  const idPuja = `${sanitizarEmailParaIdPuja(email)}_${idCarta}`
  const refPuja = db.collection('mercados').doc(idMercado).collection('pujas').doc(idPuja)
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
  const mercadosSnapshot = await db.collection('mercados').where('idLiga', '==', idLiga).get()
  let pujasEliminadas = 0
  for (const documentoMercado of mercadosSnapshot.docs) {
    const pujasSnapshot = await documentoMercado.ref
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

exports.eliminarMisPujasDeLiga = onCall(OPCIONES, async (request) => {
  const email = exigirEmailAutenticado(request)
  const { idLiga } = request.data || {}
  if (!idLiga) {
    throw new HttpsError('invalid-argument', 'Falta idLiga.')
  }

  const batch = db.batch()
  const pujasEliminadas = await agregarBorradoPujasUsuario(batch, idLiga, email)
  await batch.commit()

  return { ok: true, pujasEliminadas }
})

// Exportado para que el módulo de cláusulas pueda localizar el mercado actual
// sin duplicar la lógica de fechas.
module.exports.calcularIdMercado = calcularIdMercado
module.exports.agregarBorradoPujasUsuario = agregarBorradoPujasUsuario
