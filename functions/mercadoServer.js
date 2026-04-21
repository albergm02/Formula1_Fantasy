/**
 * mercadoServer.js — Acceso al catálogo y selección diaria de cartas.
 *
 * El catálogo (pilotos, coches, potenciadores con sus precios calculados)
 * vive en Firestore como fuente única de verdad. Este módulo se encarga de:
 *   1. Leer el catálogo en frío al primer uso de la instancia (cache de módulo).
 *   2. Mezclar y seleccionar la muestra diaria del mercado.
 *
 * Para alimentar Firestore se usa el endpoint `seedCatalogoHttp` (ver index.js),
 * que toma los datos de /functions/data/catalogoBase.js y los sube a la coleccion
 * `catalogo` con tres documentos: pilotos, coches, potenciadores.
 *
 * @module mercadoServer
 */

let catalogoEnMemoria = null

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
    throw new Error(
      'Catalogo no encontrado en Firestore. Ejecuta el endpoint seedCatalogoHttp para sembrarlo.',
    )
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
  seleccionarCartasDiarias,
  CARTAS_POR_DIA,
}
