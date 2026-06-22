const { calcularPuntosVariante } = require('./puntuacion')

// Calcula los puntos de jornada de cada piloto equipado (según su variante)
// y guarda la actuación que los justifica para que el frontend pueda explicar
// al jugador el porqué de la puntuación obtenida. La función es pura: no toca
// Firebase ni red, lo que permite ejercitarla desde tests con fixtures JSON.
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

