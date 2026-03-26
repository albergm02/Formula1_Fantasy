/**
 * Bonus de sinergia de equipo: si un piloto y el coche son del mismo equipo.
 */
const BONUS_EQUIPO_COMPLETO = 0.15

/**
 * Bonus por combo de variantes: si los 2 pilotos tienen variantes distintas.
 */
const BONUS_COMBO_VARIANTE = 0.1

/**
 * Calcula los bonus de sinergia aplicables al garaje del jugador.
 * @param {{ coche: Object|null, pilotos: Array, potenciadores: Array }} garaje
 * @returns {{ sinergias: Array<{ nombre: string, bonus: number, descripcion: string }>, multiplicadorTotal: number }}
 */
export const calcularSinergias = (garaje) => {
  const sinergias = []

  const coche = garaje.coche
  const pilotos = garaje.pilotos || []

  if (coche && pilotos.length > 0) {
    const pilotosDelEquipo = pilotos.filter(
      (p) =>
        p.equipo === coche.nombre ||
        coche.id?.includes(p.equipo?.toLowerCase().replace(/\s+/g, '_')),
    )
    if (pilotosDelEquipo.length > 0) {
      sinergias.push({
        nombre: 'Equipo Completo',
        bonus: BONUS_EQUIPO_COMPLETO,
        descripcion: `+${BONUS_EQUIPO_COMPLETO * 100}% por alinear piloto(s) con coche del mismo equipo.`,
      })
    }
  }

  if (pilotos.length === 2 && pilotos[0].variante !== pilotos[1].variante) {
    sinergias.push({
      nombre: 'Combo Variante',
      bonus: BONUS_COMBO_VARIANTE,
      descripcion: `+${BONUS_COMBO_VARIANTE * 100}% por tener 2 pilotos con variantes distintas.`,
    })
  }

  const multiplicadorTotal = sinergias.reduce((acc, s) => acc + s.bonus, 1.0)

  return { sinergias, multiplicadorTotal }
}

/**
 * Aplica el multiplicador de sinergia a los puntos base.
 * @param {number} puntosBase
 * @param {number} multiplicador
 * @returns {number}
 */
export const aplicarSinergia = (puntosBase, multiplicador) => {
  return Math.round(puntosBase * multiplicador)
}
