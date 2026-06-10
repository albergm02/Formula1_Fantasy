/**
 * Ciclo de vida del mercado diario y precios dinámicos de pilotos.
 *
 * Cada día, a las 06:00 UTC, se genera un mercado por liga: se selecciona una
 * muestra aleatoria del catálogo (con exclusiones de cartas ya fichadas), se
 * cierra el mercado del día anterior resolviendo sus pujas y se aplica el
 * impacto de esas pujas sobre los precios de los pilotos.
 *
 *
 * Esquema Firestore → `mercados/{idLiga}_{YYYY-MM-DD}`:
 * ```
 * {
 *   idLiga: string,
 *   estado: 'abierto' | 'cerrado',
 *   fechaCierre: string (ISO),     // siguiente día a las 06:00 UTC
 *   cartas: [ { id, nombre, tipoCarta, precio, imagen, ... } ]
 * }
 * ```
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { FieldValue } = require('firebase-admin/firestore')

const { db } = require('../comun/firebase')
const { OPCIONES, REGION } = require('../comun/constantes')
const { exigirEmailAutenticado } = require('../comun/autenticacion')

const {
  cargarCatalogo,
  cargarPreciosPilotos,
  aplicarPreciosDinamicosACatalogo,
  seleccionarCartasDiarias,
} = require('../dominio/mercado')
const { seleccionarPujasGanadoras } = require('../dominio/pujas')

/* ─── Constantes de precios dinámicos ───────────────────────────────────── */

/* Número de muestras que conservo del histórico para promediar el precio.*/
const HISTORIAL_MAX_MUESTRAS = 5

/* Penalización aplicada a cartas que salen al mercado pero nadie puja. */
const FACTOR_DESINTERES = 0.95

/* Suelo del precio para que ninguna carta se vuelva gratuita. */
const PRECIO_MINIMO = 5

/* ─── Identificación temporal del mercado ───────────────────────────────── */

/**
 * Calcula el ID del mercado para una liga y una fecha concretas.
 *
 * Uso el formato `'{idLiga}_{YYYY-MM-DD}'` porque me da idempotencia natural:
 * si la función se ejecuta dos veces el mismo día, ambas resuelven el mismo
 * ID y el segundo `set` no duplica nada.
 *
 * @param {string} idLiga
 * @param {Date} fecha
 * @returns {string} Ej: `'xi060FGM9iG33KvBuBQv_2026-04-14'`.
 */
function calcularIdMercado(idLiga, fecha) {
  const fechaStr = fecha.toISOString().split('T')[0]
  return `${idLiga}_${fechaStr}`
}

/**
 * Calcula la fecha de cierre del mercado: día siguiente a las 06:00 UTC,
 * que coincide con el momento en el que se generará el mercado del día
 * siguiente.
 */
function calcularFechaCierre(fechaApertura) {
  const cierre = new Date(fechaApertura)
  cierre.setUTCDate(cierre.getUTCDate() + 1)
  cierre.setUTCHours(6, 0, 0, 0)
  return cierre
}

/* ─── Resolución de pujas al cerrar el mercado ──────────────────────────── */

/**
 * Resuelve todas las pujas de un mercado cerrado.
 *
 * Por cada carta con pujas, la mayor gana: el ganador la suma a su garaje y
 * se le descuenta el importe del presupuesto. Las pujas perdedoras se
 * descartan silenciosamente (no se reembolsa: el dinero comprometido nunca se
 * dedujo del presupuesto real, solo se "reservaba" a nivel UI).
 *
 * Agrupo las cartas ganadas por participante para no actualizar el mismo
 * documento varias veces dentro del mismo batch (cada `update` sobrescribiría
 * al anterior).
 *
 * @param {string} idMercado
 */
async function resolverPujasMercado(idMercado) {
  const pujasSnapshot = await db.collection('mercados').doc(idMercado).collection('pujas').get()
  if (pujasSnapshot.empty) return

  /* Necesito los datos completos de cada carta (imagen, número, variante…)
   * para almacenarlos en el garaje del ganador. La puja solo guarda el ID. */
  const mercadoSnap = await db.collection('mercados').doc(idMercado).get()
  const cartasMercado = mercadoSnap.exists ? mercadoSnap.data().cartas || [] : []
  const mapaCartas = {}
  for (const carta of cartasMercado) {
    mapaCartas[carta.id] = carta
  }

  const pujasPorCarta = seleccionarPujasGanadoras(pujasSnapshot.docs.map((doc) => doc.data()))

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

    /* Migración del formato antiguo (coche singular) al nuevo (coches[]).
     * Lo mantengo aquí porque sigo viendo participaciones antiguas en
     * producción. Cuando todas estén migradas se podrá eliminar. */
    if (garaje.coche !== undefined || !garaje.coches) {
      garaje.coches = garaje.coche ? [garaje.coche] : []
      delete garaje.coche
    }

    const emailUsuario = participacion.email_usuario
    const nombreUsuario = participacion.nombre_usuario || emailUsuario

    for (const { idCarta, pujaGanadora } of cartasGanadas) {
      const { cantidad, tipoCarta } = pujaGanadora

      /* Si el presupuesto ya no llega tras la última carta ganada en esta
       * misma resolución, descarto la siguiente. No "reembolso" porque la
       * puja original nunca tocó el presupuesto real. */
      if (cantidad > presupuestoRestante) continue

      const cartaCompleta = mapaCartas[idCarta]
      const propiedadesClausula = {
        clausulaInvertida: 0,
        fechaAdquisicion: new Date().toISOString(),
      }
      const cartaGanada = cartaCompleta
        ? {
            ...cartaCompleta,
            tipo: tipoCarta,
            precioCompra: cantidad,
            instancia_id: Date.now() + Math.random(),
            ...propiedadesClausula,
          }
        : {
            id: idCarta,
            nombre: pujaGanadora.nombreCarta,
            tipoCarta,
            tipo: tipoCarta,
            precio: pujaGanadora.precioCarta,
            precioCompra: cantidad,
            instancia_id: Date.now() + Math.random(),
            ...propiedadesClausula,
          }

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

  /* Tras resolver las pujas, actualizo el histórico de precios y propago el
   * delta al resto de garajes y mercados abiertos. */
  await actualizarPreciosTrasResolucion(cartasMercado, pujasPorCarta)
}

/* ─── Generación del mercado del día ────────────────────────────────────── */

/**
 * Recopila las exclusiones del próximo mercado:
 *  - El mismo piloto puede aparecer en otras variantes).
 *  - IDs de coches y potenciadores que ya tiene algún participante.
 *
 * Se debe de evitar ofrecer una carta que nadie podría comprar porque ya tiene dueño
 * en la liga.
 *
 * @param {string} idLiga
 * @returns {Promise<{ clavesPilotoBloqueadas: Set<string>, idsCartas: Set<string> }>}
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
 * Genera el mercado diario para UNA liga específica.
 *
 * Es idempotente: si el mercado de hoy ya existe, lo respeta y devuelve un
 * resumen indicando que se omitió.
 *
 * @param {string} idLiga
 * @returns {Promise<Object>} ID del mercado y total de cartas.
 */
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

  /* Si el mercado de ayer sigue abierto, lo resuelvo ANTES de crear el de hoy.
   * Esto cierra el ciclo: pujas ganadoras → garajes → precios dinámicos. */
  const ayer = new Date(ahora)
  ayer.setUTCDate(ayer.getUTCDate() - 1)
  const idMercadoAyer = calcularIdMercado(idLiga, ayer)
  const mercadoAyer = await db.collection('mercados').doc(idMercadoAyer).get()

  if (mercadoAyer.exists && mercadoAyer.data().estado === 'abierto') {
    await resolverPujasMercado(idMercadoAyer)
    await db.collection('mercados').doc(idMercadoAyer).update({ estado: 'cerrado' })
  }

  const catalogoBase = await cargarCatalogo(db)
  const preciosDinamicos = await cargarPreciosPilotos(db)
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

/* ─── Precios dinámicos derivados de las pujas ──────────────────────────── */

/**
 * Por cada carta de piloto del mercado recién resuelto, calcula una muestra
 * de precio:
 *  - Si hubo puja ganadora → la cantidad pagada.
 *  - Si quedó desierta → `precio * FACTOR_DESINTERES` (penalización suave).
 *
 * Después delega en `fusionarMuestrasYRecalcularPrecios` para agregar al
 * histórico y propagar los nuevos precios.
 */
async function actualizarPreciosTrasResolucion(cartasMercado, pujasPorCarta) {
  const muestrasPorClave = {}
  for (const carta of cartasMercado) {
    if (carta.tipoCarta !== 'piloto' || carta.numero == null || !carta.variante) continue
    const clave = `${carta.numero}|${carta.variante}`
    const pujaGanadora = pujasPorCarta[carta.id]
    const precioMuestra = pujaGanadora
      ? Number(pujaGanadora.cantidad)
      : Number(carta.precio) * FACTOR_DESINTERES
    muestrasPorClave[clave] = Math.round(precioMuestra * 10) / 10
  }

  if (Object.keys(muestrasPorClave).length === 0) return

  await fusionarMuestrasYRecalcularPrecios(muestrasPorClave)
}

/**
 * Agrega las muestras nuevas al histórico (recorto a las últimas
 * HISTORIAL_MAX_MUESTRAS), recalculo el precio dinámico como media móvil y
 * persisto ambos documentos. Luego propago los deltas a garajes y mercados.
 *
 * @param {Object<string, number>} muestrasPorClave - `{ "<numero>|<variante>": precioMuestra }`.
 */
async function fusionarMuestrasYRecalcularPrecios(muestrasPorClave) {
  const refHistorial = db.collection('catalogo').doc('historial_pujas')
  const refPrecios = db.collection('catalogo').doc('precios_pilotos')

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

  /* Distingo dos tipos de propagación:
   *  - Delta (precio nuevo - anterior) → cuando ya existía precio previo.
   *  - Precio absoluto → cuando se establece por primera vez (no hay delta
   *    con el que mover el precio existente del garaje). */
  const deltasPorClave = calcularDeltasPrecioPiloto(preciosAnteriores, preciosNuevos)
  const preciosPrimeraVezPorClave = {}
  for (const [clave, precioNuevo] of Object.entries(preciosNuevos)) {
    if (preciosAnteriores[clave] == null) {
      preciosPrimeraVezPorClave[clave] = precioNuevo
    }
  }

  const propagaciones = []
  if (Object.keys(deltasPorClave).length > 0) {
    propagaciones.push(
      propagarDeltasAGarajesDePilotos(deltasPorClave),
      propagarDeltasAMercadosAbiertos(deltasPorClave),
    )
  }
  if (Object.keys(preciosPrimeraVezPorClave).length > 0) {
    propagaciones.push(propagarPreciosAbsolutosAGarajes(preciosPrimeraVezPorClave))
  }
  if (propagaciones.length > 0) await Promise.all(propagaciones)
}

/**
 * Calcula los deltas (precioNuevo - precioAnterior) por clave de piloto.
 * Las claves sin precio previo se omiten (las maneja la propagación absoluta).
 */
function calcularDeltasPrecioPiloto(preciosAnteriores, preciosNuevos) {
  const deltas = {}
  for (const [clave, precioNuevo] of Object.entries(preciosNuevos)) {
    const precioAnterior = preciosAnteriores[clave]
    if (precioAnterior == null) continue
    const delta = Math.round((precioNuevo - precioAnterior) * 10) / 10
    if (delta !== 0) deltas[clave] = delta
  }
  return deltas
}

/**
 * Para pilotos con precio dinámico por primera vez, asigna el precio de forma
 * absoluta en todos los garajes que ya tengan esa carta. Sin esto, el primer
 * precio se quedaría solo en el catálogo y los garajes existentes
 * conservarían el precio base.
 */
async function propagarPreciosAbsolutosAGarajes(preciosPorClave) {
  const participacionesSnap = await db.collection('participaciones').get()
  const batch = db.batch()
  let garajesActualizados = 0

  for (const documento of participacionesSnap.docs) {
    const garaje = documento.data().garaje
    if (!garaje || !Array.isArray(garaje.pilotos)) continue

    let huboCambio = false
    const pilotosActualizados = garaje.pilotos.map((piloto) => {
      if (piloto == null || piloto.numero == null || !piloto.variante) return piloto
      const nuevoPrecio = preciosPorClave[`${piloto.numero}|${piloto.variante}`]
      if (nuevoPrecio == null) return piloto
      huboCambio = true
      return { ...piloto, precio: nuevoPrecio }
    })

    if (huboCambio) {
      batch.update(documento.ref, { 'garaje.pilotos': pilotosActualizados })
      garajesActualizados++
    }
  }

  if (garajesActualizados > 0) await batch.commit()
  return garajesActualizados
}

/**
 * Aplica los deltas de precio a todas las cartas equivalentes (mismo
 * número y variante) en los garajes de cualquier liga. Mantengo PRECIO_MINIMO
 * como suelo para no llegar a precios absurdos.
 */
async function propagarDeltasAGarajesDePilotos(deltasPorClave) {
  const participacionesSnap = await db.collection('participaciones').get()
  const batch = db.batch()
  let garajesActualizados = 0

  for (const documento of participacionesSnap.docs) {
    const garaje = documento.data().garaje
    if (!garaje || !Array.isArray(garaje.pilotos)) continue

    let huboCambio = false
    const pilotosActualizados = garaje.pilotos.map((piloto) => {
      if (piloto == null || piloto.numero == null || !piloto.variante) return piloto
      const delta = deltasPorClave[`${piloto.numero}|${piloto.variante}`]
      if (!delta) return piloto
      huboCambio = true
      const precioNuevo = Math.max(
        PRECIO_MINIMO,
        Math.round((Number(piloto.precio || 0) + delta) * 10) / 10,
      )
      return { ...piloto, precio: precioNuevo }
    })

    if (huboCambio) {
      batch.update(documento.ref, { 'garaje.pilotos': pilotosActualizados })
      garajesActualizados++
    }
  }

  if (garajesActualizados > 0) await batch.commit()
  return garajesActualizados
}

/**
 * Aplica los deltas a los pilotos que están a la venta en mercados aún
 * abiertos. Si no hago esto, dos mercados abiertos a la vez mostrarían
 * precios inconsistentes.
 */
async function propagarDeltasAMercadosAbiertos(deltasPorClave) {
  const mercadosSnap = await db.collection('mercados').where('estado', '==', 'abierto').get()
  if (mercadosSnap.empty) return 0

  const batch = db.batch()
  let mercadosActualizados = 0

  for (const documento of mercadosSnap.docs) {
    const cartas = documento.data().cartas || []
    let huboCambio = false

    const cartasActualizadas = cartas.map((carta) => {
      if (carta.tipoCarta !== 'piloto' || carta.numero == null || !carta.variante) return carta
      const delta = deltasPorClave[`${carta.numero}|${carta.variante}`]
      if (!delta) return carta
      huboCambio = true
      const precioNuevo = Math.max(
        PRECIO_MINIMO,
        Math.round((Number(carta.precio || 0) + delta) * 10) / 10,
      )
      return { ...carta, precio: precioNuevo }
    })

    if (huboCambio) {
      batch.update(documento.ref, { cartas: cartasActualizadas })
      mercadosActualizados++
    }
  }

  if (mercadosActualizados > 0) await batch.commit()
  return mercadosActualizados
}

/* ─── Triggers ──────────────────────────────────────────────────────────── */

/**
 * Schedule diario — genera el mercado para TODAS las ligas a las 06:00 UTC.
 *
 * Si una liga falla, registro el error y continúo con el resto: prefiero
 * tener "N-1" ligas con mercado nuevo a fallar todas por una. Al final lanzo
 * un error para que Cloud Scheduler reintente la ejecución completa; las
 * ligas ya procesadas son idempotentes y no se duplican.
 */
exports.generarMercadoDiario = onSchedule(
  {
    schedule: 'every day 06:00',
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

/**
 * Callable — genera el primer mercado de una liga recién creada.
 *
 * Lo invoca el cliente justo después de `crearDocumentoLiga`, para que el
 * organizador entre al mercado sin esperar al schedule diario. Valido el
 * permiso comparando el correo del token con `correoOrganizador` de la liga.
 */
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

/* ─── Pujas (callables) ─────────────────────────────────────────────────── */

/* Convierto el correo en una clave segura para usar en el ID del documento.
 * Tiene que coincidir con el saneado del cliente histórico para que las
 * pujas existentes sigan localizables y para que `registrarPuja` y
 * `eliminarPujaPropia` apunten al mismo documento. */
function sanitizarEmailParaIdPuja(email) {
  return email.replace(/[.@]/g, '_')
}

/**
 * Suma el dinero comprometido por el usuario en el mismo mercado, ignorando
 * la puja sobre `idCartaExcluida` para que actualizar una puja existente no
 * cuente dos veces el importe anterior.
 */
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

/**
 * Callable — registra o actualiza una puja del usuario sobre una carta del
 * mercado activo. Recalculo el precio mínimo y el presupuesto disponible
 * desde Firestore para que un cliente manipulado no pueda pujar más que su
 * presupuesto real ni por debajo del precio base actual.
 *
 * @param {{ idLiga: string, idCarta: string, cantidad: number }} datos
 */
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

/**
 * Callable — elimina la puja propia del usuario sobre una carta del mercado.
 * Solo permito borrar la puja cuyo documento contiene el correo del invocador
 * para evitar que un usuario malicioso retire pujas ajenas.
 */
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

/* Exporto `calcularIdMercado` para que el módulo de cláusulas pueda
 * localizar el mercado actual sin duplicar la lógica de fechas. */
module.exports.calcularIdMercado = calcularIdMercado
