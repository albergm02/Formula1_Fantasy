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

export const obtenerCuentaRegresiva = (fechaInicio, ahora = new Date()) => {
  const inicioCarrera = new Date(fechaInicio)
  const tiempoRestante = inicioCarrera - ahora

  if (tiempoRestante <= 0) {
    return '¡El gran premio ya ha comenzado!'
  }

  const dias = Math.floor(tiempoRestante / (1000 * 60 * 60 * 24))
  const horas = Math.floor((tiempoRestante / (1000 * 60 * 60)) % 24)
  const minutos = Math.floor((tiempoRestante / (1000 * 60)) % 60)
  const segundos = Math.floor((tiempoRestante / 1000) % 60)

  return `${dias}d ${horas}h ${minutos}m ${segundos}s`
}
