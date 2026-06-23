/**
 * @module ServicioOpenF1
 * @description Servicio para interactuar con la API de OpenF1, incluyendo la obtención de información sobre los Grandes Premios.
 */

/**
 * Formatea la fecha y hora de un Gran Premio.
 * @param {string} fechaIso - Fecha en formato ISO.
 * @returns {Object} - Objeto con la fecha y hora formateadas.
 */
function formatearFechaGranPremio(fechaIso) {
  const fecha = new Date(fechaIso)
  return {
    fecha: fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
    hora: fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
  }
}

/**
 * Obtiene el siguiente Gran Premio.
 * @param {Object} opciones - Opciones de la función.
 * @param {Function} opciones.fetchImpl - Implementación de fetch.
 * @param {number} opciones.anio - Año de la temporada.
 * @returns {Object|null} - Datos del siguiente Gran Premio o null si no hay ninguno.
 */
export async function obtenerSiguienteGranPremio({ fetchImpl = fetch, anio = 2026 } = {}) {
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

/**
 * Obtiene el último Gran Premio finalizado.
 * @param {Object} opciones - Opciones de la función.
 * @param {Function} opciones.fetchImpl - Implementación de fetch.
 * @param {number} opciones.anio - Año de la temporada.
 * @returns {Object|null} - Datos del último Gran Premio finalizado o null si no hay ninguno.
 */
export async function obtenerUltimoGranPremioFinalizado({ fetchImpl = fetch, anio = 2026 } = {}) {
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
