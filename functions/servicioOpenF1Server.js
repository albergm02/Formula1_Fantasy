/**
 * Servicio de comunicación con OpenF1 — server-side (CommonJS).
 * Encapsula TODAS las llamadas HTTP a api.openf1.org para Cloud Functions.
 * Usa fetch nativo de Node 24.
 * @module servicioOpenF1Server
 */

const URL_BASE = 'https://api.openf1.org/v1'

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
  const reuniones = await consultarOpenF1(`/meetings?year=${anio}`)
  const ahora = new Date()

  const finalizadas = reuniones
    .filter(function (reunion) {
      return new Date(reunion.date_end) < ahora
    })
    .sort(function (a, b) {
      return new Date(b.date_end) - new Date(a.date_end)
    })

  return finalizadas.length > 0 ? finalizadas[0] : null
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
 * Obtiene los resultados finales de una sesión.
 * Devuelve un mapa { numeroPiloto → posicion }.
 * @param {number} sessionKey - Clave de la sesión.
 * @returns {Promise<Object>} Ej: { 1: 2, 44: 5, … }
 */
async function obtenerResultadosSesion(sessionKey) {
  const resultados = await consultarOpenF1(`/position?session_key=${sessionKey}`)
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

/* ─── 4. Parrilla de salida ─────────────────────────────────────────────── */

/**
 * Obtiene las posiciones de salida de una sesión de carrera.
 * Devuelve un mapa { numeroPiloto → posicionSalida }.
 * @param {number} sessionKey - Clave de la sesión de carrera.
 * @returns {Promise<Object>} Ej: { 1: 3, 44: 1, … }
 */
async function obtenerParrillaSalida(sessionKey) {
  const posiciones = await consultarOpenF1(`/position?session_key=${sessionKey}`)
  const parrilla = {}

  const primerasPosiciones = {}
  for (const entrada of posiciones) {
    const numero = entrada.driver_number
    if (numero != null && primerasPosiciones[numero] == null) {
      primerasPosiciones[numero] = entrada.position
    }
  }

  for (const numero in primerasPosiciones) {
    if (Object.prototype.hasOwnProperty.call(primerasPosiciones, numero)) {
      parrilla[numero] = primerasPosiciones[numero]
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

  const llovio = datosClima.some(function (lectura) {
    return lectura.rainfall === true || lectura.rainfall === 1
  })

  let numeroSafetyCarActivos = 0
  let numeroVirtualSafetyCarActivos = 0
  let numeroDNFs = 0

  for (const mensaje of datosControlCarrera) {
    const categoria = (mensaje.category || '').toUpperCase()
    const flag = (mensaje.flag || '').toUpperCase()

    if (categoria === 'SAFETYCAR' || flag === 'SAFETY CAR') {
      numeroSafetyCarActivos++
    }

    if (categoria === 'VIRTUALSAFETYCAR' || flag === 'VIRTUAL SAFETY CAR') {
      numeroVirtualSafetyCarActivos++
    }

    if (categoria === 'RETIREMENT' || categoria === 'RETIRED') {
      numeroDNFs++
    }
  }

  return { llovio, numeroDNFs, numeroSafetyCarActivos, numeroVirtualSafetyCarActivos }
}

/* ─── 6. Orquestación: actuación completa de un GP ─────────────────────── */

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
  const parrillaSalida = await obtenerParrillaSalida(sesionCarrera.session_key)
  const condiciones = await obtenerCondicionesCarrera(sesionCarrera.session_key)

  const actuacionesPorPiloto = {}

  for (const numeroPiloto in resultadosCarrera) {
    if (Object.prototype.hasOwnProperty.call(resultadosCarrera, numeroPiloto)) {
      actuacionesPorPiloto[numeroPiloto] = {
        posicionQualy: resultadosQualy[numeroPiloto] || 20,
        posicionCarrera: resultadosCarrera[numeroPiloto],
        posicionSalida: parrillaSalida[numeroPiloto] || resultadosCarrera[numeroPiloto],
      }
    }
  }

  return { actuacionesPorPiloto, condiciones }
}

module.exports = {
  obtenerUltimoGranPremioFinalizado,
  obtenerSesiones,
  extraerSesionQualy,
  extraerSesionCarrera,
  obtenerResultadosSesion,
  obtenerParrillaSalida,
  obtenerCondicionesCarrera,
  recopilarDatosGranPremio,
}
