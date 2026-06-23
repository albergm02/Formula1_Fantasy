// Sistema de puntuación 2026: cada variante extrae sus puntos directamente
// de los datos reales de OpenF1, sin atributos pre-asignados al piloto.
// Los potenciadores actúan como multiplicadores globales sobre la suma de
// puntos del garaje, condicionados opcionalmente al contexto del Gran Premio.

const PUNTOS_FIA_POR_POSICION = { 1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1 }

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

function sinActuacionValida(actuacion) {
  return Boolean(actuacion?.dnf || actuacion?.dns || actuacion?.dsq || actuacion?.noClasificado)
}

function puntosPorPosicion(posicion) {
  return PUNTOS_FIA_POR_POSICION[posicion] || 0
}

function puntosTodoTerreno(actuacion, condiciones) {
  const factorCaos = calcularFactorCaos(condiciones || {})
  return redondear(puntosPorPosicion(actuacion.posicionCarrera) * factorCaos)
}

function calcularFactorCaos({ llovio, numeroSafetyCarActivos = 0, numeroVirtualSafetyCarActivos = 0, numeroDNFs = 0 }) {
  let factor = 0.5
  if (llovio) factor += 0.4
  factor += Math.min(3, numeroSafetyCarActivos + numeroVirtualSafetyCarActivos) * 0.05
  if (numeroDNFs >= 5) factor += 0.1
  return Math.round(factor * 100) / 100
}

// Tabla del Remontador: progresión por diferencial neto de adelantamientos.
// Cada índice representa el diferencial (adelantamientos - veces adelantado).
// La curva premia mucho más la remontada agresiva y se acota en 25 puntos
// para que la carta no escale sin techo en GPs de caos.
const PUNTOS_REMONTADOR_POR_DIFERENCIAL = [0, 3, 7, 12, 18, 25]

function puntosRemontador({ numeroAdelantos = 0, numeroVecesAdelantado = 0 }) {
  const adelantamientosNetos = numeroAdelantos - numeroVecesAdelantado
  if (adelantamientosNetos <= 0) return 0
  const indice = Math.min(adelantamientosNetos, PUNTOS_REMONTADOR_POR_DIFERENCIAL.length - 1)
  return PUNTOS_REMONTADOR_POR_DIFERENCIAL[indice]
}

function puntosEstratega({ posicionCarrera = 20, numeroPitStops = 0, porcentajeStintMaximo = 0 }) {
  if (numeroPitStops === 0) return 0
  return bonusParadas(numeroPitStops) + bonusStint(porcentajeStintMaximo) + bonusPosicionEstratega(posicionCarrera)
}

function bonusParadas(numeroPitStops) {
  if (numeroPitStops === 1) return 10
  if (numeroPitStops === 2) return 5
  return 0
}

function bonusStint(porcentajeStintMaximo) {
  return Math.round((porcentajeStintMaximo || 0) * 10)
}

function bonusPosicionEstratega(posicion) {
  if (posicion <= 3) return 10
  if (posicion <= 6) return 7
  if (posicion <= 10) return 4
  return 0
}

function puntosBase(actuacion) {
  const puntosQualy = puntosPorPosicion(actuacion.posicionQualy)
  const puntosCarrera = sinActuacionValida(actuacion) ? 0 : puntosPorPosicion(actuacion.posicionCarrera)
  return redondear((puntosQualy + puntosCarrera) / 2)
}


function calcularMultiplicadorPotenciadores(potenciadores = []) {
  const aplicados = []
  let multiplicador = 1

  for (const potenciador of potenciadores) {
    if (!potenciador.equipado) continue
    multiplicador *= potenciador.multiplicador || 1
    aplicados.push({ id: potenciador.id, nombre: potenciador.nombre, multiplicador: potenciador.multiplicador })
  }

  return { multiplicador: Math.round(multiplicador * 100) / 100, aplicados }
}


function calcularPuntuacionGaraje(garaje, contextoJornada = {}) {
  const { puntosPorPiloto = {}, condiciones = {}, actuacionesPorPiloto = {} } = contextoJornada

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

function redondear(valor) {
  return Math.round(valor * 100) / 100
}

module.exports = { calcularPuntosVariante, calcularPuntuacionGaraje, calcularMultiplicadorPotenciadores, calcularFactorCaos }

