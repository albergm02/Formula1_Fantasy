// Info del próximo Gran Premio via API OpenF1

// Fecha ISO → formato legible en español
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

// Próximo GP del año. Devuelve null si no quedan carreras.
export const obtenerSiguienteGranPremio = async ({ fetchImpl = fetch, anio = 2026 } = {}) => {
  const respuesta = await fetchImpl(`https://api.openf1.org/v1/meetings?year=${anio}`)
  const reuniones = await respuesta.json()
  const ahora = new Date()

  const siguienteReunion = reuniones
    .filter((reunion) => new Date(reunion.date_end) > ahora)
    .sort((primera, segunda) => new Date(primera.date_start) - new Date(segunda.date_start))[0]

  if (!siguienteReunion) {
    return null
  }

  const { fecha, hora } = formatearFechaGranPremio(siguienteReunion.date_start)

  return {
    circuito: siguienteReunion.circuit_short_name,
    nombreGranPremio: siguienteReunion.meeting_name,
    pais: siguienteReunion.country_name,
    fecha,
    hora,
    imagen: siguienteReunion.circuit_image,
    fechaInicio: siguienteReunion.date_start,
  }
}

// Cuenta atrás hasta el GP → "Xd Xh Xm Xs"
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
