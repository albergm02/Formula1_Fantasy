const formatearFechaGranPremio = (fechaIso) => {
  const fecha = new Date(fechaIso)
  return {
    fecha: fecha.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    hora: fecha.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}

export const obtenerSiguienteGranPremio = async ({ fetchImpl = fetch, anio = 2026 } = {}) => {
  const respuesta = await fetchImpl(`https://api.openf1.org/v1/meetings?year=${anio}`)
  if (!respuesta.ok) {
    const cuerpoError = await respuesta.json().catch(() => ({}))
    throw new Error(cuerpoError?.detail || `Error HTTP ${respuesta.status}`)
  }

  const reuniones = await respuesta.json()
  const ahora = new Date()
  const siguienteReunion = reuniones
    .filter((reunion) => new Date(reunion.date_end) > ahora)
    .sort((primera, segunda) => new Date(primera.date_start) - new Date(segunda.date_start))[0]

  if (!siguienteReunion) return null

  const { fecha, hora } = formatearFechaGranPremio(siguienteReunion.date_start)
  return {
    circuito: siguienteReunion.circuit_short_name,
    nombreGranPremio: siguienteReunion.meeting_name,
    pais: siguienteReunion.country_name,
    fecha,
    hora,
    imagen: siguienteReunion.circuit_image,
    fechaInicio: siguienteReunion.date_start,
    meetingKey: siguienteReunion.meeting_key,
  }
}

export const obtenerUltimoGranPremioFinalizado = async ({
  fetchImpl = fetch,
  anio = 2026,
} = {}) => {
  const respuesta = await fetchImpl(`https://api.openf1.org/v1/meetings?year=${anio}`)
  if (!respuesta.ok) {
    const cuerpoError = await respuesta.json().catch(() => ({}))
    throw new Error(cuerpoError?.detail || `Error HTTP ${respuesta.status}`)
  }

  const reuniones = await respuesta.json()
  const ahora = new Date()
  const ultimaReunion = reuniones
    .filter((reunion) => new Date(reunion.date_end) <= ahora)
    .sort((primera, segunda) => new Date(segunda.date_end) - new Date(primera.date_end))[0]

  if (!ultimaReunion) return null

  const { fecha, hora } = formatearFechaGranPremio(ultimaReunion.date_start)
  return {
    circuito: ultimaReunion.circuit_short_name,
    nombreGranPremio: ultimaReunion.meeting_name,
    pais: ultimaReunion.country_name,
    fecha,
    hora,
    imagen: ultimaReunion.circuit_image,
    fechaInicio: ultimaReunion.date_start,
    fechaFin: ultimaReunion.date_end,
    meetingKey: ultimaReunion.meeting_key,
  }
}
