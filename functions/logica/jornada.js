const { calcularPuntosVariante } = require('./puntuacion')

/**
 * Construye los puntos de cada piloto según su variante y actuación.
 * @param {Array} pilotos - Lista de pilotos.
 * @param {Object} actuacionesPorPiloto - Actuaciones de cada piloto.
 * @param {Object} condiciones - Condiciones de la jornada.
 * @returns {Object} - Puntos y detalles de cada piloto.
 */
function construirPuntosPorPiloto(pilotos, actuacionesPorPiloto, condiciones) {
  const puntos = {}
  const detalles = {}

  for (const piloto of pilotos) {
    const partes = piloto.id.split('_')
    const numero = partes[0]
    const variante = partes.slice(1).join('_')
    const actuacion = actuacionesPorPiloto[numero] || { posicionQualy: 20, posicionCarrera: 20, posicionSalida: 20 }

    puntos[piloto.id] = calcularPuntosVariante(variante, actuacion, condiciones)
    detalles[piloto.id] = { variante, actuacion }
  }

  return { puntos, detalles }
}

module.exports = { construirPuntosPorPiloto }

