/**
 * Funciones puras de puntuacion — copia server-side (CommonJS).
 * Replica exacta de src/utils/puntuacion.js para ejecutarse en Cloud Functions.
 * @module puntuacionServer
 */

/* ─── 1. Pipeline principal del garaje ──────────────────────────────────── */

function calcularPuntuacionGaraje(garaje, factoresPorPiloto = {}) {
  let mejorasRuedas = { ritmo: 0, consistencia: 0, adaptabilidad: 0 }
  if (garaje.ruedas && garaje.ruedas.mejoras) {
    mejorasRuedas = garaje.ruedas.mejoras
  }

  const mejorasPotenciadores = acumularMejorasPotenciadores(garaje.potenciadores || [])

  const mejorasTotal = {
    ritmo: mejorasRuedas.ritmo + mejorasPotenciadores.ritmo,
    consistencia: mejorasRuedas.consistencia + mejorasPotenciadores.consistencia,
    adaptabilidad: mejorasRuedas.adaptabilidad + mejorasPotenciadores.adaptabilidad,
  }

  const desglosePilotos = []
  let puntosPilotos = 0

  for (const piloto of garaje.pilotos || []) {
    const atributosModificados = aplicarMejorasAtributos(piloto.atributos, mejorasTotal)
    const puntuacionBase = calcularPuntuacionBase(atributosModificados, piloto.pesos)
    const factorEstePiloto =
      factoresPorPiloto[piloto.id] != null ? factoresPorPiloto[piloto.id] : 1.0
    const puntosJornada = calcularPuntosJornada(puntuacionBase, factorEstePiloto)

    desglosePilotos.push({ nombre: piloto.nombre, atributosModificados, puntosJornada })
    puntosPilotos += puntosJornada
  }

  let desgloseCoche = null
  let puntosCoche = 0

  if (garaje.coche) {
    puntosCoche = garaje.coche.puntos
    desgloseCoche = { nombre: garaje.coche.nombre, puntos: puntosCoche }
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

  const factorQ = calcularFactorQualy(actuacion)
  const factorC = calcularFactorCarrera(actuacion)
  const factorT = calcularFactorTodoTerreno(condiciones)
  return Math.round(((factorQ + factorC + factorT) / 3) * 100) / 100
}

function calcularFactorQualy({ posicionQualy }) {
  return resolverFactorPosicionQualy(posicionQualy)
}

function calcularFactorCarrera({ posicionCarrera, posicionSalida }) {
  const posicionesGanadas = posicionSalida - posicionCarrera
  const factorPosicion = resolverFactorPosicionCarrera(posicionCarrera)
  const factorAdelantos = resolverFactorAdelantos(posicionesGanadas)
  return Math.round(factorPosicion * factorAdelantos * 100) / 100
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

function resolverFactorAdelantos(posicionesGanadas) {
  if (posicionesGanadas >= 5) return 1.2
  if (posicionesGanadas >= 1) return 1.1
  if (posicionesGanadas === 0) return 1.0
  if (posicionesGanadas >= -3) return 0.85
  return 0.7
}

/* ─── 3. Utilidades base ────────────────────────────────────────────────── */

function calcularPuntuacionBase(atributos, pesos) {
  const valor =
    pesos.ritmo * atributos.ritmo +
    pesos.consistencia * atributos.consistencia +
    pesos.adaptabilidad * atributos.adaptabilidad
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
  }
}

function acumularMejorasPotenciadores(potenciadores) {
  const mejoras = { ritmo: 0, consistencia: 0, adaptabilidad: 0 }

  for (const potenciador of potenciadores) {
    if (potenciador.equipado) {
      const m = potenciador.mejoras || {}
      mejoras.ritmo += m.ritmo || 0
      mejoras.consistencia += m.consistencia || 0
      mejoras.adaptabilidad += m.adaptabilidad || 0
    }
  }

  return mejoras
}

module.exports = {
  calcularPuntuacionGaraje,
  calcularFactorJornada,
}
