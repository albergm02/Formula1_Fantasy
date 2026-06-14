const { construirCatalogoCompleto } = require('../data/catalogoBase')

let catalogoEnMemoria = null

async function sembrarCatalogoEnFirestore(db) {
  const { pilotos, coches, potenciadores } = construirCatalogoCompleto()
  const batch = db.batch()
  batch.set(db.collection('catalogo').doc('pilotos'), { items: pilotos })
  batch.set(db.collection('catalogo').doc('coches'), { items: coches })
  batch.set(db.collection('catalogo').doc('potenciadores'), { items: potenciadores })
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

// Mapas { clave: precio } por tipo de carta, calculados a partir del histórico
// de pujas ganadoras. La clave de un piloto es `<numero>|<variante>`; para
// coches y potenciadores se usa el `id` único del catálogo.
async function cargarPreciosDinamicos(db) {
  const referencia = db.collection('catalogo')
  const [docPilotos, docCoches, docPotenciadores] = await Promise.all([
    referencia.doc('precios_pilotos').get(),
    referencia.doc('precios_coches').get(),
    referencia.doc('precios_potenciadores').get(),
  ])
  return {
    pilotos: docPilotos.exists ? docPilotos.data().precios || {} : {},
    coches: docCoches.exists ? docCoches.data().precios || {} : {},
    potenciadores: docPotenciadores.exists ? docPotenciadores.data().precios || {} : {},
  }
}

// Devuelve una copia del catálogo con precios dinámicos aplicados a cada
// categoría. Si una carta no tiene precio dinámico, conserva su precio base.
function aplicarPreciosDinamicosACatalogo(catalogo, preciosDinamicos = {}) {
  const preciosPilotos = preciosDinamicos.pilotos || {}
  const preciosCoches = preciosDinamicos.coches || {}
  const preciosPotenciadores = preciosDinamicos.potenciadores || {}

  return {
    ...catalogo,
    pilotos: catalogo.pilotos.map((piloto) =>
      sustituirPrecioSiExiste(piloto, preciosPilotos[construirClavePiloto(piloto)]),
    ),
    coches: catalogo.coches.map((coche) => sustituirPrecioSiExiste(coche, preciosCoches[coche.id])),
    potenciadores: catalogo.potenciadores.map((potenciador) =>
      sustituirPrecioSiExiste(potenciador, preciosPotenciadores[potenciador.id]),
    ),
  }
}

function sustituirPrecioSiExiste(carta, precioDinamico) {
  if (precioDinamico == null) return carta
  return { ...carta, precio: Math.max(0.5, Number(precioDinamico)) }
}

// Clave única de una carta de piloto: <numero>|<variante>. Sirve como
// identificador para precios dinámicos y para detectar duplicados.
function construirClavePiloto(piloto) {
  return `${piloto.numero}|${piloto.variante}`
}

const CARTAS_POR_DIA = {
  pilotos: 4,
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

function normalizarASet(valor) {
  if (valor instanceof Set) return valor
  return new Set(valor || [])
}

// Selecciona las cartas que aparecerán hoy en el mercado.
// Pilotos: se excluye un (numero, variante) solo si está fichado con esa misma
// variante; la misma persona puede aparecer en distintas variantes a la vez.
// Coches y potenciadores: se filtran por id exacto.
function seleccionarCartasDiarias(catalogo, exclusiones = {}) {
  const clavesBloqueadas = normalizarASet(exclusiones.clavesPilotoBloqueadas)
  const idsBloqueados = normalizarASet(exclusiones.idsCartas)

  const pilotosDelDia = elegirPilotosDelDia(catalogo.pilotos, clavesBloqueadas)
  const cochesDelDia = mezclarArray(catalogo.coches.filter((c) => !idsBloqueados.has(c.id))).slice(
    0,
    CARTAS_POR_DIA.coches,
  )
  const potenciadoresDelDia = mezclarArray(
    catalogo.potenciadores.filter((p) => !idsBloqueados.has(p.id)),
  ).slice(0, CARTAS_POR_DIA.potenciadores)

  return [...pilotosDelDia, ...cochesDelDia, ...potenciadoresDelDia]
}

function elegirPilotosDelDia(cartasPiloto, clavesBloqueadas) {
  const disponibles = cartasPiloto.filter(
    (carta) => !clavesBloqueadas.has(construirClavePiloto(carta)),
  )
  return mezclarArray([...disponibles]).slice(0, CARTAS_POR_DIA.pilotos)
}

module.exports = {
  cargarCatalogo,
  cargarPreciosDinamicos,
  aplicarPreciosDinamicosACatalogo,
  seleccionarCartasDiarias,
  sembrarCatalogoEnFirestore,
}
