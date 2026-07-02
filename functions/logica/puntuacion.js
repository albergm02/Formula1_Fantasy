/**
 * @module functions/logica/puntuacion
 * @description Funciones de lógica para calcular la puntuación de los pilotos y garajes, incluyendo la aplicación de multiplicadores y factores de caos.
 */

const PUNTOS_POR_POSICION = {
  1: 25, 2: 20, 3: 18, 4: 17, 5: 16, 6: 15, 7: 14, 8: 13, 9: 12, 10: 11,
  11: 10, 12: 9, 13: 8, 14: 7, 15: 6, 16: 5, 17: 4, 18: 3, 19: 2, 20: 1,
}

/**
 * Calcula los puntos de un piloto según su variante, actuación y condiciones de la jornada.
 * @param {string} variante - Variante del piloto (qualy, carrera, todo_terreno, remontador, estratega, base).
 * @param {Object} actuacion - Actuación del piloto en la jornada.
 * @param {Object} condiciones - Condiciones de la jornada.
 * @returns {number} - Puntos calculados para la variante.
 */
function calcularPuntosVariante(variante, actuacion, condiciones) {
  if (variante === 'qualy') return puntosPorPosicion(actuacion?.posicionQualy)
  if (sinActuacionValida(actuacion) && variante !== 'base') return 0
  if (variante === 'carrera') return puntosPorPosicion(actuacion.posicionCarrera)
  if (variante === 'todo_terreno') return puntosTodoTerreno(actuacion, condiciones)
  if (variante === 'remontador') return puntosRemontador(actuacion)
  if (variante === 'estratega') return puntosEstratega(actuacion)
  if (variante === 'base') return puntosBase(actuacion)
  return 0
}

/**
 * Verifica si la actuación del piloto es inválida (DNF, DNS, DSQ o no clasificado).
 * @param {Object} actuacion - Actuación del piloto.
 * @returns {boolean} - True si la actuación es inválida, false en caso contrario.
 */
function sinActuacionValida(actuacion) {
  return Boolean(actuacion?.dnf || actuacion?.dns || actuacion?.dsq || actuacion?.noClasificado)
}

/**
 * Calcula los puntos de un piloto según su posición en la carrera o clasificación.
 * La escala es decreciente y continua: P1 = 25, P2 = 20, P3 = 18 y de ahí baja
 * 1 punto por plaza hasta P20 = 1. A partir de P20 se mantiene el suelo de 1 punto,
 * de modo que siempre se puntúa (a favor o en contra) salvo posición inválida.
 * @param {number} posicion - Posición del piloto.
 * @returns {number} - Puntos correspondientes a la posición.
 */
function puntosPorPosicion(posicion) {
  if (!Number.isInteger(posicion) || posicion < 1) return 0
  if (posicion > 20) return 1
  return PUNTOS_POR_POSICION[posicion] ?? 0
}

/**
 * Calcula los puntos de un piloto con la variante "todo_terreno" según su actuación y las condiciones de la jornada.
 * @param {Object} actuacion - Actuación del piloto.
 * @param {Object} condiciones - Condiciones de la jornada.
 * @returns {number} - Puntos calculados para la variante "todo_terreno".
 */
function puntosTodoTerreno(actuacion, condiciones) {
  const factorCaos = calcularFactorCaos(condiciones || {})
  return redondear(puntosPorPosicion(actuacion.posicionCarrera) * factorCaos)
}

/**
 * Calcula el factor de caos de la jornada según las condiciones.
 * @param {Object} condiciones - Condiciones de la jornada.
 * @param {boolean} condiciones.llovio - Indica si llovió durante la jornada.
 * @param {number} condiciones.numeroSafetyCarActivos - Número de Safety Car activos.
 * @param {number} condiciones.numeroVirtualSafetyCarActivos - Número de Virtual Safety Car activos.
 * @param {number} condiciones.numeroDNFs - Número de pilotos que no terminaron la carrera.
 * @returns {number} - Factor de caos calculado.
 */
function calcularFactorCaos({ llovio, numeroSafetyCarActivos = 0, numeroVirtualSafetyCarActivos = 0, numeroDNFs = 0 }) {
  let factor = 0.75
  if (llovio) factor += 0.1
  factor += Math.min(3, numeroSafetyCarActivos + numeroVirtualSafetyCarActivos) * 0.05
  factor += Math.min(numeroDNFs, 5) * 0.05
  return Math.round(factor * 100) / 100
}


const PUNTOS_SUELO_REMONTADOR = 1
const PUNTOS_TOPE_REMONTADOR = 25
const PUNTOS_REMONTADOR_POR_DIFERENCIAL = {
  [-4]: 2, [-3]: 3, [-2]: 4, [-1]: 5,
  [0]: 7, [1]: 10, [2]: 13, [3]: 16, [4]: 19, [5]: 22,
}

/**
 * Calcula los puntos de un piloto con la variante "remontador" según el diferencial
 * neto de adelantamientos (adelantamientos realizados − veces adelantado).
 *
 * El diferencial negativo ya no anula la puntuación: aplica una tabla de consolación
 * descendente hasta un suelo de 1 punto (como el resto de variantes). El lado positivo
 * escala con pendiente +3 desde el 0 (7 pts) hasta el tope de 25 en diferencial +6.
 *
 * @param {Object} actuacion - Actuación del piloto.
 * @param {number} actuacion.numeroAdelantos - Número de adelantamientos realizados por el piloto.
 * @param {number} actuacion.numeroVecesAdelantado - Número de veces que el piloto fue adelantado.
 * @returns {number} - Puntos calculados para la variante "remontador".
 */
function puntosRemontador({ numeroAdelantos = 0, numeroVecesAdelantado = 0 }) {
  const diferencial = numeroAdelantos - numeroVecesAdelantado
  if (diferencial <= -5) return PUNTOS_SUELO_REMONTADOR
  if (diferencial >= 6) return PUNTOS_TOPE_REMONTADOR
  return PUNTOS_REMONTADOR_POR_DIFERENCIAL[diferencial]
}

const UMBRAL_STINT_DESCARTADO = 1.0

/**
 * Construye un ranking de stints a partir de las actuaciones de toda la parrilla.
 * Ordena por porcentaje de stint máximo (descendente) y desempata por posición
 * de carrera (ascendente). Descarta los stint del 100% (1.0) porque suelen ser
 * fallos de la API, y excluye a los pilotos que no terminaron (DNF, DNS, DSQ, NC)
 * para que no ocupen puestos del ranking.
 * @param {Object} actuacionesPorPiloto - Actuaciones de toda la parrilla.
 * @returns {Object} - Mapa { numeroPiloto: posicionEnRanking }.
 */
function construirRankingStints(actuacionesPorPiloto = {}) {
  const entradas = Object.entries(actuacionesPorPiloto)
    // Filtro las actuaciones devolviendo el número del stint obtenido y comprobando que no sea un 100%
    .filter(([, actuacion]) => {
      const stint = actuacion?.porcentajeStintMaximo
      return Number.isFinite(stint) && stint > 0 && stint < UMBRAL_STINT_DESCARTADO && !sinActuacionValida(actuacion)
    })
    // Lo mapeo por número
    .map(([numero, actuacion]) => ({
      numero,
      stint: actuacion.porcentajeStintMaximo,
      posicionCarrera: actuacion.posicionCarrera ?? 99,
    }))
    // Lo ordeno por stint y por posición de carrera
    .sort((a, b) => {
      if (b.stint !== a.stint) return b.stint - a.stint
      return a.posicionCarrera - b.posicionCarrera
    })
  // Lo paso a un array ranking
  const ranking = {}
  entradas.forEach((entrada, indice) => {
    ranking[entrada.numero] = indice + 1
  })
  return ranking
}

/**
 * Calcula los puntos de un piloto con la variante "estratega".
 * Puntúa según la posición del piloto en el ranking de stints de la carrera,
 * usando la misma escala que Qualy y Carrera (P1 = 25, P2 = 20, ...).
 * @param {Object} actuacion - Actuación del piloto.
 * @param {number} actuacion.posicionStint - Posición en el ranking de stints.
 * @returns {number} - Puntos según la posición del stint.
 */
function puntosEstratega(actuacion = {}) {
  return puntosPorPosicion(actuacion.posicionStint ?? 20)
}

/**
 * Calcula los puntos de la variante base.
 * @param {Object} actuacion - Actuación del piloto.
 * @param {number} actuacion.posicionQualy - Posición del piloto en la clasificación.
 * @param {number} actuacion.posicionCarrera - Posición del piloto en la carrera.
 * @returns {number} - Puntos base calculados.
 */
function puntosBase(actuacion) {
  const puntosQualy = puntosPorPosicion(actuacion.posicionQualy)
  const puntosCarrera = sinActuacionValida(actuacion) ? 0 : puntosPorPosicion(actuacion.posicionCarrera)
  return redondear((puntosQualy + puntosCarrera) / 2)
}

/**
 * Calcula el multiplicador total de los potenciadores equipados.
 * @param {Array} potenciadores - Lista de potenciadores.
 * @returns {Object} - Multiplicador total y lista de potenciadores aplicados.
 */
function calcularMultiplicadorPotenciadores(potenciadores = []) {
  const aplicados = []
  let bonusAcumulado = 0

  for (const potenciador of potenciadores) {
    if (!potenciador.equipado) continue

    bonusAcumulado += (potenciador.multiplicador || 1) - 1
    aplicados.push({ id: potenciador.id, nombre: potenciador.nombre, multiplicador: potenciador.multiplicador })
  }

const multiplicador = 1 + bonusAcumulado
  return { multiplicador: Math.round(multiplicador * 100) / 100, aplicados }
}

/**
 * Calcula la puntuación total de un garaje en una jornada, para ello se consideran los puntos de los pilotos, el coche y los potenciadores aplicados
 * Recorre los pilotos equipados y calcula sus puntos considerando los multiplicadores de los potenciadores.
 * @param {Object} garaje - Garaje del jugador.
 * @param {Object} contextoJornada - Contexto de la jornada.
 * @param {Object} contextoJornada.puntosPorPiloto - Puntos por piloto.
 * @returns {Object} - Puntuación total y desglose.
 */
function calcularPuntuacionGaraje(garaje, contextoJornada = {}) {
  const { puntosPorPiloto = {} } = contextoJornada

  const pilotosEquipados = (garaje.pilotos || []).filter((p) => p.equipado !== false)

  const { multiplicador, aplicados } = calcularMultiplicadorPotenciadores(garaje.potenciadores || [])
  const desglosePilotos = []
  let puntosPilotos = 0

  for (const piloto of pilotosEquipados) {
    const puntosVariante = puntosPorPiloto[piloto.id] ?? 0
    const puntosJornada = redondear(puntosVariante * multiplicador)
    desglosePilotos.push({
      id: piloto.id,
      nombre: piloto.nombre,
      variante: piloto.variante,
      puntosVariante,
      multiplicador,
      puntosJornada,
    })
    puntosPilotos += puntosJornada
  }

  let desgloseCoche = null
  let puntosCoche = 0
  const cocheEquipado = garaje.coches ? garaje.coches.find((c) => c.equipado) : garaje.coche || null

  if (cocheEquipado) {
    puntosCoche = redondear(cocheEquipado.puntuacionBase ?? cocheEquipado.puntos ?? 0)
    desgloseCoche = { nombre: cocheEquipado.nombre, puntos: puntosCoche }
  }

  return {
    puntosTotal: redondear(puntosPilotos + puntosCoche),
    desglose: { pilotos: desglosePilotos, coche: desgloseCoche, potenciadoresAplicados: aplicados, multiplicadorGlobal: multiplicador },
  }
}

// Redondeo general
function redondear(valor, decimales = 2) {
  const factor = Math.pow(10, decimales)
  return Math.round(valor * factor) / factor
}

module.exports = { calcularPuntosVariante, calcularPuntuacionGaraje, calcularMultiplicadorPotenciadores, calcularFactorCaos, construirRankingStints }

