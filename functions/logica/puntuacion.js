// Réplica server-side (CommonJS) de src/utils/puntuacion.js.

const { perfilesPuntuacion } = require('../infraestructura/catalogoBase')

const FACTOR_MINIMO = 0.5
const FACTOR_MAXIMO = 1.5

const TABLA_FACTOR_QUALY = [
  { hasta: 3, factor: 1.5 },
  { hasta: 6, factor: 1.25 },
  { hasta: 10, factor: 1.1 },
  { hasta: 15, factor: 0.85 },
  { hasta: Infinity, factor: 0.65 },
]

const TABLA_FACTOR_CARRERA = [
  { hasta: 1, factor: 1.5 },
  { hasta: 2, factor: 1.4 },
  { hasta: 3, factor: 1.3 },
  { hasta: 5, factor: 1.2 },
  { hasta: 10, factor: 1.0 },
  { hasta: 15, factor: 0.8 },
  { hasta: 20, factor: 0.6 },
  { hasta: Infinity, factor: 0.5 },
]

const TABLA_BONUS_STINT = [
  { umbral: 0.6, bonus: 0.5 },
  { umbral: 0.45, bonus: 0.3 },
  { umbral: 0.35, bonus: 0.2 },
  { umbral: 0.25, bonus: 0.1 },
]

const TABLA_BONUS_PARADAS = { 1: 0.15, 2: 0.05 }

const TABLA_BONUS_POSICION_ESTRATEGA = [
  { hasta: 3, bonus: 0.15 },
  { hasta: 10, bonus: 0.05 },
  { hasta: 15, bonus: 0.0 },
  { hasta: Infinity, bonus: -0.1 },
]

function calcularPuntuacionGaraje(garaje, factoresPorPiloto = {}) {
  const mejorasTotal = acumularMejorasPotenciadores(garaje.potenciadores || [])
  const desglosePilotos = []
  let puntosPilotos = 0

  const pilotosEquipados = (garaje.pilotos || []).filter((p) => p.equipado !== false)

  for (const piloto of pilotosEquipados) {
    const atributosModificados = aplicarMejorasAtributos(piloto.atributos, mejorasTotal)
    const pesos = piloto.pesos || perfilesPuntuacion[piloto.perfilPuntuacion]?.pesos || {}
    const valorBase =
      (pesos.ritmo || 0) * atributosModificados.ritmo +
      (pesos.consistencia || 0) * atributosModificados.consistencia +
      (pesos.adaptabilidad || 0) * atributosModificados.adaptabilidad +
      (pesos.agresividad || 0) * (atributosModificados.agresividad || 0) +
      (pesos.gestion || 0) * (atributosModificados.gestion || 0)
    const puntuacionBase = Math.round(valorBase * 10) / 10
    const factorEstePiloto = factoresPorPiloto[piloto.id] ?? 1.0
    const puntosJornada = Math.max(0, Math.round(puntuacionBase * factorEstePiloto))

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
    puntosCoche = Math.round((cocheEquipado.puntuacionBase ?? cocheEquipado.puntos ?? 0) * 10) / 10
    desgloseCoche = { nombre: cocheEquipado.nombre, puntos: puntosCoche }
  }

  return {
    puntosTotal: puntosPilotos + puntosCoche,
    desglose: { pilotos: desglosePilotos, coche: desgloseCoche },
  }
}

function calcularFactorJornada(actuacion, condiciones, variante) {
  if (variante === 'qualy')
    return acotarFactor(buscarFactor(TABLA_FACTOR_QUALY, actuacion.posicionQualy))
  if (variante === 'carrera')
    return acotarFactor(buscarFactor(TABLA_FACTOR_CARRERA, actuacion.posicionCarrera))

  // DNS/ABN/DSQ y No Clasificado anulan Todo Terreno, Remontador y Estratega:
  // ninguna tiene sentido sin haber completado la carrera bajo condiciones reales.
  const sinActuacion =
    actuacion?.dnf || actuacion?.dns || actuacion?.dsq || actuacion?.noClasificado
  if (sinActuacion && variante !== 'base') return FACTOR_MINIMO

  if (variante === 'todo_terreno') return acotarFactor(calcularFactorTodoTerreno(condiciones))
  if (variante === 'remontador') {
    const diferencial = (actuacion.numeroAdelantos || 0) - (actuacion.numeroVecesAdelantado || 0)
    return acotarFactor(1 + diferencial * 0.1)
  }
  if (variante === 'estratega') return acotarFactor(calcularFactorEstrategia(actuacion))

  // La carta base es neutra: nunca amplifica ni penaliza la puntuación.
  return 1.0
}

function buscarFactor(tabla, posicion) {
  return tabla.find((rango) => posicion <= rango.hasta).factor
}

function acotarFactor(factor) {
  if (factor < FACTOR_MINIMO) return FACTOR_MINIMO
  if (factor > FACTOR_MAXIMO) return FACTOR_MAXIMO
  return Math.round(factor * 100) / 100
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

function calcularFactorEstrategia({
  posicionCarrera,
  numeroPitStops,
  porcentajeStintMaximo = 0.5,
}) {
  const bonusStint = TABLA_BONUS_STINT.find((r) => porcentajeStintMaximo >= r.umbral)?.bonus || 0
  const bonusParadas = TABLA_BONUS_PARADAS[numeroPitStops] || 0
  const bonusPosicion = TABLA_BONUS_POSICION_ESTRATEGA.find((r) => posicionCarrera <= r.hasta).bonus
  return 0.7 + bonusStint + bonusParadas + bonusPosicion
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
    if (!potenciador.equipado) continue
    const m = potenciador.mejoras || {}
    mejoras.ritmo += m.ritmo || 0
    mejoras.consistencia += m.consistencia || 0
    mejoras.adaptabilidad += m.adaptabilidad || 0
    mejoras.agresividad += m.agresividad || 0
    mejoras.gestion += m.gestion || 0
  }

  return mejoras
}

module.exports = {
  calcularPuntuacionGaraje,
  calcularFactorJornada,
}
