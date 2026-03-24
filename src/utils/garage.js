/**
 * Utilidades relacionadas con el garaje del jugador.
 *
 * El garaje es el equipo personal de cada jugador dentro de una liga:
 * contiene su coche, sus pilotos y sus potenciadores activos.
 * Este módulo provee funciones de creación e inicialización del garaje,
 * así como cálculos de valor de reventa.
 */

/**
 * Devuelve la estructura de un garaje completamente vacío.
 *
 * Úsala cuando un jugador se une a una liga por primera vez y todavía
 * no ha comprado nada en el mercado. Es la «plantilla» base del garaje.
 *
 * @returns {{ coche: null, pilotos: [], potenciadores: [] }}
 *
 * @example
 * const garaje = createEmptyGarage()
 * // { coche: null, pilotos: [], potenciadores: [] }
 */
export const createEmptyGarage = () => ({
  coche: null,
  pilotos: [],
  potenciadores: [],
})

/**
 * Calcula cuánto dinero recupera el jugador al vender un elemento.
 *
 * La tasa de reventa es el 50% del precio original. El resultado se redondea
 * hacia abajo para evitar decimales en el presupuesto.
 *
 * @param {number} [price=0] - Precio de compra original del elemento.
 * @returns {number} Créditos que se devuelven al jugador al vender.
 *
 * @example
 * calculateResaleValue(20)  // → 10
 * calculateResaleValue(15)  // → 7  (se redondea hacia abajo)
 * calculateResaleValue()    // → 0  (precio no proporcionado)
 */
export const calculateResaleValue = (price = 0) => Math.floor(Number(price || 0) * 0.5)
