const USER_LEAGUE_LIMIT = 8

export const hasReachedLeagueLimit = (leagueIds = []) => {
  return Array.isArray(leagueIds) && leagueIds.length >= USER_LEAGUE_LIMIT
}

export const generateLeagueInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}
