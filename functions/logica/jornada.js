/**
 * @module functions/logica/jornada
 * @description Funciones de lógica para manejar la jornada, incluyendo la construcción de puntos por piloto según su variante y actuación.
 */

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

  // Para cada piloto, calculo sus puntos según su variante y actuación
  for (const piloto of pilotos) {
    const partes = piloto.id.split('_')
    const numero = partes[0]
    const variante = partes.slice(1).join('_')
    const actuacion = actuacionesPorPiloto[numero] || { posicionQualy: 20, posicionCarrera: 20, posicionSalida: 20 }
    // Calculo los puntos del piloto según su variante y actuación
    puntos[piloto.id] = calcularPuntosVariante(variante, actuacion, condiciones)
    detalles[piloto.id] = { variante, actuacion }
  }
  // Devuelvo un objeto con los puntos y detalles de cada piloto
  return { puntos, detalles }
}

module.exports = { construirPuntosPorPiloto }

