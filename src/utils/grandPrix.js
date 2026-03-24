/**
 * Formatea una fecha ISO de un gran premio a un formato legible en español.
 * @param {string} isoDate - La fecha en formato ISO (ejemplo: "2024-07-28T14:00:00Z").
 * @returns {Object} Un objeto con la fecha formateada y la hora formateada.
 */
const formatGrandPrixDate = (isoDate) => {
  const date = new Date(isoDate)

  return {
    date: date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}
/**
 * Obtiene el próximo gran premio de Fórmula 1 utilizando la API de OpenF1.
 * @param {Function} options.fetchImpl - Implementación de fetch (por defecto, la función global fetch).
 * @param {number} options.year - Año para filtrar los grandes premios (por defecto, 2026).
 * @returns {Promise<Object|null>} Un objeto con los detalles del próximo gran premio o null si no hay próximos eventos.
 */
export const getNextGrandPrix = async ({ fetchImpl = fetch, year = 2026 } = {}) => {
  // Obtenemos la lista de grandes premios para el año especificado.
  const response = await fetchImpl(`https://api.openf1.org/v1/meetings?year=${year}`)
  const meetings = await response.json()
  const now = new Date()
  // Filtramos los grandes premios que aún no han comenzado y ordenamos por fecha de inicio.
  const nextMeeting = meetings
    .filter((meeting) => new Date(meeting.date_end) > now)
    .sort((a, b) => new Date(a.date_start) - new Date(b.date_start))[0]
  // Si no hay próximos grandes premios, retornamos null.
  if (!nextMeeting) {
    return null
  }
  // Formateamos la fecha y hora del próximo gran premio para mostrarla de manera legible.
  const { date, time } = formatGrandPrixDate(nextMeeting.date_start)

  // Devolvemos un objeto con los detalles del próximo gran premio.
  return {
    circuit: nextMeeting.circuit_short_name,
    grandPrixName: nextMeeting.meeting_name,
    country: nextMeeting.country_name,
    date,
    time,
    image: nextMeeting.circuit_image,
    startDate: nextMeeting.date_start,
  }
}

/**
 * Calcula el tiempo restante para el próximo gran premio y devuelve una cadena con el formato "Xd Xh Xm Xs".
 * @param {string} startDate - La fecha de inicio del gran premio en formato ISO.
 * @param {Date} [now=new Date()] - La fecha actual (opcional, por defecto se usa la fecha actual).
 * @returns {string} Una cadena que representa el tiempo restante para el gran premio o un mensaje si ya ha comenzado.
 */
export const getCountdown = (startDate, now = new Date()) => {
  // Calculamos la diferencia entre la fecha de inicio del gran premio y la fecha actual.
  const raceStart = new Date(startDate)
  const remainingTime = raceStart - now
  // Si el tiempo restante es menor o igual a cero, significa que el gran premio ya ha comenzado.
  if (remainingTime <= 0) {
    return '¡El gran premio ya ha comenzado!'
  }
  // Calculamos los días, horas, minutos y segundos restantes y formateamos la cadena de salida.
  const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24))
  const hours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((remainingTime / (1000 * 60)) % 60)
  const seconds = Math.floor((remainingTime / 1000) % 60)
  // Devolvemos una cadena con el formato "Xd Xh Xm Xs" que representa el tiempo restante para el gran premio.
  return `${days}d ${hours}h ${minutes}m ${seconds}s`
}
