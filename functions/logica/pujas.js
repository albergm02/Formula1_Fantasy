/**
 * @module functions/logica/pujas
 * @description Funciones de lógica para manejar las pujas, incluye el ranking de pujas ganadoras por carta.
 */

/**
 * Agrupa las pujas por carta y las ordena en orden descendente por cantidad.
 * En caso de empate a cantidad, gana el desempate la puja registrada primero (fecha más antigua).
 *
 *
 * @param {Array<Object>} pujas - Lista de pujas (mínimo: idCarta, cantidad, fecha).
 * @returns {Object<string, Array<Object>>} - Ranking de pujas por carta.
 */
function seleccionarPujasGanadoras(pujas) {
  const pujasPorCarta = {}
  for (const puja of pujas) {
    // Agrupo las pujas por carta
    if (!pujasPorCarta[puja.idCarta]) pujasPorCarta[puja.idCarta] = []
    pujasPorCarta[puja.idCarta].push(puja)
  }

  // Ordeno las pujas de cada carta por cantidad descendente y fecha ascendente con getTime
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