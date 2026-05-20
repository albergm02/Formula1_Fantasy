const { construirCatalogoCompleto } = require('./data/catalogoBase')

const BONIFICACION_PRECIO_POR_RACHA = 0.5

let catalogoEnMemoria = null

async function sembrarCatalogoEnFirestore(db) {
  const { pilotos, coches, potenciadores } = construirCatalogoCompleto()
  const fechaSiembra = new Date().toISOString()
  const batch = db.batch()
  batch.set(db.collection('catalogo').doc('pilotos'), { items: pilotos, fechaSiembra })
  batch.set(db.collection('catalogo').doc('coches'), { items: coches, fechaSiembra })
  batch.set(db.collection('catalogo').doc('potenciadores'), { items: potenciadores, fechaSiembra })
  await batch.commit()
  console.log('[Catalogo] Auto-seed ejecutado correctamente.')
  return { pilotos, coches, potenciadores }
}

async function cargarCatalogo(db) {
  if (catalogoEnMemoria) {
    return catalogoEnMemoria
  }

  const referencia = db.collection('catalogo')
  const [docPilotos, docCoches, docPotenciadores] = await Promise.all([
    referencia.doc('pilotos').get(),
    referencia.doc('coches').get(),
    referencia.doc('potenciadores').get(),
  ])

  if (!docPilotos.exists || !docCoches.exists || !docPotenciadores.exists) {
    catalogoEnMemoria = await sembrarCatalogoEnFirestore(db)
    return catalogoEnMemoria
  }

  catalogoEnMemoria = {
    pilotos: docPilotos.data().items || [],
    coches: docCoches.data().items || [],
    potenciadores: docPotenciadores.data().items || [],
  }

  return catalogoEnMemoria
}

function invalidarCacheCatalogo() {
  catalogoEnMemoria = null
}

/**
 * Lee el documento `catalogo/rachas` con la racha actual de cada piloto.
 * @param {FirebaseFirestore.Firestore} db
 * @returns {Promise<Object<string, number>>} Mapa { numeroPiloto: racha }.
 */
async function cargarRachasPilotos(db) {
  const documento = await db.collection('catalogo').doc('rachas').get()
  if (!documento.exists) return {}
  return documento.data().rachas || {}
}

/**
 * Lee el documento `catalogo/rachas_coches` con la racha actual de cada coche.
 * @param {FirebaseFirestore.Firestore} db
 * @returns {Promise<Object<string, number>>} Mapa { idCoche: racha }.
 */
async function cargarRachasCoches(db) {
  const documento = await db.collection('catalogo').doc('rachas_coches').get()
  if (!documento.exists) return {}
  return documento.data().rachas || {}
}

/**
 * Devuelve un nuevo catálogo con las rachas aplicadas sobre pilotos y coches.
 * No muta el catálogo original (cache compartida).
 * @param {{ pilotos: Array, coches: Array, potenciadores: Array }} catalogo
 * @param {Object} [rachas]
 * @param {Object<string, number>} [rachas.pilotos] - Mapa { numeroPiloto: racha }.
 * @param {Object<string, number>} [rachas.coches] - Mapa { idCoche: racha }.
 * @returns {{ pilotos: Array, coches: Array, potenciadores: Array }}
 */
function aplicarRachasACatalogo(catalogo, rachas = {}) {
  const rachasPilotos = rachas.pilotos || {}
  const rachasCoches = rachas.coches || {}

  const pilotosConRacha = catalogo.pilotos.map((piloto) => {
    const racha = Number(rachasPilotos[piloto.numero] || 0)
    if (racha === 0) {
      return { ...piloto, racha: 0 }
    }
    const bonificacionPrecio = racha > 0 ? 1.0 : BONIFICACION_PRECIO_POR_RACHA
    const precioAjustado = Number((piloto.precio + racha * bonificacionPrecio).toFixed(1))
    return {
      ...piloto,
      precio: Math.max(0.5, precioAjustado),
      racha,
    }
  })

  const cochesConRacha = catalogo.coches.map((coche) => {
    const racha = Number(rachasCoches[coche.id] || 0)
    if (racha === 0) {
      return { ...coche, racha: 0 }
    }
    const precioAjustado = Number((coche.precio + racha * BONIFICACION_PRECIO_POR_RACHA).toFixed(1))
    const puntosAjustados = Number((coche.puntos + racha).toFixed(1))
    return {
      ...coche,
      precio: Math.max(0.5, precioAjustado),
      puntos: puntosAjustados,
      racha,
    }
  })

  return { ...catalogo, pilotos: pilotosConRacha, coches: cochesConRacha }
}

const CARTAS_POR_DIA = {
  pilotos: 3,
  coches: 1,
  potenciadores: 3,
}

function mezclarArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

/**
 * Selecciona aleatoriamente las cartas que aparecerán hoy en el mercado.
 *
 * Reglas de exclusión:
 *  - Pilotos: si un piloto está fichado por cualquier participante (en cualquiera
 *    de sus variantes), todas sus variantes se omiten del mercado. Cuando se
 *    vende, el piloto vuelve a estar disponible.
 *  - Coches y potenciadores: se filtran por `id` exacto.
 *
 * Además, en cada generación cada piloto aparece como mucho una vez: se
 * agrupan sus variantes y se elige aleatoriamente una sola por piloto.
 *
 * @param {{ pilotos: Array, coches: Array, potenciadores: Array }} catalogo
 * @param {Object} [exclusiones]
 * @param {Set<number>|Array<number>} [exclusiones.numerosPilotos] - Pilotos bloqueados (por número).
 * @param {Set<string>|Array<string>} [exclusiones.idsCartas] - Coches/potenciadores bloqueados (por id).
 * @returns {Array} Cartas seleccionadas para el mercado del día.
 */
function seleccionarCartasDiarias(catalogo, exclusiones = {}) {
  const numerosBloqueados =
    exclusiones.numerosPilotos instanceof Set
      ? exclusiones.numerosPilotos
      : new Set(exclusiones.numerosPilotos || [])
  const idsBloqueados =
    exclusiones.idsCartas instanceof Set
      ? exclusiones.idsCartas
      : new Set(exclusiones.idsCartas || [])

  const pilotosDelDia = elegirPilotosUnicos(catalogo.pilotos, numerosBloqueados)
  const cochesDelDia = mezclarArray(catalogo.coches.filter((c) => !idsBloqueados.has(c.id))).slice(
    0,
    CARTAS_POR_DIA.coches,
  )
  const potenciadoresDelDia = mezclarArray(
    catalogo.potenciadores.filter((p) => !idsBloqueados.has(p.id)),
  ).slice(0, CARTAS_POR_DIA.potenciadores)

  return [...pilotosDelDia, ...cochesDelDia, ...potenciadoresDelDia]
}

/**
 * Agrupa las variantes de cada piloto, descarta los bloqueados y devuelve
 * como máximo `CARTAS_POR_DIA.pilotos` cartas, eligiendo una sola variante
 * aleatoria por piloto.
 * @param {Array} cartasPiloto
 * @param {Set<number>} numerosBloqueados
 * @returns {Array}
 */
function elegirPilotosUnicos(cartasPiloto, numerosBloqueados) {
  const variantesPorPiloto = new Map()
  for (const carta of cartasPiloto) {
    if (numerosBloqueados.has(carta.numero)) continue
    if (!variantesPorPiloto.has(carta.numero)) {
      variantesPorPiloto.set(carta.numero, [])
    }
    variantesPorPiloto.get(carta.numero).push(carta)
  }

  const numerosBarajados = mezclarArray([...variantesPorPiloto.keys()])
  const numerosElegidos = numerosBarajados.slice(0, CARTAS_POR_DIA.pilotos)

  return numerosElegidos.map((numero) => {
    const variantes = variantesPorPiloto.get(numero)
    return variantes[Math.floor(Math.random() * variantes.length)]
  })
}

module.exports = {
  cargarCatalogo,
  invalidarCacheCatalogo,
  cargarRachasPilotos,
  cargarRachasCoches,
  aplicarRachasACatalogo,
  seleccionarCartasDiarias,
  sembrarCatalogoEnFirestore,
  CARTAS_POR_DIA,
  BONIFICACION_PRECIO_POR_RACHA,
}
