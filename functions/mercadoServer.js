const { construirCatalogoCompleto } = require('./data/catalogoBase')

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
 * Lee el documento `catalogo/precios_pilotos` con el precio dinámico actual
 * de cada piloto, calculado a partir del historial de pujas ganadoras.
 * @param {FirebaseFirestore.Firestore} db
 * @returns {Promise<Object<string, number>>} Mapa { "<numero>|<variante>": precio }.
 */
async function cargarPreciosPilotos(db) {
  const documento = await db.collection('catalogo').doc('precios_pilotos').get()
  if (!documento.exists) return {}
  return documento.data().precios || {}
}

/**
 * Devuelve un nuevo catálogo con los precios dinámicos aplicados a cada carta
 * de piloto (clave `<numero>|<variante>`). Si una carta no tiene precio
 * dinámico registrado, conserva su precio base. No muta el catálogo original.
 * @param {{ pilotos: Array, coches: Array, potenciadores: Array }} catalogo
 * @param {Object<string, number>} preciosPilotos
 * @returns {{ pilotos: Array, coches: Array, potenciadores: Array }}
 */
function aplicarPreciosDinamicosACatalogo(catalogo, preciosPilotos = {}) {
  const pilotosConPrecio = catalogo.pilotos.map((piloto) => {
    const clave = construirClavePiloto(piloto)
    const precioDinamico = preciosPilotos[clave]
    if (precioDinamico == null) return piloto
    return { ...piloto, precio: Math.max(0.5, Number(precioDinamico)) }
  })

  return { ...catalogo, pilotos: pilotosConPrecio }
}

/**
 * Construye la clave única de una carta de piloto, formada por su número
 * y su variante. Se utiliza como identificador para precios dinámicos y
 * para detectar duplicados (numero + variante) en garajes y mercados.
 * @param {{ numero: number|string, variante: string }} piloto
 * @returns {string}
 */
function construirClavePiloto(piloto) {
  return `${piloto.numero}|${piloto.variante}`
}

const CARTAS_POR_DIA = {
  pilotos: 7,
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
 *  - Pilotos: una carta concreta (numero + variante) se omite del mercado
 *    SOLO si está fichada por algún participante con esa misma variante. La
 *    misma persona puede aparecer en distintas variantes simultáneamente.
 *  - Coches y potenciadores: se filtran por `id` exacto.
 *
 * @param {{ pilotos: Array, coches: Array, potenciadores: Array }} catalogo
 * @param {Object} [exclusiones]
 * @param {Set<string>|Array<string>} [exclusiones.clavesPilotoBloqueadas] - Combinaciones "<numero>|<variante>" ocupadas.
 * @param {Set<string>|Array<string>} [exclusiones.idsCartas] - Coches/potenciadores bloqueados (por id).
 * @returns {Array} Cartas seleccionadas para el mercado del día.
 */
function seleccionarCartasDiarias(catalogo, exclusiones = {}) {
  const clavesBloqueadas =
    exclusiones.clavesPilotoBloqueadas instanceof Set
      ? exclusiones.clavesPilotoBloqueadas
      : new Set(exclusiones.clavesPilotoBloqueadas || [])
  const idsBloqueados =
    exclusiones.idsCartas instanceof Set
      ? exclusiones.idsCartas
      : new Set(exclusiones.idsCartas || [])

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

/**
 * Elige las cartas de piloto del día. La unicidad se mide por la combinación
 * `<numero>|<variante>`: el mismo piloto puede aparecer varias veces siempre
 * que cada aparición tenga una variante distinta y no esté bloqueada por
 * estar ya fichada en algún garaje.
 * @param {Array} cartasPiloto
 * @param {Set<string>} clavesBloqueadas
 * @returns {Array}
 */
function elegirPilotosDelDia(cartasPiloto, clavesBloqueadas) {
  const disponibles = cartasPiloto.filter(
    (carta) => !clavesBloqueadas.has(construirClavePiloto(carta)),
  )
  return mezclarArray([...disponibles]).slice(0, CARTAS_POR_DIA.pilotos)
}

module.exports = {
  cargarCatalogo,
  invalidarCacheCatalogo,
  cargarPreciosPilotos,
  aplicarPreciosDinamicosACatalogo,
  seleccionarCartasDiarias,
  sembrarCatalogoEnFirestore,
}
