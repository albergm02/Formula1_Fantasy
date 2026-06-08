/**
 * Funciones puras de cálculo de factores y puntuación de jornada.
 * Réplica cliente de `functions/puntuacionServer.js` para poder simular,
 * en la vista de resultados, qué habría puntuado un piloto bajo cada variante.
 * @module utils/puntuacion
 */

/**
 * Calcula el factor de jornada de un piloto según su variante,
 * la actuación real (datos de OpenF1) y las condiciones de carrera.
 * @param {Object} actuacion - { posicionQualy, posicionCarrera, posicionSalida, numeroAdelantos, numeroPitStops, porcentajeStintMaximo }
 * @param {Object} condiciones - { llovio, numeroDNFs, numeroSafetyCarActivos, numeroVirtualSafetyCarActivos }
 * @param {string} variante - 'qualy' | 'carrera' | 'todo_terreno' | 'remontador' | 'estratega' | 'base'
 * @returns {number}
 */
export function calcularFactorJornada(actuacion, condiciones, variante) {
  if (variante === 'qualy') return acotarFactor(calcularFactorQualy(actuacion))
  if (variante === 'carrera') return acotarFactor(calcularFactorCarrera(actuacion))
  if (variante === 'todo_terreno') {
    if (pilotoSinActuacionValida(actuacion)) return FACTOR_MINIMO
    return acotarFactor(calcularFactorTodoTerreno(condiciones))
  }
  if (variante === 'remontador') {
    if (pilotoSinActuacionValida(actuacion)) return FACTOR_MINIMO
    return acotarFactor(calcularFactorRemontador(actuacion))
  }
  if (variante === 'estratega') {
    if (pilotoSinActuacionValida(actuacion)) return FACTOR_MINIMO
    return acotarFactor(calcularFactorEstrategia(actuacion))
  }

  const factorQ = calcularFactorQualy(actuacion)
  const factorC = calcularFactorCarrera(actuacion)
  const factorT = calcularFactorTodoTerreno(condiciones)
  return acotarFactor((factorQ + factorC + factorT) / 3)
}

const FACTOR_MINIMO = 0.5
const FACTOR_MAXIMO = 1.5

function acotarFactor(factor) {
  if (factor < FACTOR_MINIMO) return FACTOR_MINIMO
  if (factor > FACTOR_MAXIMO) return FACTOR_MAXIMO
  return Math.round(factor * 100) / 100
}

/**
 * Indica si el piloto no tuvo una actuación válida en carrera: no salió (N/S),
 * abandonó (ABN) o fue descalificado (DESC). En ese caso las variantes Todo
 * Terreno, Remontador y Estratega no premian su actuación y reciben el factor
 * mínimo, porque ninguna de las tres tiene sentido sin haber completado la
 * carrera bajo condiciones reales.
 * @param {{ dnf?: boolean, dns?: boolean, dsq?: boolean }} actuacion
 * @returns {boolean}
 */
function pilotoSinActuacionValida(actuacion) {
  return Boolean(actuacion?.dnf || actuacion?.dns || actuacion?.dsq)
}

/**
 * Convierte la puntuación base del piloto y el factor de jornada en puntos finales.
 * Sin reescalado: el resultado es directamente puntuacionBase × factorJornada.
 * @param {number} puntuacionBase
 * @param {number} factorJornada
 * @returns {number}
 */
export function calcularPuntosJornada(puntuacionBase, factorJornada = 1.0) {
  return Math.max(0, Math.round(puntuacionBase * factorJornada))
}

/* ─── Factores por variante ─────────────────────────────────────────────── */

function calcularFactorQualy({ posicionQualy }) {
  return resolverFactorPosicionQualy(posicionQualy)
}

function calcularFactorCarrera({ posicionCarrera }) {
  return resolverFactorPosicionCarrera(posicionCarrera)
}

function calcularFactorTodoTerreno({
  llovio,
  numeroDNFs,
  numeroSafetyCarActivos,
  numeroVirtualSafetyCarActivos,
}) {
  const factorBase = llovio ? 1 : 0.5
  const bonusCaos =
    (numeroSafetyCarActivos || 0) * 0.05 +
    (numeroVirtualSafetyCarActivos || 0) * 0.05 +
    (numeroDNFs || 0) * 0.1

  return Math.round((factorBase + bonusCaos) * 100) / 100
}

/**
 * Factor basado en el diferencial de adelantamientos: realizados menos
 * recibidos. Cada unidad de diferencial vale 0.1 puntos sobre la base 1.0
 * (ej: +5 → 1.5, 0 → 1.0, -5 → 0.5). El acotado final entre 0.5 y 1.5 lo
 * aplica `acotarFactor` para mantener todas las variantes en el mismo rango.
 * @param {{ numeroAdelantos: number, numeroVecesAdelantado: number }} actuacion
 * @returns {number}
 */
function calcularFactorRemontador({ numeroAdelantos, numeroVecesAdelantado }) {
  const diferencial = (numeroAdelantos || 0) - (numeroVecesAdelantado || 0)
  return 1 + diferencial * 0.1
}

function calcularFactorEstrategia({
  posicionCarrera,
  numeroPitStops,
  porcentajeStintMaximo = 0.5,
}) {
  let factor = 0.7
  factor += resolverBonusGestionStint(porcentajeStintMaximo)
  factor += resolverBonusEstrategiaParadas(numeroPitStops)
  factor += resolverBonusPosicionEstratega(posicionCarrera)
  return factor
}

/* ─── Tablas de resolución ──────────────────────────────────────────────── */

function resolverFactorPosicionQualy(posicion) {
  if (posicion <= 3) return 1.5
  if (posicion <= 6) return 1.25
  if (posicion <= 10) return 1.1
  if (posicion <= 15) return 0.85
  return 0.65
}

function resolverFactorPosicionCarrera(posicion) {
  if (posicion === 1) return 1.5
  if (posicion === 2) return 1.4
  if (posicion === 3) return 1.3
  if (posicion <= 5) return 1.2
  if (posicion <= 10) return 1.0
  if (posicion <= 15) return 0.8
  if (posicion <= 20) return 0.6
  return 0.5
}

function resolverBonusGestionStint(porcentajeStintMaximo) {
  if (porcentajeStintMaximo >= 0.6) return 0.5
  if (porcentajeStintMaximo >= 0.45) return 0.3
  if (porcentajeStintMaximo >= 0.35) return 0.2
  if (porcentajeStintMaximo >= 0.25) return 0.1
  return 0.0
}

function resolverBonusEstrategiaParadas(numeroPitStops) {
  if (numeroPitStops === 1) return 0.15
  if (numeroPitStops === 2) return 0.05
  return 0.0
}

function resolverBonusPosicionEstratega(posicionCarrera) {
  if (posicionCarrera <= 3) return 0.15
  if (posicionCarrera <= 10) return 0.05
  if (posicionCarrera <= 15) return 0.0
  return -0.1
}
