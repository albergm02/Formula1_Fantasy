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
  if (variante === 'todo_terreno') return acotarFactor(calcularFactorTodoTerreno(condiciones))
  if (variante === 'remontador') return acotarFactor(calcularFactorRemontador(actuacion))
  if (variante === 'estratega') {
    return acotarFactor(calcularFactorEstrategia(actuacion, condiciones))
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
 * Convierte la puntuación base (0-100) y el factor de jornada en puntos finales.
 * @param {number} puntuacionBase
 * @param {number} factorJornada
 * @returns {number}
 */
export function calcularPuntosJornada(puntuacionBase, factorJornada = 1.0) {
  const escala = puntuacionBase / 100
  return Math.max(0, Math.round(escala * 50 * factorJornada))
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
  const factorClima = llovio ? 1.4 : 0.9

  let bonusCaos = 0
  bonusCaos += numeroSafetyCarActivos * 0.1
  bonusCaos += numeroVirtualSafetyCarActivos * 0.05
  bonusCaos += numeroDNFs * 0.03

  if (bonusCaos > 0.3) bonusCaos = 0.3

  return Math.round(factorClima * (1 + bonusCaos) * 100) / 100
}

function calcularFactorRemontador({ posicionCarrera, numeroAdelantos }) {
  const factorBase = resolverFactorPorAdelantos(numeroAdelantos || 0)
  const bonusPosicion = posicionCarrera <= 5 ? 0.05 : posicionCarrera <= 10 ? 0.025 : 0.0
  return factorBase + bonusPosicion
}

function calcularFactorEstrategia(
  { posicionCarrera, numeroPitStops, porcentajeStintMaximo = 0.5 },
  condiciones,
) {
  let factor = 0.7
  factor += resolverBonusGestionStint(porcentajeStintMaximo)
  factor += resolverBonusEstrategiaParadas(numeroPitStops || 1)
  factor += resolverBonusPosicionEstratega(posicionCarrera)

  if (condiciones) {
    let bonusCaos = 0
    bonusCaos += (condiciones.numeroSafetyCarActivos || 0) * 0.05
    bonusCaos += (condiciones.numeroVirtualSafetyCarActivos || 0) * 0.025
    if (bonusCaos > 0.15) bonusCaos = 0.15
    factor += bonusCaos
  }

  return factor
}

/* ─── Tablas de resolución ──────────────────────────────────────────────── */

function resolverFactorPosicionQualy(posicion) {
  if (posicion <= 3) return 1.45
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

function resolverFactorPorAdelantos(numeroAdelantos) {
  if (numeroAdelantos >= 14) return 1.45
  if (numeroAdelantos >= 10) return 1.3
  if (numeroAdelantos >= 7) return 1.15
  if (numeroAdelantos >= 4) return 1.0
  if (numeroAdelantos >= 1) return 0.8
  return 0.55
}

function resolverBonusGestionStint(porcentajeStintMaximo) {
  if (porcentajeStintMaximo >= 0.6) return 0.45
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
