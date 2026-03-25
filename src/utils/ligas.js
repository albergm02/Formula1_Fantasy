const MAX_LIGAS = 8

export const alcanzoLimiteLigas = (idsLigas = []) => {
  return Array.isArray(idsLigas) && idsLigas.length >= MAX_LIGAS
}

export const generarCodigoInvitacionLiga = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

