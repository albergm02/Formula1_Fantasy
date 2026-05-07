/**
 * Servicio de comunicación con OpenF1 — server-side (CommonJS).
 * Encapsula TODAS las llamadas HTTP a api.openf1.org para Cloud Functions.
 * Usa fetch nativo de Node 24.
 * @module servicioOpenF1Server
 */

const URL_BASE = 'https://api.openf1.org/v1'
const { pilotosBase } = require('./data/catalogoBase')

/* ─── Utilidad HTTP ─────────────────────────────────────────────────────── */

/**
 * Realiza una petición GET a la API de OpenF1 y devuelve el JSON.
 * Reintenta automáticamente ante errores 429 (rate limit) con espera progresiva.
 * @param {string} ruta - Ruta relativa (ej. '/meetings?year=2026').
 * @returns {Promise<Array|Object>}
 */
async function consultarOpenF1(ruta) {
  const url = `${URL_BASE}${ruta}`
  const MAXIMO_REINTENTOS = 3

  // solucion al error 429 Too Many Requests: reintentos con espera progresiva (2s, 4s, 6s)
  for (let intento = 0; intento <= MAXIMO_REINTENTOS; intento++) {
    const respuesta = await fetch(url)

    if (respuesta.status === 429 && intento < MAXIMO_REINTENTOS) {
      const esperaMs = (intento + 1) * 2000
      await new Promise(function (resolve) {
        setTimeout(resolve, esperaMs)
      })
      continue
    }

    // OpenF1 responde 404 con `{ detail: 'No results found.' }` cuando una
    // consulta no produce registros (en lugar de un array vacío). Lo tratamos
    // como ausencia de datos para que el llamador decida cómo continuar.
    if (respuesta.status === 404) {
      return []
    }

    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status} al consultar ${url}`)
    }

    return respuesta.json()
  }
}

/* ─── 1. Último Gran Premio finalizado ──────────────────────────────────── */

/**
 * Obtiene el último Gran Premio cuya fecha de fin ya ha pasado.
 * @param {number} anio - Temporada a consultar.
 * @returns {Promise<Object|null>} meeting_key, meeting_name, date_start, date_end…
 */
async function obtenerUltimoGranPremioFinalizado(anio) {
  const finalizadas = await obtenerGranPremiosFinalizados(anio)
  return finalizadas.length > 0 ? finalizadas[0] : null
}

/**
 * Obtiene TODOS los Grandes Premios finalizados del año, ordenados del más
 * reciente al más antiguo. Útil para iterar hacia atrás si alguno no tiene
 * datos disponibles (GP cancelado, sin /position en OpenF1, etc.).
 * @param {number} anio - Temporada a consultar.
 * @returns {Promise<Array<Object>>}
 */
async function obtenerGranPremiosFinalizados(anio) {
  const reuniones = await consultarOpenF1(`/meetings?year=${anio}`)
  const ahora = new Date()

  return reuniones
    .filter(function (reunion) {
      return new Date(reunion.date_end) < ahora
    })
    .sort(function (a, b) {
      return new Date(b.date_end) - new Date(a.date_end)
    })
}

/* ─── 2. Sesiones de un Gran Premio ─────────────────────────────────────── */

/**
 * Obtiene todas las sesiones de un Gran Premio.
 * @param {number} meetingKey - Clave de la reunión.
 * @returns {Promise<Array>} Lista de sesiones con session_key, session_name, session_type…
 */
async function obtenerSesiones(meetingKey) {
  return consultarOpenF1(`/sessions?meeting_key=${meetingKey}`)
}

/**
 * Filtra la sesión de Qualifying de una lista de sesiones.
 * @param {Array} sesiones - Lista devuelta por obtenerSesiones.
 * @returns {Object|null}
 */
function extraerSesionQualy(sesiones) {
  const qualy = sesiones.filter(function (s) {
    return s.session_name === 'Qualifying'
  })
  return qualy.length > 0 ? qualy[qualy.length - 1] : null
}

/**
 * Filtra la sesión de Carrera de una lista de sesiones.
 * @param {Array} sesiones - Lista devuelta por obtenerSesiones.
 * @returns {Object|null}
 */
function extraerSesionCarrera(sesiones) {
  const carrera = sesiones.filter(function (s) {
    return s.session_name === 'Race'
  })
  return carrera.length > 0 ? carrera[carrera.length - 1] : null
}

/* ─── 3. Resultados de sesión ───────────────────────────────────────────── */

/**
 * Obtiene los resultados oficiales de una sesión usando el endpoint dedicado
 * `/session_result` de OpenF1, que publica las posiciones finales tras la
 * sesión (con sanciones, DNF, DNS y DSQ aplicados). Reemplaza al obsoleto
 * uso de `/position`, que emite eventos en vivo y no garantiza el orden.
 * @param {number} sessionKey - Clave de la sesión.
 * @returns {Promise<Object>} Mapa { numeroPiloto → posicionFinal }.
 */
async function obtenerResultadosSesion(sessionKey) {
  const resultados = await consultarOpenF1(`/session_result?session_key=${sessionKey}`)
  const posicionFinal = {}

  for (const entrada of resultados) {
    const numero = entrada.driver_number
    const posicion = entrada.position
    if (numero != null && posicion != null) {
      posicionFinal[numero] = posicion
    }
  }

  return posicionFinal
}

/**
 * Obtiene los registros completos de `/session_result` (incluye dnf, dns, dsq,
 * duración, número de vueltas) para análisis avanzado de la sesión.
 * @param {number} sessionKey - Clave de la sesión.
 * @returns {Promise<Array<Object>>}
 */
async function obtenerResultadosCompletosSesion(sessionKey) {
  return consultarOpenF1(`/session_result?session_key=${sessionKey}`)
}

/* ─── 4. Parrilla de salida ─────────────────────────────────────────────── */

/**
 * Obtiene la parrilla oficial de salida de una carrera usando el endpoint
 * dedicado `/starting_grid` de OpenF1, que devuelve directamente la posición
 * de cada piloto al apagado de luces (con sanciones aplicadas).
 * @param {number} sessionKey - Clave de la sesión de carrera.
 * @returns {Promise<Object>} Mapa { numeroPiloto → posicionSalida }.
 */
async function obtenerParrillaSalida(sessionKey) {
  const entradas = await consultarOpenF1(`/starting_grid?session_key=${sessionKey}`)
  const parrilla = {}

  for (const entrada of entradas) {
    const numero = entrada.driver_number
    if (numero != null && entrada.position != null) {
      parrilla[numero] = entrada.position
    }
  }

  return parrilla
}

/* ─── 5. Condiciones de carrera (clima + caos) ──────────────────────────── */

/**
 * Agrega las condiciones relevantes de una sesión de carrera:
 * - Si llovió durante la sesión.
 * - Número de Safety Cars y Virtual Safety Cars activados.
 * - Número de abandonos (DNFs / retiros).
 * @param {number} sessionKey - Clave de la sesión.
 * @returns {Promise<{llovio: boolean, numeroDNFs: number, numeroSafetyCarActivos: number, numeroVirtualSafetyCarActivos: number}>}
 */
async function obtenerCondicionesCarrera(sessionKey) {
  const datosClima = await consultarOpenF1(`/weather?session_key=${sessionKey}`)
  const datosControlCarrera = await consultarOpenF1(`/race_control?session_key=${sessionKey}`)
  const resultadosCompletos = await obtenerResultadosCompletosSesion(sessionKey)

  const llovio = datosClima.some(function (lectura) {
    return lectura.rainfall === true || lectura.rainfall === 1
  })

  let numeroSafetyCarActivos = 0
  let numeroVirtualSafetyCarActivos = 0

  for (const mensaje of datosControlCarrera) {
    const categoria = (mensaje.category || '').toUpperCase()
    const flag = (mensaje.flag || '').toUpperCase()
    const texto = (mensaje.message || '').toUpperCase()

    if (
      categoria === 'SAFETYCAR' ||
      flag === 'SAFETY CAR' ||
      texto.includes('SAFETY CAR DEPLOYED')
    ) {
      numeroSafetyCarActivos++
    }
    if (
      categoria === 'VIRTUALSAFETYCAR' ||
      flag === 'VIRTUAL SAFETY CAR' ||
      texto.includes('VIRTUAL SAFETY CAR DEPLOYED')
    ) {
      numeroVirtualSafetyCarActivos++
    }
  }

  // DNFs oficiales desde /session_result (más fiable que parsear race_control).
  let numeroDNFs = 0
  for (const fila of resultadosCompletos) {
    if (fila.dnf === true || fila.dns === true || fila.dsq === true) {
      numeroDNFs++
    }
  }

  return { llovio, numeroDNFs, numeroSafetyCarActivos, numeroVirtualSafetyCarActivos }
}

/* ─── 6. Adelantamientos reales (Remontador) ────────────────────────────── */

/**
 * Obtiene el número de adelantamientos realizados por cada piloto en una sesión.
 * Usa el endpoint /overtakes de OpenF1.
 * @param {number} sessionKey - Clave de la sesión de carrera.
 * @returns {Promise<Object>} Mapa { numeroPiloto → cantidadAdelantos }. Ej: { 1: 5, 44: 3 }
 */
async function obtenerAdelantamientosPorPiloto(sessionKey) {
  const adelantamientos = await consultarOpenF1(`/overtakes?session_key=${sessionKey}`)
  const conteo = {}

  for (const evento of adelantamientos) {
    const numero = evento.overtaking_driver_number
    if (numero != null) {
      conteo[numero] = (conteo[numero] || 0) + 1
    }
  }

  return conteo
}

/* ─── 7. Datos de stints (Estratega) ────────────────────────────────────── */

/**
 * Obtiene las métricas de gestión de stints de cada piloto en una sesión.
 * Calcula el número de pit stops y el porcentaje de vueltas en el stint más largo.
 * Usa el endpoint /stints de OpenF1.
 * @param {number} sessionKey - Clave de la sesión de carrera.
 * @returns {Promise<Object>} Mapa { numeroPiloto → { numeroPitStops, porcentajeStintMaximo } }
 */
async function obtenerDatosStintsPorPiloto(sessionKey) {
  const stints = await consultarOpenF1(`/stints?session_key=${sessionKey}`)
  const stintsPorPiloto = {}

  for (const stint of stints) {
    const numero = stint.driver_number
    if (numero == null) continue

    if (!stintsPorPiloto[numero]) {
      stintsPorPiloto[numero] = []
    }
    stintsPorPiloto[numero].push(stint)
  }

  const resultado = {}

  for (const numero in stintsPorPiloto) {
    if (!Object.prototype.hasOwnProperty.call(stintsPorPiloto, numero)) continue

    const stintsDelPiloto = stintsPorPiloto[numero]
    const numeroPitStops = Math.max(0, stintsDelPiloto.length - 1)

    let vueltasMaxStint = 0
    let vueltasTotalPiloto = 0

    for (const stint of stintsDelPiloto) {
      const vueltasStint = (stint.lap_end || 0) - (stint.lap_start || 0) + 1
      if (vueltasStint > vueltasMaxStint) {
        vueltasMaxStint = vueltasStint
      }
      vueltasTotalPiloto += vueltasStint
    }

    const porcentajeStintMaximo =
      vueltasTotalPiloto > 0 ? Math.round((vueltasMaxStint / vueltasTotalPiloto) * 100) / 100 : 0.5

    resultado[numero] = { numeroPitStops, porcentajeStintMaximo }
  }

  return resultado
}

/* ─── 8. Orquestación: actuación completa de un GP ─────────────────────── */

/**
 * Recopila todos los datos necesarios de un GP finalizado para calcular factores.
 * Devuelve actuaciones por piloto (posición qualy, posición carrera, posición salida)
 * y las condiciones globales de la carrera.
 * @param {number} meetingKey - Clave de la reunión del GP.
 * @returns {Promise<{actuacionesPorPiloto: Object, condiciones: Object}>}
 */
async function recopilarDatosGranPremio(meetingKey) {
  const sesiones = await obtenerSesiones(meetingKey)
  const sesionQualy = extraerSesionQualy(sesiones)
  const sesionCarrera = extraerSesionCarrera(sesiones)

  if (!sesionCarrera) {
    throw new Error(`No se encontró sesión de carrera para meeting_key: ${meetingKey}`)
  }

  const resultadosQualy = sesionQualy ? await obtenerResultadosSesion(sesionQualy.session_key) : {}
  const resultadosCarrera = await obtenerResultadosSesion(sesionCarrera.session_key)
  const resultadosCompletosCarrera = await obtenerResultadosCompletosSesion(
    sesionCarrera.session_key,
  )
  const parrillaSalida = sesionQualy ? await obtenerParrillaSalida(sesionQualy.session_key) : {}
  const condiciones = await obtenerCondicionesCarrera(sesionCarrera.session_key)
  const adelantamientos = await obtenerAdelantamientosPorPiloto(sesionCarrera.session_key)
  const datosStints = await obtenerDatosStintsPorPiloto(sesionCarrera.session_key)

  const actuacionesPorPiloto = {}

  // 1º DNFs/DNS/DSQ desde resultados completos (sin posición final).
  for (const fila of resultadosCompletosCarrera) {
    const numeroPiloto = fila.driver_number
    if (numeroPiloto == null) continue
    if (resultadosCarrera[numeroPiloto] != null) continue

    const stintsPiloto = datosStints[numeroPiloto] || {
      numeroPitStops: 0,
      porcentajeStintMaximo: 0,
    }
    actuacionesPorPiloto[numeroPiloto] = {
      posicionQualy: resultadosQualy[numeroPiloto] || 20,
      posicionCarrera: 99,
      posicionSalida: parrillaSalida[numeroPiloto] || 20,
      numeroAdelantos: adelantamientos[numeroPiloto] || 0,
      numeroPitStops: stintsPiloto.numeroPitStops,
      porcentajeStintMaximo: stintsPiloto.porcentajeStintMaximo,
      dnf: fila.dnf === true,
      dns: fila.dns === true,
      dsq: fila.dsq === true,
    }
  }

  // 2º Pilotos con posición final válida.
  for (const numeroPiloto in resultadosCarrera) {
    if (Object.prototype.hasOwnProperty.call(resultadosCarrera, numeroPiloto)) {
      const stintsPiloto = datosStints[numeroPiloto] || {
        numeroPitStops: 1,
        porcentajeStintMaximo: 0.5,
      }

      actuacionesPorPiloto[numeroPiloto] = {
        posicionQualy: resultadosQualy[numeroPiloto] || 20,
        posicionCarrera: resultadosCarrera[numeroPiloto],
        posicionSalida: parrillaSalida[numeroPiloto] || resultadosCarrera[numeroPiloto],
        numeroAdelantos: adelantamientos[numeroPiloto] || 0,
        numeroPitStops: stintsPiloto.numeroPitStops,
        porcentajeStintMaximo: stintsPiloto.porcentajeStintMaximo,
        dnf: false,
        dns: false,
        dsq: false,
      }
    }
  }

  // 3º Pilotos del catalogo canonico ausentes en /session_result — marcar como DNF.
  for (const piloto of pilotosBase) {
    const numeroPiloto = piloto.numero
    if (actuacionesPorPiloto[numeroPiloto]) continue
    actuacionesPorPiloto[numeroPiloto] = {
      posicionQualy: resultadosQualy[numeroPiloto] || 20,
      posicionCarrera: 99,
      posicionSalida: parrillaSalida[numeroPiloto] || resultadosQualy[numeroPiloto] || 20,
      numeroAdelantos: adelantamientos[numeroPiloto] || 0,
      numeroPitStops: 0,
      porcentajeStintMaximo: 0,
      dnf: true,
      dns: false,
      dsq: false,
    }
  }

  return { actuacionesPorPiloto, condiciones }
}

module.exports = {
  obtenerUltimoGranPremioFinalizado,
  obtenerGranPremiosFinalizados,
  obtenerSesiones,
  extraerSesionQualy,
  extraerSesionCarrera,
  obtenerResultadosSesion,
  obtenerResultadosCompletosSesion,
  obtenerParrillaSalida,
  obtenerCondicionesCarrera,
  obtenerAdelantamientosPorPiloto,
  obtenerDatosStintsPorPiloto,
  recopilarDatosGranPremio,
}
