/**
 * mercadoServer.js — Acceso al catálogo, rachas y selección diaria de cartas.
 *
 * El catálogo (pilotos, coches, potenciadores con sus precios calculados)
 * vive en Firestore como fuente única de verdad. Si Firestore no contiene
 * el catálogo en el primer acceso, este módulo lo siembra automáticamente
 * desde `data/catalogoBase.js` (auto-seed transparente al admin).
 *
 * Las rachas son ajustes manuales por piloto (entero positivo o negativo)
 * que se aplican sobre las cartas de piloto recién cargadas:
 *   - Suman `racha * 0,5M` al precio de mercado.
 *   - Suman `racha` puntos a la `puntuacionBase` (afecta puntos de jornada).
 *
 * @module mercadoServer
 */

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
async function cargarRachas(db) {
  const documento = await db.collection('catalogo').doc('rachas').get()
  if (!documento.exists) return {}
  return documento.data().rachas || {}
}

/**
 * Devuelve un nuevo catálogo con las rachas aplicadas sobre las cartas de piloto.
 * No muta el catálogo original (cache compartida).
 * @param {{ pilotos: Array, coches: Array, potenciadores: Array }} catalogo
 * @param {Object<string, number>} rachasPorNumero
 * @returns {{ pilotos: Array, coches: Array, potenciadores: Array }}
 */
function aplicarRachasACatalogo(catalogo, rachasPorNumero = {}) {
  const pilotosConRacha = catalogo.pilotos.map((piloto) => {
    const racha = Number(rachasPorNumero[piloto.numero] || 0)
    if (racha === 0) {
      return { ...piloto, racha: 0 }
    }
    const precioAjustado = Number((piloto.precio + racha * BONIFICACION_PRECIO_POR_RACHA).toFixed(1))
    const puntuacionAjustada = Number((piloto.puntuacionBase + racha).toFixed(1))
    return {
      ...piloto,
      precio: Math.max(0.5, precioAjustado),
      puntuacionBase: puntuacionAjustada,
      racha,
    }
  })
  return { ...catalogo, pilotos: pilotosConRacha }
}

const CARTAS_POR_DIA = {
  pilotos: 8,
  coches: 2,
  potenciadores: 8,
}

function mezclarArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

function seleccionarCartasDiarias(catalogo) {
  const pilotosDelDia = mezclarArray([...catalogo.pilotos]).slice(0, CARTAS_POR_DIA.pilotos)
  const cochesDelDia = mezclarArray([...catalogo.coches]).slice(0, CARTAS_POR_DIA.coches)
  const potenciadoresDelDia = mezclarArray([...catalogo.potenciadores]).slice(
    0,
    CARTAS_POR_DIA.potenciadores,
  )
  return [...pilotosDelDia, ...cochesDelDia, ...potenciadoresDelDia]
}

module.exports = {
  cargarCatalogo,
  invalidarCacheCatalogo,
  cargarRachas,
  aplicarRachasACatalogo,
  seleccionarCartasDiarias,
  sembrarCatalogoEnFirestore,
  CARTAS_POR_DIA,
  BONIFICACION_PRECIO_POR_RACHA,
}
