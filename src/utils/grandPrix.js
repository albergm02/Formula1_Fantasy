const OPENF1_MEETINGS_URL = 'https://api.openf1.org/v1/meetings'

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

export const getNextGrandPrix = async ({ fetchImpl = fetch, year = 2026 } = {}) => {
  const response = await fetchImpl(`${OPENF1_MEETINGS_URL}?year=${year}`)
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
