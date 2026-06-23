/**
 * @module functions/logica/mercado
 * @description Funciones de lógica para manejar el mercado, incluyendo la selección de cartas diarias y la aplicación de precios dinámicos.
 */

const { construirCatalogoCompleto } = require('../infraestructura/catalogoBase')

let catalogoEnMemoria = null

/**
 * Carga el catálogo completo desde la base de datos o lo construye si no existe.
 * @param {Object} db - Instancia de Firestore.
 * @returns {Promise<Object>} - Catálogo completo.
 */
async function cargarCatalogo(db) {
  if (catalogoEnMemoria) return catalogoEnMemoria

  const docItems = await db.collection('catalogo').doc('items').get()

  if (!docItems.exists) {
    const { pilotos, coches, potenciadores } = construirCatalogoCompleto()
    await db.collection('catalogo').doc('items').set({ pilotos, coches, potenciadores })
    catalogoEnMemoria = { pilotos, coches, potenciadores }
    return catalogoEnMemoria
  }

  const datos = docItems.data()
  catalogoEnMemoria = { pilotos: datos.pilotos || [], coches: datos.coches || [], potenciadores: datos.potenciadores || [] }
  return catalogoEnMemoria
}

/**
 * Carga los precios dinámicos desde la base de datos.
 * @param {Object} db - Instancia de Firestore.
 * @returns {Promise<Object>} - Precios dinámicos por tipo de carta.
 */
async function cargarPreciosDinamicos(db) {
  const docPrecios = await db.collection('catalogo').doc('precios').get()
  const datos = docPrecios.exists ? docPrecios.data() : {}
  return { pilotos: datos.pilotos || {}, coches: datos.coches || {}, potenciadores: datos.potenciadores || {} }
}

/**
 * Aplica los precios dinámicos a un catálogo de cartas.
 * @param {Object} catalogo - Catálogo de cartas.
 * @param {Object} preciosDinamicos - Precios dinámicos por tipo de carta.
 * @returns {Object} - Catálogo con precios dinámicos aplicados.
 */
function aplicarPreciosDinamicosACatalogo(catalogo, preciosDinamicos = {}) {
  const preciosPilotos = preciosDinamicos.pilotos || {}
  const preciosCoches = preciosDinamicos.coches || {}
  const preciosPotenciadores = preciosDinamicos.potenciadores || {}

  return {
    ...catalogo,
    pilotos: catalogo.pilotos.map((piloto) => sustituirPrecioSiExiste(piloto, preciosPilotos[construirClavePiloto(piloto)])),
    coches: catalogo.coches.map((coche) => sustituirPrecioSiExiste(coche, preciosCoches[coche.id])),
    potenciadores: catalogo.potenciadores.map((potenciador) => sustituirPrecioSiExiste(potenciador, preciosPotenciadores[potenciador.id])),
  }
}

function sustituirPrecioSiExiste(carta, precioDinamico) {
  if (precioDinamico == null) return carta
  return { ...carta, precio: Math.max(0.5, Number(precioDinamico)) }
}


/**
 * Construye la clave única de un piloto para precios dinámicos y detección de duplicados.
 * @param {Object} piloto - Piloto del catálogo.
 * @returns {string} - Clave única del piloto.
 */
function construirClavePiloto(piloto) {
  return `${piloto.numero}|${piloto.variante}`
}

const CARTAS_POR_DIA = { pilotos: 4, coches: 1, potenciadores: 3 }

function mezclarArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

/**
 * Selecciona las cartas que aparecerán hoy en el mercado.
 * Pilotos: se excluye un (numero, variante) solo si está fichado con esa misma
 * variante; la misma persona puede aparecer en distintas variantes a la vez.
 * Coches y potenciadores: se filtran por id exacto.
 * @param {Object} catalogo - Catálogo de cartas.
 * @param {Object} exclusiones - Exclusiones para la selección de cartas.
 * @returns {Array} - Cartas seleccionadas para el día.
 */
function seleccionarCartasDiarias(catalogo, exclusiones = {}) {
  const clavesBloqueadas = exclusiones.clavesPilotoBloqueadas instanceof Set ? exclusiones.clavesPilotoBloqueadas : new Set(exclusiones.clavesPilotoBloqueadas || [])
  const idsBloqueados = exclusiones.idsCartas instanceof Set ? exclusiones.idsCartas : new Set(exclusiones.idsCartas || [])

  const pilotosDisponibles = catalogo.pilotos.filter((carta) => !clavesBloqueadas.has(construirClavePiloto(carta)))
  const pilotosDelDia = mezclarArray([...pilotosDisponibles]).slice(0, CARTAS_POR_DIA.pilotos)
  const cochesDelDia = mezclarArray(catalogo.coches.filter((c) => !idsBloqueados.has(c.id))).slice(0, CARTAS_POR_DIA.coches)
  const potenciadoresDelDia = mezclarArray(catalogo.potenciadores.filter((p) => !idsBloqueados.has(p.id))).slice(0, CARTAS_POR_DIA.potenciadores)

  return [...pilotosDelDia, ...cochesDelDia, ...potenciadoresDelDia]
}

module.exports = { cargarCatalogo, cargarPreciosDinamicos, aplicarPreciosDinamicosACatalogo, seleccionarCartasDiarias }
