/**
 * @module functions/logica/pujas
 * @description Funciones de lógica para manejar las pujas, incluye el ranking de pujas ganadoras por carta.
 */

/**
 * Agrupa las pujas por carta y las ordena en orden descendente por cantidad.
 * En caso de empate a cantidad, gana el desempate la puja registrada primero
 * (campo `fecha` como tie-breaker ascendente): el orden de iteración por
 * defecto de Firestore es por id de documento, no por tiempo, lo que would
 * otorgar el desempate al email alfabéticamente menor de forma no
 * intencional.
 *
 * El resultado es un mapa idCarta -> Array<puja> ordenado de mayor a menor
 * cantidad. La puja ganadora es el primer elemento; las siguientes actúan
 * como suplentes por si el primero no pudiera asumir el coste (ver
 * `resolverPujasMercado`).
 *
 * @param {Array<Object>} pujas - Lista de pujas (mínimo: idCarta, cantidad, fecha).
 * @returns {Object<string, Array<Object>>} - Ranking de pujas por carta.
 */
function seleccionarPujasGanadoras(pujas) {
  const pujasPorCarta = {}
  for (const puja of pujas) {
    if (!pujasPorCarta[puja.idCarta]) pujasPorCarta[puja.idCarta] = []
    pujasPorCarta[puja.idCarta].push(puja)
  }

  for (const idCarta of Object.keys(pujasPorCarta)) {
    pujasPorCarta[idCarta].sort((primera, segunda) => {
      if (segunda.cantidad !== primera.cantidad) return segunda.cantidad - primera.cantidad
      const fechaPrimera = new Date(primera.fecha || 0).getTime()
      const fechaSegunda = new Date(segunda.fecha || 0).getTime()
      return fechaPrimera - fechaSegunda
    })
  }

  return pujasPorCarta
}

module.exports = { seleccionarPujasGanadoras }