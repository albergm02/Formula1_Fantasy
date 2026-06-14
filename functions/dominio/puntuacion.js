// Réplica server-side (CommonJS) de src/utils/puntuacion.js.

const FACTOR_MINIMO = 0.5
const FACTOR_MAXIMO = 1.5

function calcularPuntuacionGaraje(garaje, factoresPorPiloto = {}) {
  const mejorasPotenciadores = acumularMejorasPotenciadores(garaje.potenciadores || [])

  const mejorasTotal = {
    ritmo: mejorasPotenciadores.ritmo,
    consistencia: mejorasPotenciadores.consistencia,
    adaptabilidad: mejorasPotenciadores.adaptabilidad,
    agresividad: mejorasPotenciadores.agresividad,
    gestion: mejorasPotenciadores.gestion,
  }

  const desglosePilotos = []
  let puntosPilotos = 0

  const pilotosEquipados = (garaje.pilotos || []).filter((p) => p.equipado !== false)

  for (const piloto of pilotosEquipados) {
    const atributosModificados = aplicarMejorasAtributos(piloto.atributos, mejorasTotal)
    const puntuacionBase = calcularPuntuacionBase(atributosModificados, piloto.pesos)
    const factorEstePiloto =
      factoresPorPiloto[piloto.id] != null ? factoresPorPiloto[piloto.id] : 1.0
    const puntosJornada = calcularPuntosJornada(puntuacionBase, factorEstePiloto)

    desglosePilotos.push({
      id: piloto.id,
      nombre: piloto.nombre,
      atributosModificados,
      puntuacionBase,
      factorJornada: factorEstePiloto,
      puntosJornada,
    })
    puntosPilotos += puntosJornada
  }

  let desgloseCoche = null
  let puntosCoche = 0

  const cocheEquipado = garaje.coches ? garaje.coches.find((c) => c.equipado) : garaje.coche || null

  if (cocheEquipado) {
    puntosCoche = Math.round(cocheEquipado.puntos * 10) / 10
    desgloseCoche = { nombre: cocheEquipado.nombre, puntos: puntosCoche }
  }

  return {
    puntosTotal: puntosPilotos + puntosCoche,
    desglose: { pilotos: desglosePilotos, coche: desgloseCoche },
  }
}

function calcularFactorJornada(actuacion, condiciones, variante) {
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

  // La carta base es neutra: nunca amplifica ni penaliza la puntuación.
  // Su factor es siempre 1, al margen de la actuación y de las condiciones.
  return 1.0
}

function acotarFactor(factor) {
  if (factor < FACTOR_MINIMO) return FACTOR_MINIMO
  if (factor > FACTOR_MAXIMO) return FACTOR_MAXIMO
  return Math.round(factor * 100) / 100
}

// DNS/ABN/DSQ y No Clasificado (NC) anulan Todo Terreno, Remontador y
// Estratega: ninguna tiene sentido sin haber completado la carrera de forma
// oficial bajo condiciones reales.
function pilotoSinActuacionValida(actuacion) {
  return Boolean(actuacion?.dnf || actuacion?.dns || actuacion?.dsq || actuacion?.noClasificado)
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
// (+5 → 1.5, 0 → 1.0, -5 → 0.5). El acotado final lo aplica acotarFactor.
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

function calcularPuntuacionBase(atributos, pesos) {
  const valor =
    (pesos.ritmo || 0) * atributos.ritmo +
    (pesos.consistencia || 0) * atributos.consistencia +
    (pesos.adaptabilidad || 0) * atributos.adaptabilidad +
    (pesos.agresividad || 0) * (atributos.agresividad || 0) +
    (pesos.gestion || 0) * (atributos.gestion || 0)
  return Math.round(valor * 10) / 10
}

function calcularPuntosJornada(puntuacionBase, factorJornada = 1.0) {
  return Math.max(0, Math.round(puntuacionBase * factorJornada))
}

function aplicarMejorasAtributos(atributosBase, mejoras) {
  return {
    ritmo: atributosBase.ritmo + (mejoras.ritmo || 0),
    consistencia: atributosBase.consistencia + (mejoras.consistencia || 0),
    adaptabilidad: atributosBase.adaptabilidad + (mejoras.adaptabilidad || 0),
    agresividad: (atributosBase.agresividad || 0) + (mejoras.agresividad || 0),
    gestion: (atributosBase.gestion || 0) + (mejoras.gestion || 0),
  }
}

function acumularMejorasPotenciadores(potenciadores) {
  const mejoras = { ritmo: 0, consistencia: 0, adaptabilidad: 0, agresividad: 0, gestion: 0 }

  for (const potenciador of potenciadores) {
    if (potenciador.equipado) {
      const m = potenciador.mejoras || {}
      mejoras.ritmo += m.ritmo || 0
      mejoras.consistencia += m.consistencia || 0
      mejoras.adaptabilidad += m.adaptabilidad || 0
      mejoras.agresividad += m.agresividad || 0
      mejoras.gestion += m.gestion || 0
    }
  }

  return mejoras
}

module.exports = {
  calcularPuntuacionGaraje,
  calcularFactorJornada,
}
