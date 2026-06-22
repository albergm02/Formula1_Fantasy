const URL_BASE = 'https://api.openf1.org/v1'
const { pilotosBase } = require('./catalogoBase')

// OpenF1 restringe el acceso global durante una sesión en vivo y responde con
// 401/403 y este texto. Lo señalizamos con un código propio para que el llamador
// pueda bloquear (fail-closed) en lugar de confundirlo con una caída real.
const SESION_EN_DIRECTO = 'SESION_EN_DIRECTO'

// Reintenta automáticamente ante 429 (rate limit) con espera progresiva 2s/4s/6s.
// OpenF1 devuelve 404 con `{ detail: 'No results found.' }` en lugar de [];
// se trata como ausencia de datos para que el llamador decida.
async function consultarOpenF1(ruta) {
  const url = `${URL_BASE}${ruta}`
  const MAXIMO_REINTENTOS = 3

  for (let intento = 0; intento <= MAXIMO_REINTENTOS; intento++) {
    const respuesta = await fetch(url)

    if (respuesta.status === 429 && intento < MAXIMO_REINTENTOS) {
      const esperaMs = (intento + 1) * 2000
      await new Promise((resolve) => setTimeout(resolve, esperaMs))
      continue
    }

    if (respuesta.status === 404) return []

    if (respuesta.status === 401 || respuesta.status === 403) {
      const cuerpo = await respuesta.json().catch(() => ({}))
      const detalle = cuerpo?.detail
      if (typeof detalle === 'string' && detalle.includes('Live F1 session in progress')) {
        const error = new Error('OpenF1 ha restringido el acceso por sesión en directo.')
        error.codigo = SESION_EN_DIRECTO
        throw error
      }
    }

    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status} al consultar ${url}`)

    return respuesta.json()
  }
}

async function obtenerGranPremiosFinalizados(anio) {
  const reuniones = await consultarOpenF1(`/meetings?year=${anio}`)
  const ahora = new Date()

  return reuniones
    .filter((reunion) => new Date(reunion.date_end) < ahora)
    .sort((a, b) => new Date(b.date_end) - new Date(a.date_end))
}

// Meeting más reciente cuya fecha de inicio ya ha pasado (en curso o terminado).
// Devuelve null en pretemporada para que el llamador interprete que no hay
// nada que bloquear.
async function obtenerMeetingKeyEnJuego(anio) {
  const reuniones = await consultarOpenF1(`/meetings?year=${anio}`)
  const ahora = new Date()

  const enJuego = reuniones
    .filter((reunion) => new Date(reunion.date_start) <= ahora)
    .sort((a, b) => new Date(b.date_start) - new Date(a.date_start))[0]

  return enJuego ? enJuego.meeting_key : null
}

function extraerUltimaSesion(sesiones, nombre) {
  const filtradas = sesiones.filter((s) => s.session_name === nombre)
  return filtradas.length > 0 ? filtradas[filtradas.length - 1] : null
}

// Uso `/session_result` (posiciones finales con sanciones, DNF, DNS, DSQ
// aplicados) en lugar del obsoleto `/position`, que emite eventos en vivo y
// no garantiza el orden final.
async function obtenerResultadosSesion(sessionKey) {
  const resultados = await consultarOpenF1(`/session_result?session_key=${sessionKey}`)
  const posicionFinal = {}
  for (const entrada of resultados) {
    if (entrada.driver_number != null && entrada.position != null) posicionFinal[entrada.driver_number] = entrada.position
  }
  return posicionFinal
}

// `/starting_grid` ya incluye sanciones aplicadas al apagado de luces.
async function obtenerParrillaSalida(sessionKey) {
  const entradas = await consultarOpenF1(`/starting_grid?session_key=${sessionKey}`)
  const parrilla = {}
  for (const entrada of entradas) {
    if (entrada.driver_number != null && entrada.position != null) parrilla[entrada.driver_number] = entrada.position
  }
  return parrilla
}

async function obtenerCondicionesCarrera(sessionKey) {
  const datosClima = await consultarOpenF1(`/weather?session_key=${sessionKey}`)
  const datosControlCarrera = await consultarOpenF1(`/race_control?session_key=${sessionKey}`)
  const resultadosCompletos = await consultarOpenF1(`/session_result?session_key=${sessionKey}`)

  const llovio = datosClima.some((lectura) => lectura.rainfall === true || lectura.rainfall === 1)

  let numeroSafetyCarActivos = 0
  let numeroVirtualSafetyCarActivos = 0

  for (const mensaje of datosControlCarrera) {
    const categoria = (mensaje.category || '').toUpperCase()
    const flag = (mensaje.flag || '').toUpperCase()
    const texto = (mensaje.message || '').toUpperCase()

    if (categoria === 'SAFETYCAR' || flag === 'SAFETY CAR' || texto.includes('SAFETY CAR DEPLOYED')) numeroSafetyCarActivos++
    if (categoria === 'VIRTUALSAFETYCAR' || flag === 'VIRTUAL SAFETY CAR' || texto.includes('VIRTUAL SAFETY CAR DEPLOYED')) numeroVirtualSafetyCarActivos++
  }

  // DNFs oficiales desde /session_result (más fiable que parsear race_control).
  let numeroDNFs = 0
  for (const fila of resultadosCompletos) {
    if (fila.dnf === true || fila.dns === true || fila.dsq === true) numeroDNFs++
  }

  return { llovio, numeroDNFs, numeroSafetyCarActivos, numeroVirtualSafetyCarActivos }
}

async function obtenerAdelantamientosPorPiloto(sessionKey) {
  const adelantamientos = await consultarOpenF1(`/overtakes?session_key=${sessionKey}`)
  const conteo = {}

  for (const evento of adelantamientos) {
    const realizador = evento.overtaking_driver_number
    const receptor = evento.overtaken_driver_number

    if (realizador != null) {
      if (!conteo[realizador]) conteo[realizador] = { realizados: 0, recibidos: 0 }
      conteo[realizador].realizados++
    }
    if (receptor != null) {
      if (!conteo[receptor]) conteo[receptor] = { realizados: 0, recibidos: 0 }
      conteo[receptor].recibidos++
    }
  }

  return conteo
}

async function obtenerDatosStintsPorPiloto(sessionKey) {
  const stints = await consultarOpenF1(`/stints?session_key=${sessionKey}`)
  const stintsPorPiloto = {}

  for (const stint of stints) {
    const numero = stint.driver_number
    if (numero == null) continue
    if (!stintsPorPiloto[numero]) stintsPorPiloto[numero] = []
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
      if (vueltasStint > vueltasMaxStint) vueltasMaxStint = vueltasStint
      vueltasTotalPiloto += vueltasStint
    }

    const porcentajeStintMaximo = vueltasTotalPiloto > 0 ? Math.round((vueltasMaxStint / vueltasTotalPiloto) * 100) / 100 : 0.5
    resultado[numero] = { numeroPitStops, porcentajeStintMaximo }
  }

  return resultado
}

// Uso `/pit` (un registro por paso por el pit lane con pit_duration válido)
// porque es más fiable que inferirlo desde /stints, donde un cambio de
// compuesto bajo bandera roja no implica parada real.
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

  // Pilotos sin posición final en /session_result: abandono (DNF), no salida
  // (DNS), descalificación (DSQ) o No Clasificado (NC).
  for (const fila of resultadosCompletosCarrera) {
    const numeroPiloto = fila.driver_number
    if (numeroPiloto == null) continue
    if (resultadosCarrera[numeroPiloto] != null) continue

    const noClasificado = fila.dnf !== true && fila.dns !== true && fila.dsq !== true
    const stintsPiloto = datosStints[numeroPiloto] || { porcentajeStintMaximo: 0 }
    actuacionesPorPiloto[numeroPiloto] = {
      posicionQualy: resultadosQualy[numeroPiloto] || 20,
      posicionCarrera: 99,
      posicionSalida: parrillaSalida[numeroPiloto] || 20,
      numeroAdelantos: adelantamientos[numeroPiloto]?.realizados || 0,
      numeroVecesAdelantado: adelantamientos[numeroPiloto]?.recibidos || 0,
      numeroPitStops: paradasPorPiloto[numeroPiloto] || 0,
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
