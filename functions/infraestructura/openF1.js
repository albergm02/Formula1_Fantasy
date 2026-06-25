/**
 * @module functions/infraestructura/openF1
 * @description Servicio para interactuar con la API de OpenF1, incluyendo la obtención de información sobre los Grandes Premios.
 */

const URL_BASE = 'https://api.openf1.org/v1'
const { pilotosBase } = require('./catalogoBase')
const SESION_EN_DIRECTO = 'SESION_EN_DIRECTO'

/**
 * Consulta la API de OpenF1 con reintentos en caso de error 429 (demasiadas solicitudes).
 * @param {string} ruta - Ruta de la API a consultar.
 * @returns {Promise<Object>} - Respuesta de la API en formato JSON.
 * @throws {Error} - Lanza un error si la respuesta no es exitosa o si se alcanza el límite de reintentos.
 */
async function consultarOpenF1(ruta) {
  const url = `${URL_BASE}${ruta}`
  const MAXIMO_REINTENTOS = 3

  for (let intento = 0; intento <= MAXIMO_REINTENTOS; intento++) {
    const respuesta = await fetch(url)

    // Manejo de error 429 (demasiadas solicitudes): espera y reintenta
    if (respuesta.status === 429 && intento < MAXIMO_REINTENTOS) {
      const esperaMs = (intento + 1) * 2000
      await new Promise((resolve) => setTimeout(resolve, esperaMs))
      continue
    }

    // Manejo de error 404: recurso no encontrado
    if (respuesta.status === 404) return []

    // Manejo de errores 401 y 403: acceso no autorizado o prohibido
    if (respuesta.status === 401 || respuesta.status === 403) {
      const cuerpo = await respuesta.json().catch(() => ({}))
      const detalle = cuerpo?.detail
      // Si el detalle indica que hay una sesión en directo, lanza un error específico, 
      // esto es para que que servicio pueda manejarlo y no permitir modificaciones en el equipo durante la sesión en directo.
      if (typeof detalle === 'string' && detalle.includes('Live F1 session in progress')) {
        const error = new Error('OpenF1 ha restringido el acceso por sesión en directo.')
        error.codigo = SESION_EN_DIRECTO
        throw error
      }
    }

    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status} al consultar ${url}`)

    // Si la respuesta es exitosa, devuelve el JSON
    return respuesta.json()
  }
}

/**
 * Obtiene los Grandes Premios finalizados de un año específico.
 * @param {number} anio - Año de los Grandes Premios.
 * @returns {Promise<Array>} - Lista de Grandes Premios finalizados.
 */
async function obtenerGranPremiosFinalizados(anio) {
  const reuniones = await consultarOpenF1(`/meetings?year=${anio}`)
  const ahora = new Date()

  return reuniones
    .filter((reunion) => new Date(reunion.date_end) < ahora)
    .sort((a, b) => new Date(b.date_end) - new Date(a.date_end))
}

/**
 * Obtiene la clave del meeting en curso o más reciente de un año específico.
 * @param {number} anio - Año de los Grandes Premios.
 * @returns {Promise<string|null>} - Clave del meeting en juego o null si no hay ninguno.
 */
async function obtenerMeetingKeyEnJuego(anio) {
  const reuniones = await consultarOpenF1(`/meetings?year=${anio}`)
  const ahora = new Date()

  // Filtra las sesiones que ya han comenzado y ordena por fecha de inicio descendente para obtener la más reciente
  const enJuego = reuniones
    .filter((reunion) => new Date(reunion.date_start) <= ahora)
    .sort((a, b) => new Date(b.date_start) - new Date(a.date_start))[0]

  // Devuelve la clave del meeting en juego o null si no hay ninguno
  return enJuego ? enJuego.meeting_key : null
}

/**
 * Extrae la última sesión de una lista de sesiones por nombre.
 * @param {Array} sesiones - Lista de sesiones.
 * @param {string} nombre - Nombre de la sesión a buscar.
 * @returns {Object|null} - Última sesión encontrada o null si no hay ninguna.
 */
function extraerUltimaSesion(sesiones, nombre) {
  const filtradas = sesiones.filter((s) => s.session_name === nombre)
  return filtradas.length > 0 ? filtradas[filtradas.length - 1] : null
}

/**
 * Obtiene los resultados de una sesión específica.
 * @param {string} sessionKey - Clave de la sesión.
 * @returns {Promise<Object>} - Resultados de la sesión por número de piloto.
 */
async function obtenerResultadosSesion(sessionKey) {
  const resultados = await consultarOpenF1(`/session_result?session_key=${sessionKey}`)
  const posicionFinal = {}
  // Recorro los resultados y construyo un objeto con la posición final de cada piloto por su número
  for (const entrada of resultados) {
    if (entrada.driver_number != null && entrada.position != null) posicionFinal[entrada.driver_number] = entrada.position
  }
  return posicionFinal
}

/**
 * Obtiene la parrilla de salida de una sesión específica.
 * @param {string} sessionKey - Clave de la sesión.
 * @returns {Promise<Object>} - Parrilla de salida por número de piloto.
 */
async function obtenerParrillaSalida(sessionKey) {
  const entradas = await consultarOpenF1(`/starting_grid?session_key=${sessionKey}`)
  const parrilla = {}
  // Recorro las entradas y construyo un objeto con la posición de salida de cada piloto por su número
  for (const entrada of entradas) {
    if (entrada.driver_number != null && entrada.position != null) parrilla[entrada.driver_number] = entrada.position
  }
  return parrilla
}

/**
 * Obtiene las condiciones de una carrera específica, 
 * siendo estas: lluvia, número de DNFs, número de Safety Car activos y número de Virtual Safety Car activos.
 * @param {string} sessionKey - Clave de la sesión.
 * @returns {Promise<Object>} - Condiciones de la carrera ({ llovio, numeroDNFs, numeroSafetyCarActivos, numeroVirtualSafetyCarActivos }).
 */
async function obtenerCondicionesCarrera(sessionKey) {
  const datosClima = await consultarOpenF1(`/weather?session_key=${sessionKey}`)
  const datosControlCarrera = await consultarOpenF1(`/race_control?session_key=${sessionKey}`)
  const resultadosCompletos = await consultarOpenF1(`/session_result?session_key=${sessionKey}`)

  // Determina si llovió durante la carrera: si alguna lectura de clima indica lluvia, se considera que llovió
  const llovio = datosClima.some((lectura) => lectura.rainfall === true || lectura.rainfall === 1)

  let numeroSafetyCarActivos = 0
  let numeroVirtualSafetyCarActivos = 0

  // Recorro los mensajes de control de carrera para contar el número de Safety Car y Virtual Safety Car activos
  for (const mensaje of datosControlCarrera) {
    const categoria = (mensaje.category || '').toUpperCase()
    const flag = (mensaje.flag || '').toUpperCase()
    const texto = (mensaje.message || '').toUpperCase()

    if (categoria === 'SAFETYCAR' || flag === 'SAFETY CAR' || texto.includes('SAFETY CAR DEPLOYED')) numeroSafetyCarActivos++
    if (categoria === 'VIRTUALSAFETYCAR' || flag === 'VIRTUAL SAFETY CAR' || texto.includes('VIRTUAL SAFETY CAR DEPLOYED')) numeroVirtualSafetyCarActivos++
  }

  // DNFs oficiales desde /session_result
  let numeroDNFs = 0
  for (const fila of resultadosCompletos) {
    if (fila.dnf === true || fila.dns === true || fila.dsq === true) numeroDNFs++
  }

  return { llovio, numeroDNFs, numeroSafetyCarActivos, numeroVirtualSafetyCarActivos }
}

/**
 * Obtiene los adelantamientos de una sesión específica por piloto.
 * @param {string} sessionKey - Clave de la sesión.
 * @returns {Promise<Object>} - Adelantamientos por número de piloto.
 */
async function obtenerAdelantamientosPorPiloto(sessionKey) {
  const adelantamientos = await consultarOpenF1(`/overtakes?session_key=${sessionKey}`)
  const conteo = {}

  for (const evento of adelantamientos) {
    const realizador = evento.overtaking_driver_number
    const receptor = evento.overtaken_driver_number

    // Si el piloto realizador es distinto del receptor, incremento el conteo de adelantamientos realizados
    if (realizador != null) {
      if (!conteo[realizador]) conteo[realizador] = { realizados: 0, recibidos: 0 }
      conteo[realizador].realizados++
    }
    // Si el piloto receptor es distinto del realizador, incremento el conteo de adelantamientos recibidos
    if (receptor != null) {
      if (!conteo[receptor]) conteo[receptor] = { realizados: 0, recibidos: 0 }
      conteo[receptor].recibidos++
    }
  }

  return conteo
}

/**
 * Obtiene los datos de stints por piloto de una sesión específica.
 * @param {string} sessionKey - Clave de la sesión.
 * @returns {Promise<Object>} - Datos de stints por número de piloto.
 */
async function obtenerDatosStintsPorPiloto(sessionKey) {
  const stints = await consultarOpenF1(`/stints?session_key=${sessionKey}`)
  
  // Agrupo los stints por número de piloto
  const stintsPorPiloto = {}
  for (const stint of stints) {
    const numero = stint.driver_number
    if (numero == null) continue
    if (!stintsPorPiloto[numero]) stintsPorPiloto[numero] = []
    stintsPorPiloto[numero].push(stint)
  }

  // Para cada piloto calculo:
  // - numeroPitStops: número de stints - 1 (cada stint nuevo = 1 pit stop)
  // - porcentajeStintMaximo: qué porcentaje del total de vueltas representó el stint más largo
  const resultado = {}
  for (const numero in stintsPorPiloto) {
    if (!Object.prototype.hasOwnProperty.call(stintsPorPiloto, numero)) continue
    
    const stintsDelPiloto = stintsPorPiloto[numero]
    const numeroPitStops = Math.max(0, stintsDelPiloto.length - 1)
    
    // Calculo las vueltas de cada stint
    let vueltasMaxStint = 0
    let vueltasTotalPiloto = 0
    for (const stint of stintsDelPiloto) {
      const vueltasStint = (stint.lap_end || 0) - (stint.lap_start || 0) + 1
      if (vueltasStint > vueltasMaxStint) vueltasMaxStint = vueltasStint
      vueltasTotalPiloto += vueltasStint
    }
    
    // Si no hay vueltas (caso raro), uso 0.5 como valor por defecto
    const porcentajeStintMaximo = vueltasTotalPiloto > 0 
      ? Math.round((vueltasMaxStint / vueltasTotalPiloto) * 100) / 100 
      : 0.5
    
    resultado[numero] = { numeroPitStops, porcentajeStintMaximo }
  }

  return resultado
}

/**
 * Obtiene las paradas en boxes de una sesión específica por piloto, necesario para la variante "estratega".
 * @param {string} sessionKey - Clave de la sesión.
 * @returns {Promise<Object>} - Número de paradas por número de piloto.
 */
async function obtenerParadasPorPiloto(sessionKey) {
  const paradas = await consultarOpenF1(`/pit?session_key=${sessionKey}`)
  const conteo = {}

  for (const parada of paradas) {
    const numero = parada.driver_number
    if (numero == null) continue
    if (parada.pit_duration == null) continue
    conteo[numero] = (conteo[numero] || 0) + 1
  }

  return conteo
}

/**
 * Recopila los datos de un Gran Premio específico.
 * @param {string} meetingKey - Clave del meeting.
 * @returns {Promise<Object>} - Datos recopilados del Gran Premio.
 */
async function recopilarDatosGranPremio(meetingKey) {
  const sesiones = await consultarOpenF1(`/sessions?meeting_key=${meetingKey}`)
  const sesionQualy = extraerUltimaSesion(sesiones, 'Qualifying')
  const sesionCarrera = extraerUltimaSesion(sesiones, 'Race')

  if (!sesionCarrera) {
    throw new Error(`No se encontró sesión de carrera para meeting_key: ${meetingKey}`)
  }

  const resultadosQualy = sesionQualy ? await obtenerResultadosSesion(sesionQualy.session_key) : {}
  const resultadosCarrera = await obtenerResultadosSesion(sesionCarrera.session_key)
  const resultadosCompletosCarrera = await consultarOpenF1(`/session_result?session_key=${sesionCarrera.session_key}`)
  const parrillaSalida = sesionQualy ? await obtenerParrillaSalida(sesionQualy.session_key) : {}
  const condiciones = await obtenerCondicionesCarrera(sesionCarrera.session_key)
  const adelantamientos = await obtenerAdelantamientosPorPiloto(sesionCarrera.session_key)
  const datosStints = await obtenerDatosStintsPorPiloto(sesionCarrera.session_key)
  const paradasPorPiloto = await obtenerParadasPorPiloto(sesionCarrera.session_key)

  const actuacionesPorPiloto = {}

  for (const fila of resultadosCompletosCarrera) {
    const numeroPiloto = fila.driver_number
    if (numeroPiloto == null) continue
    if (resultadosCarrera[numeroPiloto] != null) continue

    const noClasificado = fila.dnf !== true && fila.dns !== true && fila.dsq !== true
    const stintsPiloto = datosStints[numeroPiloto] || { porcentajeStintMaximo: 0 }
    actuacionesPorPiloto[numeroPiloto] = {
      posicionQualy: resultadosQualy[numeroPiloto],
      posicionCarrera: 99,
      posicionSalida: parrillaSalida[numeroPiloto],
      numeroAdelantos: adelantamientos[numeroPiloto]?.realizados,
      numeroVecesAdelantado: adelantamientos[numeroPiloto]?.recibidos,
      numeroPitStops: paradasPorPiloto[numeroPiloto],
      porcentajeStintMaximo: stintsPiloto.porcentajeStintMaximo,
      dnf: fila.dnf === true,
      dns: fila.dns === true,
      dsq: fila.dsq === true,
      noClasificado,
    }
  }

  // Pilotos con posición final válida.
  for (const numeroPiloto in resultadosCarrera) {
    if (Object.prototype.hasOwnProperty.call(resultadosCarrera, numeroPiloto)) {
      const stintsPiloto = datosStints[numeroPiloto] || { porcentajeStintMaximo: 0 }

      actuacionesPorPiloto[numeroPiloto] = {
        posicionQualy: resultadosQualy[numeroPiloto] || 20,
        posicionCarrera: resultadosCarrera[numeroPiloto],
        posicionSalida: parrillaSalida[numeroPiloto] || resultadosCarrera[numeroPiloto],
        numeroAdelantos: adelantamientos[numeroPiloto]?.realizados || 0,
        numeroVecesAdelantado: adelantamientos[numeroPiloto]?.recibidos || 0,
        numeroPitStops: paradasPorPiloto[numeroPiloto] || 0,
        porcentajeStintMaximo: stintsPiloto.porcentajeStintMaximo,
        dnf: false,
        dns: false,
        dsq: false,
        noClasificado: false,
      }
    }
  }

  // Pilotos del catálogo canónico ausentes en /session_result: se marcan DNF.
  for (const piloto of pilotosBase) {
    const numeroPiloto = piloto.numero
    if (actuacionesPorPiloto[numeroPiloto]) continue
    actuacionesPorPiloto[numeroPiloto] = {
      posicionQualy: resultadosQualy[numeroPiloto] || 20,
      posicionCarrera: 99,
      posicionSalida: parrillaSalida[numeroPiloto] || resultadosQualy[numeroPiloto] || 20,
      numeroAdelantos: adelantamientos[numeroPiloto]?.realizados || 0,
      numeroVecesAdelantado: adelantamientos[numeroPiloto]?.recibidos || 0,
      numeroPitStops: paradasPorPiloto[numeroPiloto] || 0,
      porcentajeStintMaximo: 0,
      dnf: true,
      dns: false,
      dsq: false,
      noClasificado: false,
    }
  }

  return {
    actuacionesPorPiloto,
    condiciones,
    sessionKeyCarrera: sesionCarrera.session_key,
  }
}

module.exports = { obtenerGranPremiosFinalizados, obtenerMeetingKeyEnJuego, recopilarDatosGranPremio, SESION_EN_DIRECTO }
