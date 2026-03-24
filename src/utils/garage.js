/**
 * Crea un objeto de garaje vacío con las propiedades inicializadas.
 * @returns {Object} Un objeto de garaje vacío con coche, pilotos y potenciadores.
 */
export const createEmptyGarage = () => ({
  coche: null,
  pilotos: [],
  potenciadores: [],
})

/**
 * Calcula el valor de reventa de un elemento, aplicando una tasa del 50% sobre su precio original.
 * @param {number} price - El precio original del elemento.
 * @returns {number} El valor de reventa, redondeado hacia abajo.
 */
export const calculateResaleValue = (price = 0) => Math.floor(Number(price || 0) * 0.5)
