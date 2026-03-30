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
 * @returns {number} Puntos de fantasy para esa jornada
 */
export const calcularPuntosJornada = (puntuacionBase, factorJornada = 1.0) => {
  const escala = puntuacionBase / 100
  const puntosBase = Math.round(escala * 25 * factorJornada)
  const varianza = Math.floor(Math.random() * 7) - 3
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

/**
 * Calcula la puntuación total del garaje para una jornada.
 *
 * Flujo de cálculo por piloto:
 *   1. Se acumulan las mejoras de ruedas + potenciadores equipados.
 *   2. Se aplican al mapa de atributos del piloto (clampeado a 0-100).
 *   3. Se recalcula la puntuacionBase con los atributos ya modificados.
 *   4. Se escala a puntos de jornada con calcularPuntosJornada().
 *
 * El coche aporta una contribución plana basada en su stat de puntos.
 * Fórmula coche: Math.round(coche.puntos / 40) → un coche con 200 pts aporta 5 pts/jornada.
 *
 * @param {{ coche: Object|null, pilotos: Array, potenciadores: Array, ruedas: Object|null }} garaje
 * @param {number} [factorJornada=1.0] - Multiplicador externo del GP (1.0 por defecto)
 * @returns {{
 *   puntosTotal: number,
 *   desglose: {
 *     pilotos: Array<{ nombre: string, atributosModificados: Object, puntosJornada: number }>,
 *     coche: { nombre: string, puntos: number } | null
 *   }
 * }}
 */
export function calcularPuntuacionGaraje(garaje, factorJornada = 1.0) {
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
    const puntosJornada = calcularPuntosJornada(puntuacionBase, factorJornada)

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
