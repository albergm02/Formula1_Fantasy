// prettier-ignore
export const perfilesPuntuacion = {
  qualy: {
    pesos: { ritmo: 0.5, consistencia: 0, adaptabilidad: 0, agresividad: 0.5, gestion: 0 },
    reglasUsuario: [
      'Factor según posición en clasificación:',
      'P1 – P3 → ×1.50',
      'P4 – P6 → ×1.25',
      'P7 – P10 → ×1.10',
      'P11 – P15 → ×0.85',
      'P16+ → ×0.65',
    ],
  },
  carrera: {
    pesos: { ritmo: 0.2, consistencia: 0.4, adaptabilidad: 0, agresividad: 0, gestion: 0.4 },
    reglasUsuario: [
      'Factor según posición final en carrera:',
      'P1 → ×1.50',
      'P2 → ×1.40',
      'P3 → ×1.30',
      'P4 – P5 → ×1.20',
      'P6 – P10 → ×1.00',
      'P11 – P15 → ×0.80',
      'P16 – P20 → ×0.60',
      'P20+ → ×0.50',
    ],
  },
  todo_terreno: {
    pesos: { ritmo: 0.1, consistencia: 0.1, adaptabilidad: 0.6, agresividad: 0.1, gestion: 0.1 },
    reglasUsuario: [
      'Factor base según el clima:',
      'Lluvia → 1.00 | Sin lluvia → 0.50',
      'Cada Safety Car → +0.05',
      'Cada Virtual SC → +0.05',
      'Cada abandono (DNF) → +0.10',
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
    pesos: { ritmo: 0.2, consistencia: 0, adaptabilidad: 0.4, agresividad: 0.4, gestion: 0 },
    reglasUsuario: [
      'Factor según diferencial de adelantamientos (OpenF1 /overtakes):',
      'diferencial = adelantamientos realizados − recibidos',
      'Factor = 1.0 + diferencial × 0.1',
      'Ej: +5 → ×1.50 | 0 → ×1.00 | −5 → ×0.50',
    ],
  },
  estratega: {
    pesos: { ritmo: 0.1, consistencia: 0.4, adaptabilidad: 0, agresividad: 0, gestion: 0.5 },
    reglasUsuario: [
      'Factor compuesto por gestión, paradas y posición:',
      'Base: 0.70',
      'Stint ≥ 60% → +0.45 | ≥ 45% → +0.30 | ≥ 35% → +0.20 | ≥ 25% → +0.10',
      '1 parada → +0.15 | 2 paradas → +0.05 | 3+ → +0.00',
      'Posición: P1–P3 +0.15 | P4–P10 +0.05 | P16+ −0.10',
      'Cada SC → +0.05 | Cada VSC → +0.025 (máx +0.15)',
    ],
  },
}
