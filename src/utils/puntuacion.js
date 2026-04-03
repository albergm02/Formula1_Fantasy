/**
 * Calcula la puntuacion base ponderada de un piloto segun sus atributos y los pesos de la variante.
 * Formula: (pesoRitmo × ritmo) + (pesoConsistencia × consistencia) + (pesoAdaptabilidad × adaptabilidad)
 * @param {{ ritmo: number, consistencia: number, adaptabilidad: number }} atributos
 * @param {{ ritmo: number, consistencia: number, adaptabilidad: number }} pesos
 * @returns {number} Puntuacion ponderada (0-100), redondeada a 1 decimal
 */
export function calcularPuntuacionBase(atributos, pesos) {
  const valor =
    pesos.ritmo * atributos.ritmo +
    pesos.consistencia * atributos.consistencia +
    pesos.adaptabilidad * atributos.adaptabilidad
  // Subo el decimal y luego lo bajo para redondear a 1 decimal sin usar toFixed (que devuelve string)
  return Math.round(valor * 10) / 10
}
