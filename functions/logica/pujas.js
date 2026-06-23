/**
 * @module functions/logica/pujas
 * @description Funciones de lógica para manejar las pujas, incluyendo la selección de pujas ganadoras.
 */

/**
 * Selecciona las pujas ganadoras para cada carta.
 * La ganadora es la puja de mayor cantidad. En caso de empate gana la primera
 * registrada, lo que mantiene un comportamiento determinista.
 * @param {Array} pujas - Lista de pujas.
 * @returns {Object} - Pujas ganadoras por carta.
 */
function seleccionarPujasGanadoras(pujas) {
  const pujasPorCarta = {}
  for (const puja of pujas) {
    const actual = pujasPorCarta[puja.idCarta]
    if (!actual || puja.cantidad > actual.cantidad) pujasPorCarta[puja.idCarta] = puja
  }
  return pujasPorCarta
}

module.exports = { seleccionarPujasGanadoras }
