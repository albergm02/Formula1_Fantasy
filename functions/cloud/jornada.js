/**
 * Procesamiento semanal de la jornada de Fórmula 1.
 *
 * Cuando termina un Gran Premio, los datos oficiales (clasificación, condiciones
 * meteorológicas, abandonos…) se publican en OpenF1. Cada lunes a las 02:00 UTC,
 * Cloud Scheduler dispara `procesarJornadaSemanal`, que descarga esos datos,
 * recalcula los puntos del garaje de cada participante y reparte el premio
 * económico correspondiente.
 *
 * Toda la operación se materializa en un único batch para garantizar que, si
 * falla, no quede a medias: o se actualizan todas las participaciones y la
 * jornada queda registrada, o no se actualiza nada.
 */

const { onSchedule } = require('firebase-functions/v2/scheduler')

const { db } = require('../comun/firebase')
const { REGION, TEMPORADA_ACTUAL } = require('../comun/constantes')

const {
  recopilarDatosGranPremio,
  obtenerGranPremiosFinalizados,
} = require('../servicioOpenF1Server')
const { calcularPuntuacionGaraje, calcularFactorJornada } = require('../puntuacionServer')
const { calcularSinergias, aplicarSinergia } = require('../sinergiaServer')

/**
 * Convierte la puntuación total de una jornada en un premio económico (en M).
 * Aplico una conversión 10:1 (108 puntos → 10.8 M) para mantener los premios
 * en un rango manejable comparado con los precios del catálogo.
 *
 * @param {number} puntosJornada
 * @returns {number} Premio en millones, redondeado a un decimal.
 */
function calcularPremioJornada(puntosJornada) {
  const premio = (puntosJornada || 0) / 10
  return Math.round(premio * 10) / 10
}

/**
 * Separa el ID de una carta de piloto en `{ numero, variante }`.
 * Los IDs siguen el patrón `'<numero>_<variante>'` (p.ej. `'44_qualy'`,
 * `'3_todo_terreno'`); la variante puede contener guiones bajos, así que la
 * recompongo a partir del segundo segmento.
 *
 * @param {string} idCarta
 * @returns {{ numero: string, variante: string }}
 */
function descomponerIdCarta(idCarta) {
  const partes = idCarta.split('_')
  const numero = partes[0]
  const variante = partes.slice(1).join('_')
  return { numero, variante }
}

/**
 * Construye el mapa de factores multiplicativos por cada carta de piloto del
 * garaje, combinando la actuación real del piloto en el GP con la variante
 * de la carta (qualy, carrera, todo_terreno…).
 *
 * Si OpenF1 no devuelve datos de un piloto concreto, asumo la peor posición
 * (20) para no premiar a un piloto del que no tengo información.
 *
 * @param {Array} pilotos - Pilotos del garaje del participante.
 * @param {Object} actuacionesPorPiloto - Mapa por número de piloto con sus posiciones.
 * @param {Object} condiciones - Lluvia, abandonos, safety cars del GP.
 * @returns {{ factores: Object, detalles: Object }}
 */
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

/**
 * Lógica pura del procesamiento de jornada (sin trigger).
 *
 * La separo de la función programada para poder probarla aisladamente y para
 * que sea fácil reutilizarla desde una callable manual de administración si
 * fuera necesario.
 *
 * Es idempotente: si el último GP con datos ya está en la colección
 * `jornadas`, no repite los cálculos y devuelve un motivo informativo.
 *
 * @returns {Promise<Object>} Resumen del resultado.
 */
async function ejecutarProcesarJornada() {
  const candidatos = await obtenerGranPremiosFinalizados(TEMPORADA_ACTUAL)
  if (candidatos.length === 0) {
    console.log('[Jornada] No hay Gran Premio finalizado para procesar.')
    return { ok: false, motivo: 'sin_gp_finalizado' }
  }

  /* Recorro los GPs candidatos del más reciente al más antiguo hasta dar con
   * uno que (a) tenga datos en OpenF1 y (b) no esté ya procesado. */
  let granPremio = null
  let actuacionesPorPiloto = null
  let condiciones = null
  const omitidos = []

  for (const candidato of candidatos) {
    const idCandidato = `gp_${candidato.meeting_key}`
    const yaProcesada = await db.collection('jornadas').doc(idCandidato).get()
    if (yaProcesada.exists) {
      console.log(`[Jornada] ${idCandidato} ya fue procesada previamente. Omitida.`)
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
      console.warn(
        `[Jornada] GP ${candidato.meeting_key} (${candidato.meeting_name}) sin datos en OpenF1: ${error.message}. Probando el anterior.`,
      )
      omitidos.push({
        meeting_key: candidato.meeting_key,
        nombre: candidato.meeting_name,
        motivo: error.message,
      })
    }
  }

  if (!granPremio) {
    console.log('[Jornada] Ningún GP finalizado tiene datos disponibles en OpenF1.')
    return { ok: false, motivo: 'sin_datos_openf1', omitidos }
  }

  const idJornada = `gp_${granPremio.meeting_key}`

  /* Recorro TODAS las participaciones de TODAS las ligas y voy preparando los
   * updates en un único batch. Para una temporada con decenas de ligas esto
   * está bien holgado dentro del límite de 500 ops; si en el futuro crece, se
   * podría trocear por liga. */
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

    /* Enriquezco el desglose con la variante y la actuación para que el
     * frontend pueda mostrar al jugador POR QUÉ ha sacado esos puntos. */
    for (const pilotoDesglose of resultadoGaraje.desglose.pilotos) {
      const detalle = detallesPorPiloto[pilotoDesglose.id]
      if (detalle) {
        pilotoDesglose.variante = detalle.variante
        pilotoDesglose.actuacion = detalle.actuacion
      }
    }

    const { multiplicadorTotal, sinergias } = calcularSinergias(garaje)
    const puntosJornada = aplicarSinergia(resultadoGaraje.puntosTotal, multiplicadorTotal)

    const puntosAcumulados = (participacion.puntos || 0) + puntosJornada
    const premioJornada = calcularPremioJornada(puntosJornada)
    const presupuestoActualizado =
      Math.round(((participacion.presupuesto || 0) + premioJornada) * 100) / 100

    const desgloseParticipante = {
      nombreGranPremio: granPremio.meeting_name,
      puntosJornada,
      premioJornada,
      multiplicadorSinergia: multiplicadorTotal,
      sinergias,
      condiciones,
      desglose: resultadoGaraje.desglose,
    }

    batch.update(documento.ref, {
      puntos: puntosAcumulados,
      presupuesto: presupuestoActualizado,
      ultimaJornada: desgloseParticipante,
    })

    participacionesProcesadas++
  }

  /* Marco la jornada como procesada DENTRO del mismo batch: o se aplica todo,
   * o no se aplica nada. Así garantizo idempotencia incluso si el commit
   * falla a la mitad. */
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

  console.log(
    `[Jornada] ${idJornada} (${granPremio.meeting_name}) procesada. ${participacionesProcesadas} participaciones.`,
  )

  return {
    ok: true,
    idJornada,
    nombreGranPremio: granPremio.meeting_name,
    participacionesProcesadas,
  }
}

/**
 * Cloud Function programada — procesa la jornada del último GP finalizado.
 *
 * Configuro reintentos con espera larga (30 min) porque la causa típica de
 * fallo es que OpenF1 aún no haya publicado los datos: insistir cada minuto
 * no aportaría nada y consumiría cuota inútilmente.
 */
exports.procesarJornadaSemanal = onSchedule(
  {
    schedule: 'every monday 02:00',
    timeZone: 'UTC',
    region: REGION,
    retryCount: 3,
    minBackoffSeconds: 1800,
  },
  async () => {
    const resultado = await ejecutarProcesarJornada()
    if (!resultado.ok && resultado.motivo !== 'jornada_ya_procesada') {
      throw new Error(`[Jornada] Procesamiento fallido: ${resultado.motivo}`)
    }
  },
)
