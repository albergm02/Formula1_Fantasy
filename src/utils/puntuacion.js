// Réplica cliente del cálculo de factores y puntos del servidor
// (functions/dominio/puntuacion.js). Permite simular en la vista de resultados
// qué habría puntuado un piloto bajo cada variante de carta.

const FACTOR_MINIMO = 0.5
const FACTOR_MAXIMO = 1.5

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

export function calcularPuntosJornada(puntuacionBase, factorJornada = 1.0) {
  return Math.max(0, Math.round(puntuacionBase * factorJornada))
}

function acotarFactor(factor) {
  if (factor < FACTOR_MINIMO) return FACTOR_MINIMO
  if (factor > FACTOR_MAXIMO) return FACTOR_MAXIMO
  return Math.round(factor * 100) / 100
}

// DNS/ABN/DSQ anulan Todo Terreno, Remontador y Estratega: ninguna tiene
// sentido sin haber completado la carrera bajo condiciones reales.
function pilotoSinActuacionValida(actuacion) {
  return Boolean(actuacion?.dnf || actuacion?.dns || actuacion?.dsq)
}

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

// Diferencial de adelantamientos: cada unidad vale 0.1 sobre la base 1.0
// (ej: +5 → 1.5, 0 → 1.0, -5 → 0.5). El acotado final lo aplica acotarFactor.
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
