const { onSchedule } = require('firebase-functions/v2/scheduler')

const { db } = require('../middleware/firebase')
const { REGION, TEMPORADA_ACTUAL } = require('../middleware/constantes')

const {
  recopilarDatosGranPremio,
  obtenerGranPremiosFinalizados,
} = require('../infraestructura/openF1')
const { calcularPuntuacionGaraje, calcularFactorJornada } = require('../logica/puntuacion')

// Conversión 10:1 (108 puntos → 10.8 M) para mantener los premios en un
// rango manejable comparado con los precios del catálogo.
function calcularPremioJornada(puntosJornada) {
  const premio = (puntosJornada || 0) / 10
  return Math.round(premio * 10) / 10
}

function descomponerIdCarta(idCarta) {
  const partes = idCarta.split('_')
  const numero = partes[0]
  const variante = partes.slice(1).join('_')
  return { numero, variante }
}

function construirFactoresPorPiloto(pilotos, actuacionesPorPiloto, condiciones) {
  const factores = {}
  const detalles = {}

  for (const piloto of pilotos) {
    const { numero, variante } = descomponerIdCarta(piloto.id)
    const actuacion = actuacionesPorPiloto[numero] || {
      posicionQualy: 20,
      posicionCarrera: 20,
      posicionSalida: 20,
    }

    factores[piloto.id] = calcularFactorJornada(actuacion, condiciones, variante)
    detalles[piloto.id] = { variante, actuacion }
  }

  return { factores, detalles }
}

async function ejecutarProcesarJornada() {
  const candidatos = await obtenerGranPremiosFinalizados(TEMPORADA_ACTUAL)
  if (candidatos.length === 0) {
    return { ok: false, motivo: 'sin_gp_finalizado' }
  }

  let granPremio = null
  let actuacionesPorPiloto = null
  let condiciones = null
  const omitidos = []

  for (const candidato of candidatos) {
    const idCandidato = `gp_${candidato.meeting_key}`
    const yaProcesada = await db.collection('jornadas').doc(idCandidato).get()
    if (yaProcesada.exists) {
      return { ok: false, motivo: 'jornada_ya_procesada', idJornada: idCandidato }
    }

    try {
      const datos = await recopilarDatosGranPremio(candidato.meeting_key)
      if (!datos.actuacionesPorPiloto || Object.keys(datos.actuacionesPorPiloto).length === 0) {
        omitidos.push({ meeting_key: candidato.meeting_key, motivo: 'sin_actuaciones' })
        continue
      }
      granPremio = candidato
      actuacionesPorPiloto = datos.actuacionesPorPiloto
      condiciones = datos.condiciones
      break
    } catch (error) {
      omitidos.push({
        meeting_key: candidato.meeting_key,
        nombre: candidato.meeting_name,
        motivo: error.message,
      })
    }
  }

  if (!granPremio) {
    return { ok: false, motivo: 'sin_datos_openf1', omitidos }
  }

  const idJornada = `gp_${granPremio.meeting_key}`

  const todasParticipaciones = await db.collection('participaciones').get()
  const batch = db.batch()
  let participacionesProcesadas = 0

  for (const documento of todasParticipaciones.docs) {
    const participacion = documento.data()
    const garaje = participacion.garaje

    const pilotosEquipados = garaje
      ? (garaje.pilotos || []).filter((p) => p.equipado !== false)
      : []

    if (!garaje || pilotosEquipados.length === 0) {
      continue
    }

    const { factores: factoresPorPiloto, detalles: detallesPorPiloto } = construirFactoresPorPiloto(
      pilotosEquipados,
      actuacionesPorPiloto,
      condiciones,
    )

    const resultadoGaraje = calcularPuntuacionGaraje(garaje, factoresPorPiloto)

    // Enriquezco el desglose con variante y actuación para que el frontend
    // pueda explicar al jugador POR QUÉ ha sacado esos puntos.
    for (const pilotoDesglose of resultadoGaraje.desglose.pilotos) {
      const detalle = detallesPorPiloto[pilotoDesglose.id]
      if (detalle) {
        pilotoDesglose.variante = detalle.variante
        pilotoDesglose.actuacion = detalle.actuacion
      }
    }

    const puntosJornada = resultadoGaraje.puntosTotal

    const puntosAcumulados = (participacion.puntos || 0) + puntosJornada
    const premioJornada = calcularPremioJornada(puntosJornada)
    const presupuestoActualizado =
      Math.round(((participacion.presupuesto || 0) + premioJornada) * 100) / 100

    // Los potenciadores equipados se consumen al procesar la jornada: solo
    // sobreviven los que no estaban en uso durante este Gran Premio.
    const potenciadoresRestantes = (garaje.potenciadores || []).filter((p) => !p.equipado)

    const desgloseParticipante = {
      nombreGranPremio: granPremio.meeting_name,
      puntosJornada,
      premioJornada,
      condiciones,
      desglose: resultadoGaraje.desglose,
    }

    batch.update(documento.ref, {
      puntos: puntosAcumulados,
      presupuesto: presupuestoActualizado,
      ultimaJornada: desgloseParticipante,
      'garaje.potenciadores': potenciadoresRestantes,
    })

    participacionesProcesadas++
  }

  // El marcado de la jornada va en el mismo batch para garantizar atomicidad
  // total: o se aplica todo o no se aplica nada.
  batch.set(db.collection('jornadas').doc(idJornada), {
    meetingKey: granPremio.meeting_key,
    nombreGranPremio: granPremio.meeting_name,
    fechaCarrera: granPremio.date_end,
    fechaProcesamiento: new Date().toISOString(),
    temporada: TEMPORADA_ACTUAL,
    condiciones,
    actuacionesPorPiloto,
  })

  await batch.commit()

  return {
    ok: true,
    idJornada,
    nombreGranPremio: granPremio.meeting_name,
    participacionesProcesadas,
  }
}

// Se procesa el lunes (un día después de la carrera del domingo) para dar
// tiempo a que OpenF1 consolide los resultados oficiales: posiciones
// definitivas, abandonos (DNF) y sanciones ya aplicadas. Procesar el mismo
// domingo capturaba datos provisionales (pilotos aún sin posición asignada o
// con abandonos temporales que luego se reverían).
exports.procesarJornada = onSchedule(
  {
    schedule: 'every monday 19:00',
    timeZone: 'Europe/Madrid',
    region: REGION,
    retryCount: 3,
    minBackoffSeconds: 3600,
  },
  async () => {
    const resultado = await ejecutarProcesarJornada()
    if (!resultado.ok && resultado.motivo !== 'jornada_ya_procesada') {
      throw new Error(`[Jornada] Procesamiento fallido: ${resultado.motivo}`)
    }
  },
)
