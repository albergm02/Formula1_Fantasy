/**
 * @module functions/logica/mercado
 * @description Funciones de lógica para manejar el mercado, incluyendo la selección de cartas diarias y la carga del catálogo.
 */

const { construirCatalogoCompleto } = require('../infraestructura/catalogoBase')

const CARTAS_POR_DIA = { pilotos: 1, coches: 1, potenciadores: 1 }

let catalogoEnMemoria = null

/**
 * Carga el catálogo completo desde la base de datos o lo construye si no existe.
 * Los precios son estáticos: viven únicamente en `catalogo/items`.
 * @param {Object} db - Instancia de Firestore.
 * @returns {Promise<Object>} - Catálogo completo.
 */
async function cargarCatalogo(db) {
  if (catalogoEnMemoria) return catalogoEnMemoria

  // Si no existe el catálogo en la bdd, lo creo a partir del catálogo base y lo guardo en la bdd
  const docItems = await db.collection('catalogo').doc('items').get()

  // Si no existe el documento, construyo el catálogo y lo guardo en la base de datos
  if (!docItems.exists) {
    const { pilotos, coches, potenciadores } = construirCatalogoCompleto()
    await db.collection('catalogo').doc('items').set({ pilotos, coches, potenciadores })
    catalogoEnMemoria = { pilotos, coches, potenciadores }
    return catalogoEnMemoria
  }

  // Si existe, lo cargo en memoria y lo devuelvo
  const datos = docItems.data()
  catalogoEnMemoria = { pilotos: datos.pilotos || [], coches: datos.coches || [], potenciadores: datos.potenciadores || [] }
  return catalogoEnMemoria
}

/**
 * Construye la clave única de un piloto para detección de duplicados.
 * @param {Object} piloto - Piloto del catálogo.
 * @returns {string} - Clave única del piloto.
 * @example
 * const piloto = { numero: 44, variante: 'Base' }
 * const clave = construirClavePiloto(piloto) // "44|Base"
 */
function construirClavePiloto(piloto) {
  return `${piloto.numero}|${piloto.variante}`
}


/**
 * Mezcla los elementos de las cartas en orden aleatorio.
 * @param {Array} array - Array a mezclar.
 * @returns {Array} - Array mezclado.
 */
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
  const clavesBloqueadas = exclusiones.clavesPilotoBloqueadas || new Set()
  const idsBloqueados = exclusiones.idsCartas || new Set()

  // Selecciono los pilotos disponibles filtrando por clave única (numero|variante)
  const pilotosDisponibles = catalogo.pilotos.filter((carta) =>
    !clavesBloqueadas.has(construirClavePiloto(carta)))
  const pilotosDelDia = mezclarArray([...pilotosDisponibles]).slice(0, CARTAS_POR_DIA.pilotos)

  // Selecciono los coches disponibles filtrando por id exacto
  const cochesDisponibles = catalogo.coches.filter((c) =>
    !idsBloqueados.has(c.id))
  const cochesDelDia = mezclarArray([...cochesDisponibles]).slice(0, CARTAS_POR_DIA.coches)

  // Selecciono los potenciadores disponibles filtrando por id exacto
  const potenciadoresDisponibles = catalogo.potenciadores.filter((p) =>
    !idsBloqueados.has(p.id))
  const potenciadoresDelDia = mezclarArray([...potenciadoresDisponibles]).slice(0, CARTAS_POR_DIA.potenciadores)

  // Devuelvo la combinación de pilotos, coches y potenciadores seleccionados para el día
  return [...pilotosDelDia, ...cochesDelDia, ...potenciadoresDelDia]
}

module.exports = { cargarCatalogo, seleccionarCartasDiarias }