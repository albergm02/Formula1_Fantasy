/**
 * Utilidades de negocio para la gestión de ligas.
 *
 * Una liga es el espacio competitivo donde varios jugadores compiten entre sí
 * a lo largo de la temporada. Este módulo centraliza las reglas y operaciones
 * auxiliares relacionadas con la creación y pertenencia a ligas.
 */

/**
 * Número máximo de ligas a las que un jugador puede pertenecer simultáneamente.
 * Limitar este valor evita que un jugador sature el sistema creando o
 * uniéndose a ligas de forma masiva.
 */
const USER_LEAGUE_LIMIT = 8

/**
 * Comprueba si un jugador ya ha alcanzado el límite de ligas permitidas.
 *
 * Llámala antes de permitir que el jugador cree o se una a una nueva liga.
 * Si devuelve `true`, debes mostrarle un mensaje de error y bloquear la acción.
 *
 * @param {string[]} [leagueIds=[]] - Array de IDs de ligas a las que pertenece el jugador.
 * @returns {boolean} `true` si ya está en el máximo de ligas permitidas.
 *
 * @example
 * if (hasReachedLeagueLimit(authStore.currentUser.leagueIds)) {
 *   // Mostrar error: "No puedes unirte a más ligas"
 * }
 */
export const hasReachedLeagueLimit = (leagueIds = []) => {
  return Array.isArray(leagueIds) && leagueIds.length >= USER_LEAGUE_LIMIT
}

/**
 * Genera un código de invitación aleatorio para compartir una liga.
 *
 * El código tiene 6 caracteres alfanuméricos en mayúscula (ej: "A3F9KZ").
 * Se basa en Math.random(), lo que ofrece suficiente entropía para ligas
 * de uso casual (no es criptográficamente seguro, pero no es necesario aquí).
 *
 * @returns {string} Código de invitación de 6 caracteres, ej: "X7KP2M".
 *
 * @example
 * const codigo = generateLeagueInviteCode()
 * // "A3F9KZ" (varía en cada llamada)
 */
export const generateLeagueInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}
