/**
 * @module functions/logica/mercado
 * @description Funciones de lógica para manejar el mercado, incluyendo la selección de cartas diarias y la carga del catálogo.
 */

const { construirCatalogoCompleto } = require('../infraestructura/catalogoBase')

let catalogoEnMemoria = null

/**
 * Carga el catálogo completo desde la base de datos o lo construye si no existe.
 * Los precios son estáticos: viven únicamente en `catalogo/items`.
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
 * Construye la clave única de un piloto para detección de duplicados.
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

  const pilotosDisponibles = catalogo.pilotos.filter((carta) => 
    !clavesBloqueadas.has(construirClavePiloto(carta)))
  const pilotosDelDia = mezclarArray([...pilotosDisponibles]).slice(0, CARTAS_POR_DIA.pilotos)
  const cochesDelDia = mezclarArray(catalogo.coches.filter((c) => 
    !idsBloqueados.has(c.id))).slice(0, CARTAS_POR_DIA.coches)
  const potenciadoresDelDia = mezclarArray(catalogo.potenciadores.filter((p) => 
    !idsBloqueados.has(p.id))).slice(0, CARTAS_POR_DIA.potenciadores)

  return [...pilotosDelDia, ...cochesDelDia, ...potenciadoresDelDia]
}

module.exports = { cargarCatalogo, seleccionarCartasDiarias }