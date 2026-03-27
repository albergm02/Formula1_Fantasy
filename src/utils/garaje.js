/**
 * Utilidades del garaje del jugador.
 * @module garaje
 */

/**
 * Devuelve la estructura de garaje vacía para un jugador al unirse a una liga.
 * @returns {{ coche: null, pilotos: [], potenciadores: [], ruedas: null }}
 */
export const crearGarajeVacio = () => ({
  coche: null,
  pilotos: [],
  potenciadores: [],
  ruedas: null,
})

/**
 * Calcula el precio de reventa de un elemento del garaje (50% del precio de compra, redondeado hacia abajo).
 * @param {number} price - Precio original del elemento.
 * @returns {number}
 */
export const calcularValorReventa = (price = 0) => Math.floor(Number(price || 0) * 0.5)
