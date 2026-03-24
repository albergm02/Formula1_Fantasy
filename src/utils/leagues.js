/**
 * @fileoverview Funciones relacionadas con las ligas, como generación de códigos de invitación
 * y verificación de límites de ligas por usuario.
 * Estas funciones se utilizan para gestionar la creación y unión a ligas,
 * asegurando que los usuarios no excedan el límite permitido y facilitando la generación de códigos únicos.
 * Esto centraliza la lógica relacionada con las ligas y evita repetirla en los componentes.
 */

const USER_LEAGUE_LIMIT = 8

/** Verifica si un usuario ha alcanzado el límite de ligas permitidas.
 * @param {string[]} leagueIds - Array de IDs de ligas a las que el usuario pertenece
 * @returns {boolean} True si el usuario ha alcanzado o superado el límite, false en caso contrario
 */
export const hasReachedLeagueLimit = (leagueIds = []) => {
  return Array.isArray(leagueIds) && leagueIds.length >= USER_LEAGUE_LIMIT
}

/**
 * Genera un código de invitación aleatorio de 6 caracteres (ej: "A3F9KZ")
 * @returns {string} Código de invitación
 */
export const generateLeagueInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}
