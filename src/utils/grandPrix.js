/**
 * @fileoverview Funciones para obtener información del próximo Gran Premio de Fórmula 1 usando la API de OpenF1.
 * Incluye funciones para formatear fechas, calcular la cuenta atrás y manejar errores de fetch.
 * Estas funciones se utilizan en el componente NextGrandPrix para mostrar la información del próximo GP.
 */

/**
 * Formatea una fecha ISO a un objeto con fecha y hora legibles en español.
 * @param {string} isoDate - Fecha en formato ISO
 * @returns {{date: string, time: string}} Objeto con fecha y hora formateadas
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
 * Obtiene información del próximo Gran Premio desde la API de OpenF1.
 * @param {object} options - Opciones para la función
 * @param {Function} options.fetchImpl - Implementación de fetch (por defecto fetch global)
 * @param {number} options.year - Año para filtrar los GP (por defecto 2026)
 * @returns {Promise<object|null>} Información del próximo GP o null si no hay más carreras
 */
export const getNextGrandPrix = async ({ fetchImpl = fetch, year = 2026 } = {}) => {
  const response = await fetchImpl(`https://api.openf1.org/v1/meetings?year=${year}`)
  const meetings = await response.json()
  const now = new Date()

  const nextMeeting = meetings
    .filter((meeting) => new Date(meeting.date_end) > now)
    .sort((a, b) => new Date(a.date_start) - new Date(b.date_start))[0]

  if (!nextMeeting) {
    return null
  }

  const { date, time } = formatGrandPrixDate(nextMeeting.date_start)

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
 * Calcula la cuenta atrás para el próximo Gran Premio.
 * @param {string} startDate - Fecha de inicio del GP en formato ISO
 * @param {Date} [now=new Date()] - Fecha actual (para pruebas)
 * @returns {string} Cadena con la cuenta atrás o mensaje si el GP ya comenzó
 */
export const getCountdown = (startDate, now = new Date()) => {
  const raceStart = new Date(startDate)
  const remainingTime = raceStart - now

  if (remainingTime <= 0) {
    return '¡El gran premio ya ha comenzado!'
  }

  const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24))
  const hours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((remainingTime / (1000 * 60)) % 60)
  const seconds = Math.floor((remainingTime / 1000) % 60)

  return `${days}d ${hours}h ${minutes}m ${seconds}s`
}
