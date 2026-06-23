/**
 * @module functions/logica/puntuacion
 * @description Funciones de lógica para calcular la puntuación de los pilotos y garajes, incluyendo la aplicación de multiplicadores y factores de caos.
 */

const PUNTOS_FIA_POR_POSICION = { 1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1 }

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
 * @param {number} posicion - Posición del piloto.
 * @returns {number} - Puntos correspondientes a la posición.
 */
function puntosPorPosicion(posicion) {
  return PUNTOS_FIA_POR_POSICION[posicion] || 0
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
  let factor = 0.5
  if (llovio) factor += 0.4
  factor += Math.min(3, numeroSafetyCarActivos + numeroVirtualSafetyCarActivos) * 0.05
  if (numeroDNFs >= 5) factor += 0.1
  return Math.round(factor * 100) / 100
}


const PUNTOS_REMONTADOR_POR_DIFERENCIAL = [0, 3, 7, 12, 18, 25]

/**
 * Calcula los puntos de un piloto con la variante "remontador" según su actuación.
 * @param {Object} actuacion - Actuación del piloto.
 * @param {number} actuacion.numeroAdelantos - Número de adelantamientos realizados por el piloto.
 * @param {number} actuacion.numeroVecesAdelantado - Número de veces que el piloto fue adelantado.
 * @returns {number} - Puntos calculados para la variante "remontador".
 */
function puntosRemontador({ numeroAdelantos = 0, numeroVecesAdelantado = 0 }) {
  const adelantamientosNetos = numeroAdelantos - numeroVecesAdelantado
  if (adelantamientosNetos <= 0) return 0
  const indice = Math.min(adelantamientosNetos, PUNTOS_REMONTADOR_POR_DIFERENCIAL.length - 1)
  return PUNTOS_REMONTADOR_POR_DIFERENCIAL[indice]
}

/**
 * Calcula los puntos de un piloto con la variante "estratega" según su actuación.
 * @param {Object} actuacion - Actuación del piloto.
 * @param {number} actuacion.posicionCarrera - Posición del piloto en la carrera.
 * @param {number} actuacion.numeroPitStops - Número de paradas en boxes del piloto.
 * @param {number} actuacion.porcentajeStintMaximo - Porcentaje del stint más largo del piloto.
 * @returns {number} - Puntos calculados para la variante "estratega".
 */
function puntosEstratega({ posicionCarrera = 20, numeroPitStops = 0, porcentajeStintMaximo = 0 }) {
  if (numeroPitStops === 0) return 0
  return bonusParadas(numeroPitStops) + bonusStint(porcentajeStintMaximo) + bonusPosicionEstratega(posicionCarrera)
}

/**
 * Calcula los puntos de bonificación por el número de paradas en boxes.
 * @param {number} numeroPitStops - Número de paradas en boxes del piloto.
 * @returns {number} - Puntos de bonificación por paradas en boxes.
 */
function bonusParadas(numeroPitStops) {
  if (numeroPitStops === 1) return 10
  if (numeroPitStops === 2) return 5
  return 0
}

/**
 * Calcula los puntos de bonificación por el porcentaje del stint más largo.
 * @param {number} porcentajeStintMaximo - Porcentaje del stint más largo del piloto.
 * @returns {number} - Puntos de bonificación por el stint más largo.
 */
function bonusStint(porcentajeStintMaximo) {
  return Math.round((porcentajeStintMaximo || 0) * 10)
}

/**
 * Calcula los puntos de bonificación por la posición del piloto en la carrera para la variante "estratega".
 * @param {number} posicion - Posición del piloto en la carrera.
 * @returns {number} - Puntos de bonificación por la posición.
 */
function bonusPosicionEstratega(posicion) {
  if (posicion <= 3) return 10
  if (posicion <= 6) return 7
  if (posicion <= 10) return 4
  return 0
}

/**
 * Calcula los puntos base de un piloto según su actuación.
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
  let multiplicador = 1

  for (const potenciador of potenciadores) {
    if (!potenciador.equipado) continue
    multiplicador *= potenciador.multiplicador || 1
    aplicados.push({ id: potenciador.id, nombre: potenciador.nombre, multiplicador: potenciador.multiplicador })
  }

  return { multiplicador: Math.round(multiplicador * 100) / 100, aplicados }
}

/**
 * Calcula la puntuación total de un garaje en una jornada.
 * @param {Object} garaje - Garaje del jugador.
 * @param {Object} contextoJornada - Contexto de la jornada.
 * @param {Object} contextoJornada.puntosPorPiloto - Puntos por piloto.
 * @param {Object} contextoJornada.condiciones - Condiciones de la jornada.
 * @param {Object} contextoJornada.actuacionesPorPiloto - Actuaciones por piloto.
 * @returns {Object} - Puntuación total y desglose.
 */
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

