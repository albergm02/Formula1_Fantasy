const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')

const {
  recopilarDatosGranPremio,
  obtenerGranPremiosFinalizados,
} = require('./servicioOpenF1Server')
const { calcularPuntuacionGaraje, calcularFactorJornada } = require('./puntuacionServer')
const { calcularSinergias, aplicarSinergia } = require('./sinergiaServer')
const {
  cargarCatalogo,
  cargarPreciosPilotos,
  aplicarPreciosDinamicosACatalogo,
  seleccionarCartasDiarias,
} = require('./mercadoServer')
const { seleccionarPujasGanadoras } = require('./pujasServer')

initializeApp()

const db = getFirestore()
const TEMPORADA_ACTUAL = 2026

const REGION = 'europe-west1'
const OPCIONES = { region: REGION, enforceAppCheck: true }
const OPCIONES_PUBLICAS = { region: REGION, invoker: 'public', enforceAppCheck: true }
const HORAS_PERIODO_GRACIA = 48
const DIAS_BLOQUEO_CAMBIO_CORREO = 7

/**
 * Convierte la puntuación total de una jornada en un premio económico (en M).
 * Conversión: 10 puntos equivalen a 1M (108 pts → 10.8M).
 * @param {number} puntosJornada - Puntos obtenidos por el participante en la jornada.
 * @returns {number} Premio en millones, redondeado a un decimal.
 */
function calcularPremioJornada(puntosJornada) {
  const premio = (puntosJornada || 0) / 10
  return Math.round(premio * 10) / 10
}

/**
 * Extrae el número de piloto y la variante a partir del ID de carta.
 * @param {string} idCarta - Ej: '1_qualy', '44_carrera', '3_todo_terreno'.
 * @returns {{ numero: string, variante: string }}
 */
function descomponerIdCarta(idCarta) {
  const partes = idCarta.split('_')
  const numero = partes[0]
  const variante = partes.slice(1).join('_')
  return { numero, variante }
}

/**
 * Construye el mapa de factores por ID de carta de piloto.
 * Usa los datos reales de OpenF1 y la variante de cada piloto del garaje.
 * @param {Array} pilotos - Pilotos del garaje del participante.
 * @param {Object} actuacionesPorPiloto - { numeroPiloto: { posicionQualy, posicionCarrera, posicionSalida } }
 * @param {Object} condiciones - { llovio, numeroDNFs, numeroSafetyCarActivos, numeroVirtualSafetyCarActivos }
 * @returns {{ factores: Object, detalles: Object }}
 */
function construirFactoresPorPiloto(pilotos, actuacionesPorPiloto, condiciones) {
  const factores = {}
  const detalles = {}

  for (const piloto of pilotos) {
    const { numero, variante } = descomponerIdCarta(piloto.id)
    const actuacion = actuacionesPorPiloto[numero] || {
      posicionQualy: 20,
      posicionCarrera: 20,
      posicionSalida: 20,
    }

    factores[piloto.id] = calcularFactorJornada(actuacion, condiciones, variante)
    detalles[piloto.id] = { variante, actuacion }
  }

  return { factores, detalles }
}

/* ─── Cloud Function ────────────────────────────────────────────────────── */

/**
 * Lógica pura del procesamiento de jornada. La invoca el disparador programado
 * `procesarJornadaSemanal` una vez concluido el fin de semana de Fórmula 1.
 * Es idempotente: si el último Gran Premio con datos ya está en `jornadas`,
 * no repite los cálculos.
 * @returns {Promise<Object>} Resumen del resultado.
 */
async function ejecutarProcesarJornada() {
  // Buscamos el GP más reciente con datos disponibles en OpenF1
  const candidatos = await obtenerGranPremiosFinalizados(TEMPORADA_ACTUAL)
  if (candidatos.length === 0) {
    console.log('[Jornada] No hay Gran Premio finalizado para procesar.')
    return { ok: false, motivo: 'sin_gp_finalizado' }
  }

  let granPremio = null
  let actuacionesPorPiloto = null
  let condiciones = null
  const omitidos = []

  for (const candidato of candidatos) {
    const idCandidato = `gp_${candidato.meeting_key}`
    const yaProcesada = await db.collection('jornadas').doc(idCandidato).get()
    if (yaProcesada.exists) {
      // Si el más reciente con datos ya está procesado, no rebobinamos más.
      console.log(`[Jornada] ${idCandidato} ya fue procesada previamente. Omitida.`)
      return { ok: false, motivo: 'jornada_ya_procesada', idJornada: idCandidato }
    }

    try {
      const datos = await recopilarDatosGranPremio(candidato.meeting_key)
      if (!datos.actuacionesPorPiloto || Object.keys(datos.actuacionesPorPiloto).length === 0) {
        omitidos.push({ meeting_key: candidato.meeting_key, motivo: 'sin_actuaciones' })
        continue
      }
      granPremio = candidato
      actuacionesPorPiloto = datos.actuacionesPorPiloto
      condiciones = datos.condiciones
      break
    } catch (error) {
      console.warn(
        `[Jornada] GP ${candidato.meeting_key} (${candidato.meeting_name}) sin datos en OpenF1: ${error.message}. Probando el anterior.`,
      )
      omitidos.push({
        meeting_key: candidato.meeting_key,
        nombre: candidato.meeting_name,
        motivo: error.message,
      })
    }
  }

  if (!granPremio) {
    console.log('[Jornada] Ningún GP finalizado tiene datos disponibles en OpenF1.')
    return { ok: false, motivo: 'sin_datos_openf1', omitidos }
  }

  const idJornada = `gp_${granPremio.meeting_key}`

  const todasParticipaciones = await db.collection('participaciones').get()
  const batch = db.batch()
  let participacionesProcesadas = 0

  for (const documento of todasParticipaciones.docs) {
    const participacion = documento.data()
    const garaje = participacion.garaje

    const pilotosEquipados = garaje
      ? (garaje.pilotos || []).filter((p) => p.equipado !== false)
      : []

    if (!garaje || pilotosEquipados.length === 0) {
      continue
    }

    const { factores: factoresPorPiloto, detalles: detallesPorPiloto } = construirFactoresPorPiloto(
      pilotosEquipados,
      actuacionesPorPiloto,
      condiciones,
    )

    const resultadoGaraje = calcularPuntuacionGaraje(garaje, factoresPorPiloto)

    for (const pilotoDesglose of resultadoGaraje.desglose.pilotos) {
      const detalle = detallesPorPiloto[pilotoDesglose.id]
      if (detalle) {
        pilotoDesglose.variante = detalle.variante
        pilotoDesglose.actuacion = detalle.actuacion
      }
    }

    const { multiplicadorTotal, sinergias } = calcularSinergias(garaje)
    const puntosJornada = aplicarSinergia(resultadoGaraje.puntosTotal, multiplicadorTotal)

    const puntosAcumulados = (participacion.puntos || 0) + puntosJornada
    const premioJornada = calcularPremioJornada(puntosJornada)
    const presupuestoActualizado =
      Math.round(((participacion.presupuesto || 0) + premioJornada) * 100) / 100

    const desgloseParticipante = {
      nombreGranPremio: granPremio.meeting_name,
      puntosJornada,
      premioJornada,
      multiplicadorSinergia: multiplicadorTotal,
      sinergias,
      condiciones,
      desglose: resultadoGaraje.desglose,
    }

    batch.update(documento.ref, {
      puntos: puntosAcumulados,
      presupuesto: presupuestoActualizado,
      ultimaJornada: desgloseParticipante,
    })

    participacionesProcesadas++
  }

  batch.set(db.collection('jornadas').doc(idJornada), {
    meetingKey: granPremio.meeting_key,
    nombreGranPremio: granPremio.meeting_name,
    fechaCarrera: granPremio.date_end,
    fechaProcesamiento: new Date().toISOString(),
    temporada: TEMPORADA_ACTUAL,
    condiciones,
    actuacionesPorPiloto,
  })

  await batch.commit()

  console.log(
    `[Jornada] ${idJornada} (${granPremio.meeting_name}) procesada. ${participacionesProcesadas} participaciones.`,
  )

  return {
    ok: true,
    idJornada,
    nombreGranPremio: granPremio.meeting_name,
    participacionesProcesadas,
  }
}

/**
 * Cloud Function programada — procesa la jornada del último GP finalizado.
 * Se ejecuta cada lunes a las 02:00 UTC, una vez concluido el fin de semana de F1.
 * Es idempotente: si la jornada ya fue procesada, no repite cálculos.
 *
 * Si la función lanza un error (p.ej. OpenF1 no responde), Cloud Scheduler
 * la reintentará automáticamente hasta 3 veces con una espera mínima de
 * 30 minutos entre intentos, sin consumir tiempo de ejecución esperando.
 */
exports.procesarJornadaSemanal = onSchedule(
  {
    schedule: 'every monday 02:00',
    timeZone: 'UTC',
    region: 'europe-west1',
    retryCount: 3,
    minBackoffSeconds: 1800,
  },
  async () => {
    const resultado = await ejecutarProcesarJornada()
    if (!resultado.ok && resultado.motivo !== 'jornada_ya_procesada') {
      throw new Error(`[Jornada] Procesamiento fallido: ${resultado.motivo}`)
    }
  },
)

/* ═══════════════════════════════════════════════════════════════════════════
   MERCADO DIARIO — Generación automática de cartas disponibles cada día.
   ═══════════════════════════════════════════════════════════════════════════

   Flujo:
   1. Se ejecuta diariamente a las 06:00 UTC (Cloud Scheduler).
   2. Para CADA liga existente, genera un mercado independiente.
   3. Selecciona una muestra aleatoria diaria (8 pilotos, 2 coches, 8 potenciadores).
   4. Cierra el mercado del día anterior de esa liga (si existe).
   5. Crea un nuevo documento en 'mercados/{idLiga}_{YYYY-MM-DD}' con estado 'abierto'.

   Esquema Firestore → mercados/{idLiga}_{YYYY-MM-DD}:
   {
     idLiga: string,
     estado: 'abierto' | 'cerrado',
     fechaCierre: string (ISO),   ← siguiente día a las 06:00 UTC
     cartas: [ { id, nombre, tipoCarta, precio, imagen, ... } ]
   }
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Calcula el ID del mercado para una liga y una fecha.
 * Formato: '{idLiga}_{YYYY-MM-DD}' para mercados diarios por liga.
 * @param {string} idLiga
 * @param {Date} fecha
 * @returns {string} Ej: 'xi060FGM9iG33KvBuBQv_2026-04-14'
 */
function calcularIdMercado(idLiga, fecha) {
  const fechaStr = fecha.toISOString().split('T')[0]
  return `${idLiga}_${fechaStr}`
}

/**
 * Calcula la fecha de cierre del mercado: el día siguiente a las 06:00 UTC.
 * @param {Date} fechaApertura
 * @returns {Date}
 */
function calcularFechaCierre(fechaApertura) {
  const cierre = new Date(fechaApertura)
  cierre.setUTCDate(cierre.getUTCDate() + 1)
  cierre.setUTCHours(6, 0, 0, 0)
  return cierre
}

/**
 * Resuelve todas las pujas de un mercado cerrado.
 * Para cada carta con pujas, la mayor puja gana: se añade la carta al garaje
 * del ganador y se le descuenta el importe del presupuesto.
 * Respeta los límites del garaje: máx. 1 coche y 2 pilotos.
 * @param {string} idMercado - ID del mercado cuyas pujas se resuelven.
 */
async function resolverPujasMercado(idMercado) {
  const pujasSnapshot = await db.collection('mercados').doc(idMercado).collection('pujas').get()

  if (pujasSnapshot.empty) return

  /* Leer el documento del mercado para obtener los datos completos de cada carta */
  const mercadoSnap = await db.collection('mercados').doc(idMercado).get()
  const cartasMercado = mercadoSnap.exists ? mercadoSnap.data().cartas || [] : []
  const mapaCartas = {}
  for (const carta of cartasMercado) {
    mapaCartas[carta.id] = carta
  }

  /* Agrupar pujas por idCarta y encontrar la mayor de cada una */
  const pujasPorCarta = seleccionarPujasGanadoras(pujasSnapshot.docs.map((doc) => doc.data()))

  /* ── Agrupar cartas ganadas por participante para evitar sobrescrituras en el batch ── */
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

    /* Migrar formato antiguo (coche singular) al nuevo (coches array) */
    if (garaje.coche !== undefined || !garaje.coches) {
      garaje.coches = garaje.coche ? [garaje.coche] : []
      delete garaje.coche
    }

    /* Resolver nombre del usuario directamente desde la participación,
     * que ya almacena nombre_usuario al crearse o actualizarse. */
    const emailUsuario = participacion.email_usuario
    const nombreUsuario = participacion.nombre_usuario || emailUsuario

    for (const { idCarta, pujaGanadora } of cartasGanadas) {
      const { cantidad, tipoCarta } = pujaGanadora

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

  await actualizarPreciosTrasResolucion(cartasMercado, pujasPorCarta)
}

/**
 * Recopila las exclusiones aplicables al próximo mercado de la liga:
 *  - Claves «<numero>|<variante>» de pilotos ya fichados: solo se bloquea
 *    esa combinación concreta. El mismo piloto sigue pudiendo aparecer en
 *    otras variantes.
 *  - IDs de coches y potenciadores ocupados.
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
 * Crea un documento en 'mercados/{idLiga}_{YYYY-MM-DD}'.
 * Es idempotente: si el mercado de hoy ya existe para esa liga, no lo recrea.
 * @param {string} idLiga - ID de la liga en Firestore.
 * @param {Object} [opciones]
 * @param {boolean} [opciones.forzar=false] - Si true, borra el mercado de hoy
 *        (y sus pujas) antes de regenerarlo. Útil para testing.
 * @returns {Promise<Object>} Resultado con el ID del mercado y el total de cartas.
 */
async function ejecutarGeneracionMercadoParaLiga(idLiga, opciones = {}) {
  const { forzar = false } = opciones
  const ahora = new Date()
  const idMercadoHoy = calcularIdMercado(idLiga, ahora)

  /* ── Idempotencia: si el mercado de hoy ya existe para esta liga, no lo recreamos ── */
  const mercadoExistente = await db.collection('mercados').doc(idMercadoHoy).get()
  if (mercadoExistente.exists) {
    if (!forzar) {
      return {
        mensaje: `El mercado ${idMercadoHoy} ya fue generado previamente.`,
        idMercado: idMercadoHoy,
        omitido: true,
      }
    }
    /* Modo forzado: borrar mercado existente y sus pujas antes de regenerar */
    const pujasSnap = await db.collection('mercados').doc(idMercadoHoy).collection('pujas').get()
    const batchBorrado = db.batch()
    pujasSnap.docs.forEach((doc) => batchBorrado.delete(doc.ref))
    batchBorrado.delete(mercadoExistente.ref)
    await batchBorrado.commit()
  }

  /* ── Cerrar el mercado del día anterior de esta liga (si existe y sigue abierto) ── */
  const ayer = new Date(ahora)
  ayer.setUTCDate(ayer.getUTCDate() - 1)
  const idMercadoAyer = calcularIdMercado(idLiga, ayer)
  const mercadoAyer = await db.collection('mercados').doc(idMercadoAyer).get()

  if (mercadoAyer.exists && mercadoAyer.data().estado === 'abierto') {
    await resolverPujasMercado(idMercadoAyer)
    await db.collection('mercados').doc(idMercadoAyer).update({ estado: 'cerrado' })
  }

  /* ── Cargar catálogo (auto-seed si falta) y aplicar precios dinámicos por puja ── */
  const catalogoBase = await cargarCatalogo(db)
  const preciosDinamicos = await cargarPreciosPilotos(db)
  const catalogoConPrecios = aplicarPreciosDinamicosACatalogo(catalogoBase, preciosDinamicos)

  /* ── Recopilar cartas ya fichadas en la liga para excluirlas ── */
  const exclusionesLiga = await recopilarCartasFichadasEnLiga(idLiga)
  const cartasDelDia = seleccionarCartasDiarias(catalogoConPrecios, exclusionesLiga)

  /* ── Crear documento del mercado de hoy para esta liga ── */
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

/**
 * Cloud Function programada — se ejecuta cada día a las 06:00 UTC.
 * Genera el mercado diario para TODAS las ligas existentes.
 *
 * Si alguna liga falla tras sus reintentos inmediatos, la función lanza
 * un error para que Cloud Scheduler la reintente completa tras 30 minutos
 * (hasta 3 veces). Las ligas ya procesadas son idempotentes y no se duplican.
 */
exports.generarMercadoDiario = onSchedule(
  {
    schedule: 'every day 06:00',
    timeZone: 'UTC',
    region: 'europe-west1',
    retryCount: 3,
    minBackoffSeconds: 1800,
  },
  async () => {
    const todasLigas = await db.collection('ligas').get()
    const resultados = []
    const ligasFallidas = []

    for (const docLiga of todasLigas.docs) {
      try {
        const resultado = await ejecutarGeneracionMercadoParaLiga(docLiga.id)
        resultados.push(resultado)
      } catch (error) {
        console.error(`[Mercado Diario] Liga ${docLiga.id} fallida: ${error.message}`)
        resultados.push({ idLiga: docLiga.id, error: error.message })
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

/* ═══════════════════════════════════════════════════════════════════════════
   CALLABLES DE ADMINISTRACIÓN — Disparo manual desde la UI
   ───────────────────────────────────────────────────────────────────────────
   Permiten al administrador (flag `esAdministrador` en `usuarios/{uid}`)
   disparar manualmente el mercado, la resolución de pujas y el procesamiento
   de la jornada desde AdministracionView.vue, sin esperar al schedule.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Verifica que el invocador esté autenticado y sea administrador.
 * Usa el UID del token para consultar `usuarios/{uid}` directamente,
 * sin depender del campo email del token.
 * Lanza HttpsError en caso contrario.
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 */
async function exigirAdministrador(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
  }
  const uid = request.auth.uid
  const usuarioSnap = await db.collection('usuarios').doc(uid).get()
  if (!usuarioSnap.exists || usuarioSnap.data().esAdministrador !== true) {
    throw new HttpsError('permission-denied', 'Permisos de administrador requeridos.')
  }
}

/**
 * Callable — genera el primer mercado de una liga recién creada.
 * Lo invoca el frontend tras `crearDocumentoLiga`. Solo lo puede llamar el
 * administrador de esa liga. Es idempotente: si el mercado de hoy ya existe,
 * no lo recrea.
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

/**
 * Borrado atómico en cascada de una liga: participaciones (con sus garajes),
 * mercados con sus pujas, eventos de actividad, desvinculación del array
 * `ligasIds` de cada usuario afectado y el propio documento de la liga.
 * Toda la operación se ejecuta en un único `batch.commit()`.
 * @param {string} idLiga
 * @param {FirebaseFirestore.DocumentSnapshot} ligaSnap - Snapshot ya cargado del documento de liga.
 * @returns {Promise<{nombreLiga: string, participacionesBorradas: number, mercadosBorrados: number, eventosActividadBorrados: number, usuariosDesvinculados: number}>}
 */
async function borrarLigaEnCascada(idLiga, ligaSnap) {
  const batch = db.batch()

  const participacionesSnap = await db
    .collection('participaciones')
    .where('id_liga', '==', idLiga)
    .get()
  for (const documento of participacionesSnap.docs) {
    batch.delete(documento.ref)
  }

  const mercadosSnap = await db.collection('mercados').where('idLiga', '==', idLiga).get()
  for (const documentoMercado of mercadosSnap.docs) {
    const pujasSnap = await documentoMercado.ref.collection('pujas').get()
    for (const documentoPuja of pujasSnap.docs) {
      batch.delete(documentoPuja.ref)
    }
    batch.delete(documentoMercado.ref)
  }

  const actividadSnap = await db.collection('actividad').where('idLiga', '==', idLiga).get()
  for (const documento of actividadSnap.docs) {
    batch.delete(documento.ref)
  }

  const usuariosSnap = await db
    .collection('usuarios')
    .where('ligasIds', 'array-contains', idLiga)
    .get()
  for (const documentoUsuario of usuariosSnap.docs) {
    batch.update(documentoUsuario.ref, { ligasIds: FieldValue.arrayRemove(idLiga) })
  }

  batch.delete(ligaSnap.ref)

  await batch.commit()

  return {
    nombreLiga: ligaSnap.data().nombre || idLiga,
    participacionesBorradas: participacionesSnap.size,
    mercadosBorrados: mercadosSnap.size,
    eventosActividadBorrados: actividadSnap.size,
    usuariosDesvinculados: usuariosSnap.size,
  }
}

/**
 * Callable — ELIMINACIÓN COMPLETA de una liga (solo administrador global).
 * Permite al administrador global borrar cualquier liga del sistema.
 * Acepta `{ idLiga }` (obligatorio).
 */
exports.eliminarLigaManual = onCall(OPCIONES, async (request) => {
  await exigirAdministrador(request)
  const { idLiga } = request.data || {}
  if (!idLiga) {
    throw new HttpsError('invalid-argument', 'Falta idLiga.')
  }

  const ligaSnap = await db.collection('ligas').doc(idLiga).get()
  if (!ligaSnap.exists) {
    throw new HttpsError('not-found', `Liga ${idLiga} no encontrada.`)
  }

  const resumen = await borrarLigaEnCascada(idLiga, ligaSnap)
  return { ok: true, idLiga, ...resumen }
})

/**
 * Callable — el organizador de la liga la elimina en cascada.
 * Ejecuta la misma limpieza atómica que `eliminarLigaManual` (participaciones,
 * mercados, pujas, actividad, vínculos en usuarios y el documento de liga),
 * pero verifica que el invocador sea el organizador de esa liga concreta.
 * Acepta `{ idLiga }` (obligatorio).
 */
exports.eliminarLigaComoOrganizador = onCall(OPCIONES, async (request) => {
  const email = exigirEmailAutenticado(request)
  const { idLiga } = request.data || {}
  if (!idLiga) {
    throw new HttpsError('invalid-argument', 'Falta idLiga.')
  }

  const ligaSnap = await db.collection('ligas').doc(idLiga).get()
  if (!ligaSnap.exists) {
    throw new HttpsError('not-found', `Liga ${idLiga} no encontrada.`)
  }
  if (ligaSnap.data().correoOrganizador !== email) {
    throw new HttpsError('permission-denied', 'Solo el organizador puede eliminar la liga.')
  }

  const resumen = await borrarLigaEnCascada(idLiga, ligaSnap)
  return { ok: true, idLiga, ...resumen }
})

/**
 * Callable — el organizador de la liga expulsa a un participante concreto.
 * Verifica en servidor todos los permisos y ejecuta la operación en un
 * único batch atómico: borra la participación del expulsado, elimina la
 * liga de su array `ligasIds`, registra su correo en `expulsados`,
 * decrementa el contador de participantes y crea el evento de actividad.
 * Acepta `{ idLiga, emailExpulsado }` (ambos obligatorios).
 */
exports.expulsarParticipanteComoOrganizador = onCall(OPCIONES, async (request) => {
  const emailOrganizador = exigirEmailAutenticado(request)
  const { idLiga, emailExpulsado } = request.data || {}
  if (!idLiga || !emailExpulsado) {
    throw new HttpsError('invalid-argument', 'Falta idLiga o emailExpulsado.')
  }

  const correoExpulsado = String(emailExpulsado).trim().toLowerCase()
  if (correoExpulsado === emailOrganizador.toLowerCase()) {
    throw new HttpsError('failed-precondition', 'No puedes expulsarte a ti mismo.')
  }

  const ligaSnap = await db.collection('ligas').doc(idLiga).get()
  if (!ligaSnap.exists) {
    throw new HttpsError('not-found', `Liga ${idLiga} no encontrada.`)
  }
  const datosLiga = ligaSnap.data()
  if (datosLiga.correoOrganizador !== emailOrganizador) {
    throw new HttpsError('permission-denied', 'Solo el organizador puede expulsar participantes.')
  }

  const participacionSnap = await db
    .collection('participaciones')
    .where('id_liga', '==', idLiga)
    .where('email_usuario', '==', correoExpulsado)
    .limit(1)
    .get()
  if (participacionSnap.empty) {
    throw new HttpsError('not-found', 'El participante no pertenece a esta liga.')
  }
  const participacionExpulsado = participacionSnap.docs[0]
  const datosParticipacion = participacionExpulsado.data()

  let uidExpulsado = datosParticipacion.uid_usuario || null
  if (!uidExpulsado) {
    const usuarioSnap = await db
      .collection('usuarios')
      .where('correoAutenticacion', '==', correoExpulsado)
      .limit(1)
      .get()
    if (!usuarioSnap.empty) uidExpulsado = usuarioSnap.docs[0].id
  }

  const batch = db.batch()
  batch.delete(participacionExpulsado.ref)
  batch.update(ligaSnap.ref, {
    expulsados: FieldValue.arrayUnion(correoExpulsado),
    participantes: FieldValue.increment(-1),
  })
  if (uidExpulsado) {
    batch.update(db.collection('usuarios').doc(uidExpulsado), {
      ligasIds: FieldValue.arrayRemove(idLiga),
    })
  }
  batch.create(db.collection('actividad').doc(), {
    idLiga,
    nombreUsuario: datosParticipacion.nombre_usuario || correoExpulsado,
    tipo: 'abandono',
    descripcion: `ha sido expulsado del campeonato ${datosLiga.nombre}`,
    fecha: FieldValue.serverTimestamp(),
  })

  await batch.commit()

  return {
    ok: true,
    idLiga,
    emailExpulsado: correoExpulsado,
    nombreExpulsado: datosParticipacion.nombre_usuario || correoExpulsado,
  }
})

/**
 * Calcula el precio de una cláusula a partir del precio pagado por el dueño.
 * Fórmula: precioCompra + (inversión del dueño × 2).
 * @param {Object} carta - Carta del garaje rival.
 * @returns {number} Precio total de la cláusula.
 */
function calcularPrecioClausula(carta) {
  const precioBase = carta.precioCompra ?? carta.precio
  const inversionDueño = carta.clausulaInvertida || 0
  return precioBase + inversionDueño * 2
}

/**
 * Indica si una carta sigue protegida por el periodo de gracia tras adquirirse.
 * @param {Object} carta - Carta con campo fechaAdquisicion (ISO string).
 * @returns {boolean}
 */
function estaEnPeriodoDeGracia(carta) {
  if (!carta.fechaAdquisicion) return false
  const fechaAdquisicion = new Date(carta.fechaAdquisicion)
  const milisegundosGracia = HORAS_PERIODO_GRACIA * 60 * 60 * 1000
  return Date.now() - fechaAdquisicion.getTime() < milisegundosGracia
}

/**
 * Extrae una carta del garaje por instancia_id, mutando el garaje recibido.
 * @param {Object} garaje - Garaje del participante origen.
 * @param {number} instanciaId
 * @returns {{ carta: Object|null }}
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
 * Añade una carta al garaje destino según su tipo, mutando el garaje recibido.
 * @param {Object} garaje - Garaje del participante destino.
 * @param {Object} carta - Carta a añadir.
 */
function añadirCartaAGaraje(garaje, carta) {
  const tipo = carta.tipo || carta.tipoCarta
  const coleccion = tipo === 'coche' ? 'coches' : tipo === 'piloto' ? 'pilotos' : 'potenciadores'
  if (!garaje[coleccion]) garaje[coleccion] = []
  garaje[coleccion].push(carta)
}

/**
 * Suma el dinero que un usuario tiene comprometido en pujas del mercado de hoy.
 * @param {string} idLiga
 * @param {string} email
 * @returns {Promise<number>} Total comprometido en millones.
 */
async function calcularComprometidoEnPujas(idLiga, email) {
  const idMercado = calcularIdMercado(idLiga, new Date())
  const pujasSnap = await db
    .collection('mercados')
    .doc(idMercado)
    .collection('pujas')
    .where('emailUsuario', '==', email)
    .get()
  return pujasSnap.docs.reduce((suma, documento) => suma + (documento.data().cantidad || 0), 0)
}

/**
 * Callable — ejecuta una cláusula de rescisión validando todo en servidor.
 * Recalcula el precio (sin fiarse del cliente), comprueba periodo de gracia y
 * presupuesto disponible (incluido el comprometido en pujas), y transfiere la
 * carta entre participaciones en un único batch atómico. Acepta
 * `{ idParticipanteRival, idParticipantePropio, instanciaId }`.
 */
exports.ejecutarClausulazo = onCall(OPCIONES, async (request) => {
  const emailAtacante = exigirEmailAutenticado(request)
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
  if (!carta) {
    throw new HttpsError('not-found', 'La carta ya no está en el equipo rival.')
  }

  const tipoCarta = carta.tipo || carta.tipoCarta
  if (tipoCarta === 'potenciador') {
    throw new HttpsError('failed-precondition', 'Los potenciadores no admiten cláusula.')
  }
  if (estaEnPeriodoDeGracia(carta)) {
    throw new HttpsError('failed-precondition', 'La carta está protegida por periodo de gracia.')
  }

  const precioClausula = calcularPrecioClausula(carta)
  const comprometidoEnPujas = await calcularComprometidoEnPujas(datosPropio.id_liga, emailAtacante)
  if (precioClausula + comprometidoEnPujas > datosPropio.presupuesto) {
    throw new HttpsError('failed-precondition', 'No tienes presupuesto suficiente.')
  }

  const garajePropio = datosPropio.garaje || {}
  añadirCartaAGaraje(garajePropio, {
    ...carta,
    precioCompra: precioClausula,
    clausulaInvertida: 0,
    fechaAdquisicion: new Date().toISOString(),
    equipado: false,
  })

  const batch = db.batch()
  batch.update(refRival, {
    garaje: garajeRival,
    presupuesto: datosRival.presupuesto + precioClausula,
  })
  batch.update(refPropio, {
    garaje: garajePropio,
    presupuesto: datosPropio.presupuesto - precioClausula,
  })
  batch.create(db.collection('actividad').doc(), {
    idLiga: datosPropio.id_liga,
    nombreUsuario: datosPropio.nombre_usuario || emailAtacante,
    tipo: 'clausula',
    descripcion: `ha activado la cláusula de ${tipoCarta} ${carta.nombre} por ${precioClausula.toFixed(1)}M`,
    fecha: FieldValue.serverTimestamp(),
  })
  await batch.commit()

  return { ok: true, nombre: carta.nombre, precioClausula }
})

/* ═══════════════════════════════════════════════════════════════════════════
   PRECIOS DINÁMICOS DE PILOTOS — derivados de las pujas reales del mercado.
   ───────────────────────────────────────────────────────────────────────────
   Cada vez que se cierra el mercado de una liga, se registra una muestra del
   precio realmente pagado por cada carta de piloto (numero + variante). Las
   cartas que salen al mercado pero no reciben puja añaden una muestra
   penalizada (precio actual * FACTOR_DESINTERES) para reflejar la pérdida de
   valor por falta de interés. El precio dinámico de cada carta es el
   promedio de sus últimas HISTORIAL_MAX_MUESTRAS muestras y se aplica de
   forma global (todas las ligas comparten precios). Tras cada actualización
   se propaga el cambio a los garajes de todos los participantes y a los
   mercados que aún siguen abiertos.
   ═══════════════════════════════════════════════════════════════════════════ */

const HISTORIAL_MAX_MUESTRAS = 5
const FACTOR_DESINTERES = 0.95
const PRECIO_MINIMO = 0.5

/**
 * Para cada carta de piloto del mercado recién resuelto, calcula una muestra
 * de precio (puja ganadora si la hubo, o `precio * FACTOR_DESINTERES` si la
 * carta quedó desierta) y delega su agregación al histórico y la propagación
 * de los nuevos precios a garajes y mercados abiertos.
 * @param {Array} cartasMercado - Cartas que estuvieron a la venta en el mercado.
 * @param {Object} pujasPorCarta - Mapa { idCarta: pujaGanadora } resuelto previamente.
 * @returns {Promise<void>}
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
 * Añade las muestras al histórico (recortando a las últimas
 * HISTORIAL_MAX_MUESTRAS por clave), recalcula el precio dinámico de cada
 * carta como promedio del histórico y persiste tanto el histórico como el
 * documento de precios. Luego propaga los deltas a garajes y mercados.
 * @param {Object<string, number>} muestrasPorClave - { "<numero>|<variante>": precioMuestra }.
 * @returns {Promise<void>}
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
 * Calcula los deltas de precio (precioNuevo - precioAnterior) por clave de
 * piloto. Las claves sin precio previo se consideran sin delta (el primer
 * precio asignado no propaga nada hacia atrás).
 * @param {Object<string, number>} preciosAnteriores
 * @param {Object<string, number>} preciosNuevos
 * @returns {Object<string, number>} Mapa { clave: deltaPrecioM }.
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
 * Para pilotos cuyo precio aparece en `catalogo/precios_pilotos` por primera
 * vez (sin histórico previo), establece el precio de forma absoluta en todos
 * los garajes que ya tengan esa carta. Evita que el precio base del catálogo
 * se quede desincronizado cuando no hay delta anterior con el que calcular.
 * @param {Object<string, number>} preciosPorClave - { "<numero>|<variante>": precioNuevo }.
 * @returns {Promise<number>} Número de garajes actualizados.
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
 * garajes de TODAS las participaciones. Una carta del garaje se identifica
 * por la combinación `<numero>|<variante>`. Mantiene PRECIO_MINIMO como
 * suelo. Devuelve el número de garajes efectivamente modificados.
 * @param {Object<string, number>} deltasPorClave
 * @returns {Promise<number>}
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
 * Aplica los deltas de precio sobre las cartas de pilotos en mercados con
 * `estado: 'abierto'`. Identifica por `<numero>|<variante>`.
 * @param {Object<string, number>} deltasPorClave
 * @returns {Promise<number>}
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

/* ═══════════════════════════════════════════════════════════════════════════
   GESTIÓN DE PERFIL — Cambio de nombre, cambio de correo y baja de cuenta.
   ───────────────────────────────────────────────────────────────────────────
   Las acciones sensibles (cambio de email y borrado) requieren que el cliente
   haya reautenticado al usuario justo antes de invocar la callable.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Devuelve el email del usuario autenticado o lanza si no hay sesión.
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 * @returns {string}
 */
function exigirEmailAutenticado(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
  }
  const email = request.auth.token.email
  if (!email) {
    throw new HttpsError('permission-denied', 'Token sin email.')
  }
  return email
}

/**
 * Exige que el usuario se haya autenticado hace menos de `maxSegundos`.
 * Protege acciones sensibles (borrar cuenta, cambiar correo) frente a sesiones
 * antiguas: el cliente debe reautenticar y refrescar el token antes de invocar.
 * @param {import('firebase-functions/v2/https').CallableRequest} request
 * @param {number} [maxSegundos=300] - Antigüedad máxima admitida del login.
 */
function exigirReautenticacionReciente(request, maxSegundos = 300) {
  const instanteLogin = request.auth?.token?.auth_time
  const ahoraSegundos = Math.floor(Date.now() / 1000)
  if (!instanteLogin || ahoraSegundos - instanteLogin > maxSegundos) {
    throw new HttpsError(
      'failed-precondition',
      'Esta acción exige que vuelvas a introducir tus credenciales.',
    )
  }
}

/**
 * Indica si ya transcurrió el periodo de bloqueo entre cambios de correo.
 * @param {FirebaseFirestore.Timestamp|string|number} marcaTemporal
 * @returns {boolean} true si han pasado al menos DIAS_BLOQUEO_CAMBIO_CORREO días.
 */
function haExpiradoElBloqueoDeCorreo(marcaTemporal) {
  const fecha = marcaTemporal.toDate ? marcaTemporal.toDate() : new Date(marcaTemporal)
  const milisegundosBloqueo = DIAS_BLOQUEO_CAMBIO_CORREO * 24 * 60 * 60 * 1000
  return Date.now() - fecha.getTime() >= milisegundosBloqueo
}

/**
 * Callable — autoriza el inicio de un cambio de correo y registra el momento.
 * El cliente debe invocarla ANTES de `verifyBeforeUpdateEmail`: aquí se valida
 * en servidor la reautenticación reciente y el periodo de bloqueo de 7 días,
 * de modo que la restricción no dependa solo del cliente.
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
 * Al estar el documento de usuario indexado por UID (no por email), ya no es
 * necesario copiar ni borrar el documento: basta con actualizar el campo
 * `correoAutenticacion` y propagar el cambio a participaciones y ligas.
 * El cliente debe haber ejecutado primero `updateEmail()` y refrescar el token.
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

/**
 * Cede el rol de admin al siguiente participante por fecha_union ascendente.
 * @param {Array<{id: string, email_usuario: string, fecha_union?: any}>} participacionesRestantes
 * @returns {{id: string, email_usuario: string} | null}
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
 * Borra una liga completa: mercados (con pujas), actividad y la propia liga.
 * @param {string} idLiga
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
 * Borra en cascada todos los datos del usuario identificado por `uid` y `email`:
 *  · Si era único participante de una liga → borra la liga entera.
 *  · Si era admin con más participantes → cede admin al siguiente.
 *  · Borra su participación y resta 1 al contador de la liga.
 *  · Borra todas sus pujas activas en mercados abiertos.
 *  · Borra el documento `usuarios/{uid}` y el usuario de Firebase Auth.
 * @param {string} uid - UID de Firebase Auth (clave del documento en Firestore).
 * @param {string} email - Correo del usuario (para localizar participaciones y pujas).
 * @returns {Promise<{participacionesBorradas: number, ligasBorradas: number}>}
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
    await getAuth().revokeRefreshTokens(uid)
    await getAuth().deleteUser(uid)
  } catch (error) {
    throw new HttpsError(
      'internal',
      `Perfil borrado pero el usuario de Auth no pudo eliminarse: ${error.message}`,
    )
  }

  return { participacionesBorradas: participacionesSnap.size, ligasBorradas }
}

/**
 * Callable — elimina la cuenta del usuario autenticado en cascada.
 */
exports.eliminarMiCuenta = onCall(OPCIONES, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
  exigirReautenticacionReciente(request)
  const uid = request.auth.uid
  const email = request.auth.token.email || ''
  const resultado = await eliminarCuentaUsuarioEnCascada(uid, email)
  return { ok: true, email, ...resultado }
})

/* ─── Protección anti fuerza bruta ──────────────────────────────────────── */

const MAXIMO_INTENTOS_FALLIDOS = 5
const DURACION_BLOQUEO_MINUTOS = 5

/**
 * Callable pública — verifica si un correo tiene bloqueo temporal activo.
 * No requiere sesión de Firebase Auth porque se invoca antes del login.
 * Al estar el documento indexado por UID, busca el usuario por el campo
 * `correoAutenticacion` (aprovecha el índice automático de Firestore).
 * Si el correo no existe en Firestore, retorna sin bloqueo.
 * @param {{ correo: string }} data
 * @returns {{ bloqueado: false } | never}
 */
exports.verificarBloqueoAcceso = onCall(OPCIONES_PUBLICAS, async (request) => {
  const correo = String(request.data?.correo || '')
    .trim()
    .toLowerCase()
  if (!correo) throw new HttpsError('invalid-argument', 'Falta el correo.')

  const resultadoBusqueda = await db
    .collection('usuarios')
    .where('correoAutenticacion', '==', correo)
    .limit(1)
    .get()
  if (resultadoBusqueda.empty) return { bloqueado: false }

  const usuarioSnap = resultadoBusqueda.docs[0]
  const { fechaBloqueoDeSesion } = usuarioSnap.data()
  if (!fechaBloqueoDeSesion) return { bloqueado: false }

  const fechaDesbloqueo = fechaBloqueoDeSesion.toDate()
  if (new Date() < fechaDesbloqueo) {
    const minutosRestantes = Math.ceil((fechaDesbloqueo - new Date()) / 60000)
    throw new HttpsError(
      'resource-exhausted',
      `Acceso bloqueado. Intenta de nuevo en ${minutosRestantes} minuto${minutosRestantes > 1 ? 's' : ''}.`,
    )
  }

  return { bloqueado: false }
})

/**
 * Callable pública — incrementa el contador de intentos fallidos de un correo.
 * Al alcanzar el límite activa un bloqueo temporal de 5 minutos.
 * No requiere sesión de Firebase Auth porque se invoca tras un fallo de credenciales.
 * Busca el documento de usuario por el campo `correoAutenticacion`.
 * @param {{ correo: string }} data
 * @returns {{ ok: true }}
 */
exports.registrarIntentoFallido = onCall(OPCIONES_PUBLICAS, async (request) => {
  const correo = String(request.data?.correo || '')
    .trim()
    .toLowerCase()
  if (!correo) throw new HttpsError('invalid-argument', 'Falta el correo.')

  const resultadoBusqueda = await db
    .collection('usuarios')
    .where('correoAutenticacion', '==', correo)
    .limit(1)
    .get()
  if (resultadoBusqueda.empty) return { ok: true }

  const docRef = resultadoBusqueda.docs[0].ref
  const intentosPrevios = resultadoBusqueda.docs[0].data().contadorIntentosFallidos || 0
  const nuevosIntentos = intentosPrevios + 1
  const actualizacion = { contadorIntentosFallidos: nuevosIntentos }

  if (nuevosIntentos >= MAXIMO_INTENTOS_FALLIDOS) {
    const fechaDesbloqueo = new Date(Date.now() + DURACION_BLOQUEO_MINUTOS * 60 * 1000)
    actualizacion.fechaBloqueoDeSesion = fechaDesbloqueo
  }

  await docRef.update(actualizacion)
  return { ok: true }
})

/**
 * Callable autenticada — reinicia el contador de intentos fallidos tras un login exitoso.
 * Usa el UID del token para localizar el documento directamente, sin necesitar el correo.
 * Solo puede llamarla el propio usuario autenticado.
 * @returns {{ ok: true }}
 */
exports.reiniciarContadorIntentos = onCall(OPCIONES, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
  const uid = request.auth.uid

  const docRef = db.collection('usuarios').doc(uid)
  const usuarioSnap = await docRef.get()
  if (!usuarioSnap.exists) return { ok: true }

  await docRef.update({ contadorIntentosFallidos: 0, fechaBloqueoDeSesion: null })
  return { ok: true }
})

/**
 * Callable — el administrador global elimina la cuenta de cualquier usuario
 * en cascada (participaciones, pujas, perfil y usuario de Auth).
 * Acepta `{ uid }` (obligatorio): el UID de Firebase Auth del usuario a eliminar.
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
