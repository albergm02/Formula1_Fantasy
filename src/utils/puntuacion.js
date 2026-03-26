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
