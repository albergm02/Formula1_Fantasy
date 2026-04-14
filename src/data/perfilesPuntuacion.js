/**
 * Perfiles de puntuacion con sistema de atributos ponderados.
 * Cada variante aplica diferentes pesos a los 5 atributos del piloto:
 *   ritmo (0-100), consistencia (0-100), adaptabilidad (0-100),
 *   agresividad (0-100), gestion (0-100)
 *
 * Formula: puntuacionBase = Σ (peso × atributo) para todos los atributos activos.
 * Los pesos de cada perfil suman 1.0. Rango resultante: 0-100 → se escala a puntos de fantasy.
 */
// prettier-ignore
export const perfilesPuntuacion = {
  qualy: {
    pesos: { ritmo: 0.45, consistencia: 0.2, adaptabilidad: 0.05, agresividad: 0.25, gestion: 0.05 },
    reglasUsuario: [
      'Factor según posición en clasificación:',
      'P1 – P3 → ×1.50',
      'P4 – P6 → ×1.30',
      'P7 – P10 → ×1.15',
      'P11 – P15 → ×0.85',
      'P16+ → ×0.65',
    ],
  },
  carrera: {
    pesos: { ritmo: 0.2, consistencia: 0.4, adaptabilidad: 0.05, agresividad: 0.1, gestion: 0.25 },
    reglasUsuario: [
      'Factor según posición final en carrera:',
      'P1 → ×1.50',
      'P2 → ×1.40',
      'P3 → ×1.30',
      'P4 – P5 → ×1.20',
      'P6 – P10 → ×1.00',
      'P11 – P15 → ×0.75',
      'P16 – P20 → ×0.50',
      'P20+ → ×0.20',
    ],
  },
  todo_terreno: {
    pesos: { ritmo: 0.1, consistencia: 0.15, adaptabilidad: 0.45, agresividad: 0.2, gestion: 0.1 },
    reglasUsuario: [
      'Factor según condiciones de carrera:',
      'Lluvia → ×1.40 | Sin lluvia → ×0.90',
      'Cada Safety Car → +0.10',
      'Cada Virtual SC → +0.05',
      'Cada abandono (DNF) → +0.03',
      'Bonus caos máximo: +0.30',
    ],
  },
  base: {
    pesos: { ritmo: 0.2, consistencia: 0.2, adaptabilidad: 0.2, agresividad: 0.2, gestion: 0.2 },
    reglasUsuario: [
      'Media de los factores Qualy, Carrera y Todo Terreno:',
      'Factor = (factorQualy + factorCarrera + factorTodoTerreno) / 3',
      'Perfil equilibrado sin especialización.',
    ],
  },
  remontador: {
    pesos: { ritmo: 0.25, consistencia: 0, adaptabilidad: 0.1, agresividad: 0.55, gestion: 0.1 },
    reglasUsuario: [
      'Factor según adelantamientos:',
      '7+ adelantamientos → ×1.80',
      '5 – 6 adelantamientos → ×1.50',
      '3 – 4 adelantamientos → ×1.30',
      '1 – 2 adelantamientos → ×1.10',
      '0 adelantamientos → ×0.70',
      'Bonus posición: P1–P5 → +0.10 | P6–P10 → +0.05',
    ],
  },
  estratega: {
    pesos: { ritmo: 0.05, consistencia: 0.3, adaptabilidad: 0.15, agresividad: 0, gestion: 0.5 },
    reglasUsuario: [
      'Factor compuesto por posición, stints y paradas:',
      'Base: factor posición carrera × 0.50',
      'Stint ≥ 60% de la carrera → +0.35',
      'Stint ≥ 40% → +0.20 | ≥ 25% → +0.10',
      '1 parada → +0.20 | 2 paradas → +0.10 | 3+ → +0.00',
      'Cada SC → +0.08 | Cada VSC → +0.04 (máx +0.20)',
    ],
  },
}
