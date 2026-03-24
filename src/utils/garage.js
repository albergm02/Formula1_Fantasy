/**
 * @fileoverview Funciones relacionadas con el garaje del usuario en la liga de Fantasy F1.
 * Esto incluye la creación de un garaje vacío por defecto y el cálculo del valor de reventa de los coches.
 * Estas funciones se utilizan para inicializar el garaje al unirse a una liga y para calcular el valor de reventa al vender un coche.
 */

/**
 * Crea un garaje vacío con estructura predeterminada (sin coche, sin pilotos, sin potenciadores).
 * @returns {object} Garaje vacío
 */
export const createEmptyGarage = () => ({
  coche: null,
  pilotos: [],
  potenciadores: [],
})

/**
 * Calcula el valor de reventa de un coche (50% del precio original, redondeado hacia abajo).
 * @param {number} price - Precio original del coche
 * @returns {number} Valor de reventa
 */
export const calculateResaleValue = (price = 0) => Math.floor(Number(price || 0) * 0.5)
