/**
 * Calcula la puntuacion base ponderada de un piloto segun sus atributos y los pesos de la variante.
 * Formula: (pesoRitmo × ritmo) + (pesoConsistencia × consistencia) + (pesoAdaptabilidad × adaptabilidad)
 * @param {{ ritmo: number, consistencia: number, adaptabilidad: number }} atributos
 * @param {{ ritmo: number, consistencia: number, adaptabilidad: number }} pesos
 * @returns {number} Puntuacion ponderada (0-100), redondeada a 1 decimal
 */
export const calcularPuntuacionBase = (atributos, pesos) => {
  const valor =
    pesos.ritmo * atributos.ritmo +
    pesos.consistencia * atributos.consistencia +
    pesos.adaptabilidad * atributos.adaptabilidad

  return Math.round(valor * 10) / 10
}

/**
 * Escala la puntuacion base (0-100) a puntos de fantasy para una jornada.
 * Se aplica un factor de escala y un componente aleatorio para simular la varianza real.
 * @param {number} puntuacionBase - Valor ponderado (0-100)
 * @param {number} factorJornada - Multiplicador del GP (default 1.0, se puede ajustar por circuito)
 * @returns {number} Puntos de fantasy para esa jornada (0-50 aprox.)
 */
export const calcularPuntosJornada = (puntuacionBase, factorJornada = 1.0) => {
  const escala = puntuacionBase / 100
  const puntosBase = Math.round(escala * 50 * factorJornada)
  const varianza = Math.floor(Math.random() * 11) - 5
  return Math.max(0, puntosBase + varianza)
}

/**
 * Aplica un mapa de mejoras a los atributos base de un piloto.
 * Los valores resultantes se limitan al rango [0, 100] para evitar valores absurdos.
 * @param {{ ritmo: number, consistencia: number, adaptabilidad: number }} atributosBase
 * @param {{ ritmo: number, consistencia: number, adaptabilidad: number }} mejoras
 * @returns {{ ritmo: number, consistencia: number, adaptabilidad: number }}
 */
export function aplicarMejorasAtributos(atributosBase, mejoras) {
  const ritmoFinal = atributosBase.ritmo + (mejoras.ritmo || 0)
  const consistenciaFinal = atributosBase.consistencia + (mejoras.consistencia || 0)
  const adaptabilidadFinal = atributosBase.adaptabilidad + (mejoras.adaptabilidad || 0)

  return {
    ritmo: Math.min(100, Math.max(0, ritmoFinal)),
    consistencia: Math.min(100, Math.max(0, consistenciaFinal)),
    adaptabilidad: Math.min(100, Math.max(0, adaptabilidadFinal)),
  }
}

/**
 * Suma las mejoras de todos los potenciadores que estén equipados.
 * @param {Array<{ mejoras: Object, equipado: boolean }>} potenciadores
 * @returns {{ ritmo: number, consistencia: number, adaptabilidad: number }}
 */
function acumularMejorasPotenciadores(potenciadores) {
  const mejoras = { ritmo: 0, consistencia: 0, adaptabilidad: 0 }

  for (const potenciador of potenciadores) {
    if (potenciador.equipado) {
      mejoras.ritmo += potenciador.mejoras?.ritmo || 0
      mejoras.consistencia += potenciador.mejoras?.consistencia || 0
      mejoras.adaptabilidad += potenciador.mejoras?.adaptabilidad || 0
    }
  }

  return mejoras
}

/* ─── Factores de jornada por variante ──────────────────────────────────── */

/**
 * @param {number} posicion - Posición final en clasificación (1-20)
 * @returns {number}
 */
function resolverFactorPosicionQualy(posicion) {
  if (posicion <= 3) return 1.5
  if (posicion <= 6) return 1.3
  if (posicion <= 10) return 1.15
  if (posicion <= 15) return 0.85
  return 0.65
}

/**
 * @param {number} posicion - Posición final en carrera (1-20; >20 = DNF)
 * @returns {number}
 */
function resolverFactorPosicionCarrera(posicion) {
  if (posicion === 1) return 1.5
  if (posicion === 2) return 1.4
  if (posicion === 3) return 1.3
  if (posicion <= 5) return 1.2
  if (posicion <= 10) return 1.0
  if (posicion <= 15) return 0.75
  if (posicion <= 20) return 0.5
  return 0.2
}

/**
 * @param {number} posicionesGanadas - posicionSalida - posicionFinal (positivo = adelantó)
 * @returns {number}
 */
function resolverFactorAdelantos(posicionesGanadas) {
  if (posicionesGanadas >= 5) return 1.2
  if (posicionesGanadas >= 1) return 1.1
  if (posicionesGanadas === 0) return 1.0
  if (posicionesGanadas >= -3) return 0.85
  return 0.7
}

function calcularFactorQualy({ posicionQualy }) {
  return resolverFactorPosicionQualy(posicionQualy)
}

function calcularFactorCarrera({ posicionCarrera, posicionSalida }) {
  const posicionesGanadas = posicionSalida - posicionCarrera
  const factorPosicion = resolverFactorPosicionCarrera(posicionCarrera)
  const factorAdelantos = resolverFactorAdelantos(posicionesGanadas)
  return Math.round(factorPosicion * factorAdelantos * 100) / 100
}

function calcularFactorTodoTerreno({
  llovio,
  numeroDNFs,
  numeroSafetyCarActivos,
  numeroVirtualSafetyCarActivos,
}) {
  const factorClima = llovio ? 1.4 : 0.9

  let bonusCaos = 0
  bonusCaos += numeroSafetyCarActivos * 0.1
  bonusCaos += numeroVirtualSafetyCarActivos * 0.05
  bonusCaos += numeroDNFs * 0.03

  if (bonusCaos > 0.3) {
    bonusCaos = 0.3
  }

  return Math.round(factorClima * (1 + bonusCaos) * 100) / 100
}

/**
 * Calcula el factor de jornada individual para un piloto según su actuación real en el GP.
 * Cada variante amplifica un tipo diferente de actuación:
 *   - 'qualy'        → posición final en clasificación
 *   - 'carrera'      → posición final + posiciones ganadas respecto a la salida
 *   - 'todo_terreno' → lluvia, safety cars y DNFs de otros pilotos
 *   - 'base'         → promedio de los tres factores anteriores
 *
 * @param {{ posicionQualy: number, posicionCarrera: number, posicionSalida: number }} actuacion
 * @param {{ llovio: boolean, numeroDNFs: number, numeroSafetyCarActivos: number, numeroVirtualSafetyCarActivos: number }} condiciones
 * @param {string} variante - 'qualy' | 'carrera' | 'todo_terreno' | 'base'
 * @returns {number}
 */
export function calcularFactorJornada(actuacion, condiciones, variante) {
  if (variante === 'qualy') {
    return calcularFactorQualy(actuacion)
  }
  if (variante === 'carrera') {
    return calcularFactorCarrera(actuacion)
  }
  if (variante === 'todo_terreno') {
    return calcularFactorTodoTerreno(condiciones)
  }

  const factorQ = calcularFactorQualy(actuacion)
  const factorC = calcularFactorCarrera(actuacion)
  const factorT = calcularFactorTodoTerreno(condiciones)
  return Math.round(((factorQ + factorC + factorT) / 3) * 100) / 100
}

/* ─── Pipeline principal del garaje ─────────────────────────────────────── */

/**
 * Calcula la puntuación total del garaje para una jornada.
 *
 * Flujo de cálculo por piloto:
 *   1. Se acumulan las mejoras de ruedas + potenciadores equipados.
 *   2. Se aplican al mapa de atributos del piloto (clampeado a 0-100).
 *   3. Se recalcula la puntuacionBase con los atributos ya modificados.
 *   4. Se escala a puntos de jornada usando el factor individual del piloto.
 *      Si no se provee factor para un piloto, se usa 1.0 (modo simulación).
 *
 * El coche aporta una contribución plana: Math.round(coche.puntos / 40).
 *
 * @param {{ coche: Object|null, pilotos: Array, potenciadores: Array, ruedas: Object|null }} garaje
 * @param {Object.<string, number>} [factoresPorPiloto={}] - Mapa id-piloto → factor calculado con calcularFactorJornada()
 * @returns {{
 *   puntosTotal: number,
 *   desglose: {
 *     pilotos: Array<{ nombre: string, atributosModificados: Object, puntosJornada: number }>,
 *     coche: { nombre: string, puntos: number } | null
 *   }
 * }}
 */
export function calcularPuntuacionGaraje(garaje, factoresPorPiloto = {}) {
  let mejorasRuedas = { ritmo: 0, consistencia: 0, adaptabilidad: 0 }
  if (garaje.ruedas && garaje.ruedas.mejoras) {
    mejorasRuedas = garaje.ruedas.mejoras
  }

  const mejorasPotenciadores = acumularMejorasPotenciadores(garaje.potenciadores || [])

  const mejorasTotal = {
    ritmo: mejorasRuedas.ritmo + mejorasPotenciadores.ritmo,
    consistencia: mejorasRuedas.consistencia + mejorasPotenciadores.consistencia,
    adaptabilidad: mejorasRuedas.adaptabilidad + mejorasPotenciadores.adaptabilidad,
  }

  const desglosePilotos = []
  let puntosPilotos = 0

  for (const piloto of garaje.pilotos || []) {
    const atributosModificados = aplicarMejorasAtributos(piloto.atributos, mejorasTotal)
    const puntuacionBase = calcularPuntuacionBase(atributosModificados, piloto.pesos)
    const factorEstePiloto = factoresPorPiloto[piloto.id] ?? 1.0
    const puntosJornada = calcularPuntosJornada(puntuacionBase, factorEstePiloto)

    desglosePilotos.push({ nombre: piloto.nombre, atributosModificados, puntosJornada })
    puntosPilotos += puntosJornada
  }

  let desgloseCoche = null
  let puntosCoche = 0

  if (garaje.coche) {
    puntosCoche = Math.round(garaje.coche.puntos / 40)
    desgloseCoche = { nombre: garaje.coche.nombre, puntos: puntosCoche }
  }

  return {
    puntosTotal: puntosPilotos + puntosCoche,
    desglose: { pilotos: desglosePilotos, coche: desgloseCoche },
  }
}
