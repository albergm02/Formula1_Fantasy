/**
 * Funciones puras de puntuacion — copia server-side (CommonJS).
 * Replica exacta de src/utils/puntuacion.js para ejecutarse en Cloud Functions.
 * @module puntuacionServer
 */

/* ─── 1. Pipeline principal del garaje ──────────────────────────────────── */

function calcularPuntuacionGaraje(garaje, factoresPorPiloto = {}) {
  let mejorasRuedas = { ritmo: 0, consistencia: 0, adaptabilidad: 0, agresividad: 0, gestion: 0 }
  if (garaje.ruedas && garaje.ruedas.mejoras) {
    mejorasRuedas = garaje.ruedas.mejoras
  }

  const mejorasPotenciadores = acumularMejorasPotenciadores(garaje.potenciadores || [])

  const mejorasTotal = {
    ritmo: mejorasRuedas.ritmo + mejorasPotenciadores.ritmo,
    consistencia: mejorasRuedas.consistencia + mejorasPotenciadores.consistencia,
    adaptabilidad: mejorasRuedas.adaptabilidad + mejorasPotenciadores.adaptabilidad,
    agresividad: (mejorasRuedas.agresividad || 0) + mejorasPotenciadores.agresividad,
    gestion: (mejorasRuedas.gestion || 0) + mejorasPotenciadores.gestion,
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
    puntosCoche = cocheEquipado.puntos
    desgloseCoche = { nombre: cocheEquipado.nombre, puntos: puntosCoche }
  }

  return {
    puntosTotal: puntosPilotos + puntosCoche,
    desglose: { pilotos: desglosePilotos, coche: desgloseCoche },
  }
}

/* ─── 2. Factores de jornada por variante ───────────────────────────────── */

function calcularFactorJornada(actuacion, condiciones, variante) {
  if (variante === 'qualy') return calcularFactorQualy(actuacion)
  if (variante === 'carrera') return calcularFactorCarrera(actuacion)
  if (variante === 'todo_terreno') return calcularFactorTodoTerreno(condiciones)
  if (variante === 'remontador') return calcularFactorRemontador(actuacion)
  if (variante === 'estratega') return calcularFactorEstrategia(actuacion, condiciones)

  const factorQ = calcularFactorQualy(actuacion)
  const factorC = calcularFactorCarrera(actuacion)
  const factorT = calcularFactorTodoTerreno(condiciones)
  return Math.round(((factorQ + factorC + factorT) / 3) * 100) / 100
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
  const factorClima = llovio ? 1.4 : 0.9

  let bonusCaos = 0
  bonusCaos += numeroSafetyCarActivos * 0.1
  bonusCaos += numeroVirtualSafetyCarActivos * 0.05
  bonusCaos += numeroDNFs * 0.03

  if (bonusCaos > 0.3) bonusCaos = 0.3

  return Math.round(factorClima * (1 + bonusCaos) * 100) / 100
}

/* ─── 3. Factores específicos — Remontador y Estratega ──────────────────── */

/**
 * Factor basado en adelantamientos reales de OpenF1 (/overtakes).
 * Un bonus de posición suaviza el resultado si el piloto también terminó bien.
 * @param {{ posicionCarrera: number, numeroAdelantos: number }} actuacion
 * @returns {number}
 */
function calcularFactorRemontador({ posicionCarrera, numeroAdelantos }) {
  const factorBase = resolverFactorPorAdelantos(numeroAdelantos || 0)
  const bonusPosicion = posicionCarrera <= 5 ? 0.1 : posicionCarrera <= 10 ? 0.05 : 0.0
  return Math.round((factorBase + bonusPosicion) * 100) / 100
}

function resolverFactorPorAdelantos(numeroAdelantos) {
  if (numeroAdelantos >= 7) return 1.8
  if (numeroAdelantos >= 5) return 1.5
  if (numeroAdelantos >= 3) return 1.3
  if (numeroAdelantos >= 1) return 1.1
  return 0.7
}

/**
 * Factor basado en métricas de gestión de stints de OpenF1 (/stints).
 * Premia stints largos, pocas paradas y el caos que permite extender estrategia.
 * @param {{ posicionCarrera: number, numeroPitStops: number, porcentajeStintMaximo: number }} actuacion
 * @param {{ numeroSafetyCarActivos: number, numeroVirtualSafetyCarActivos: number }} condiciones
 * @returns {number}
 */
function calcularFactorEstrategia(
  { posicionCarrera, numeroPitStops, porcentajeStintMaximo = 0.5 },
  condiciones,
) {
  const basePosicion = resolverFactorPosicionCarrera(posicionCarrera) * 0.5
  const bonusStint = resolverBonusGestionStint(porcentajeStintMaximo)
  const bonusParadas = resolverBonusEstrategiaParadas(numeroPitStops || 1)

  let bonusCaos = 0
  if (condiciones) {
    bonusCaos += (condiciones.numeroSafetyCarActivos || 0) * 0.08
    bonusCaos += (condiciones.numeroVirtualSafetyCarActivos || 0) * 0.04
    if (bonusCaos > 0.2) bonusCaos = 0.2
  }

  return Math.round((basePosicion + bonusStint + bonusParadas + bonusCaos) * 100) / 100
}

function resolverBonusGestionStint(porcentajeStintMaximo) {
  if (porcentajeStintMaximo >= 0.6) return 0.35
  if (porcentajeStintMaximo >= 0.4) return 0.2
  if (porcentajeStintMaximo >= 0.25) return 0.1
  return 0.0
}

function resolverBonusEstrategiaParadas(numeroPitStops) {
  if (numeroPitStops === 1) return 0.2
  if (numeroPitStops === 2) return 0.1
  return 0.0
}

/* ─── 4. Tablas de resolución de posición ───────────────────────────────── */

function resolverFactorPosicionQualy(posicion) {
  if (posicion <= 3) return 1.5
  if (posicion <= 6) return 1.3
  if (posicion <= 10) return 1.15
  if (posicion <= 15) return 0.85
  return 0.65
}

function resolverFactorPosicionCarrera(posicion) {
  if (posicion === 1) return 1.5
  if (posicion === 2) return 1.4
  if (posicion === 3) return 1.3
  if (posicion <= 5) return 1.2
  if (posicion <= 10) return 1.0
  if (posicion <= 15) return 0.75
  if (posicion <= 20) return 0.5
  return 0.2
}

/* ─── 5. Utilidades base ────────────────────────────────────────────────── */

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
  const escala = puntuacionBase / 100
  return Math.max(0, Math.round(escala * 50 * factorJornada))
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
