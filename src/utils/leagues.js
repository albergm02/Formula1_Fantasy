// Reglas y utilidades de ligas

const MAX_LIGAS = 8

// ¿Ya llegó al máximo de ligas?
export const hasReachedLeagueLimit = (leagueIds = []) => {
  return Array.isArray(leagueIds) && leagueIds.length >= MAX_LIGAS
}

// Código de invitación aleatorio de 6 chars (ej: "A3F9KZ")
export const generateLeagueInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}
