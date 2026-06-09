/**
 * Lógica pura de resolución de pujas de un mercado.
 * Aislada en su propio módulo para poder testarla sin depender de Firestore.
 * @module dominio/pujas
 */

/**
 * A partir de la lista de pujas registradas en un mercado, devuelve un mapa
 * con la puja ganadora de cada carta. La ganadora es siempre la de mayor
 * cantidad; si dos pujas empatan en cantidad gana la primera registrada para
 * mantener un comportamiento determinista.
 *
 * @param {Array<{ idCarta: string, cantidad: number }>} pujas
 * @returns {Object<string, Object>} Mapa { idCarta: pujaGanadora }
 */
function seleccionarPujasGanadoras(pujas) {
  const pujasPorCarta = {}
  for (const puja of pujas) {
    const actual = pujasPorCarta[puja.idCarta]
    if (!actual || puja.cantidad > actual.cantidad) {
      pujasPorCarta[puja.idCarta] = puja
    }
  }
  return pujasPorCarta
}

module.exports = { seleccionarPujasGanadoras }
