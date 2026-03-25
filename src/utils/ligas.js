// Reglas y utilidades de ligas

const MAX_LIGAS = 8

// Â¿Ya llegÃ³ al mÃ¡ximo de ligas?
export const alcanzoLimiteLigas = (idsLigas = []) => {
  return Array.isArray(idsLigas) && idsLigas.length >= MAX_LIGAS
}

// CÃ³digo de invitaciÃ³n aleatorio de 6 chars (ej: "A3F9KZ")
export const generarCodigoInvitacionLiga = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

