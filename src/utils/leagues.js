const USER_LEAGUE_LIMIT = 8

/**
 * Verifica si un usuario ha alcanzado el límite de ligas a las que puede pertenecer o crear.
 * @param {Array} leagueIds - Un array de IDs de ligas a las que el usuario pertenece.
 * @returns {boolean} Retorna true si el usuario ha alcanzado el límite de ligas, de lo contrario retorna false.
 */
export const hasReachedLeagueLimit = (leagueIds = []) => {
  return Array.isArray(leagueIds) && leagueIds.length >= USER_LEAGUE_LIMIT
}

/**
 * Genera un código de invitación único para una liga, compuesto por 6 caracteres alfanuméricos en mayúscula.
 * @returns {string} Un código de invitación único para la liga.
 */
export const generateLeagueInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}
