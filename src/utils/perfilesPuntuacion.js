export const perfilesPuntuacion = {
  qualy: {
    pesos: { ritmo: 0.5, consistencia: 0, adaptabilidad: 0, agresividad: 0.5, gestion: 0 },
    reglasUsuario: [
      'Factor según posición en clasificación.',
      'P1 a P3: factor 1.50',
      'P4 a P6: factor 1.25',
      'P7 a P10: factor 1.10',
      'P11 a P15: factor 0.85',
      'P16 en adelante: factor 0.65',
    ],
  },
  carrera: {
    pesos: { ritmo: 0.2, consistencia: 0.4, adaptabilidad: 0, agresividad: 0, gestion: 0.4 },
    reglasUsuario: [
      'Factor según posición final en carrera.',
      'P1: 1.50 / P2: 1.40 / P3: 1.30',
      'P4 a P5: 1.20 / P6 a P10: 1.00',
      'P11 a P15: 0.80 / P16 a P20: 0.60',
      'P20 en adelante: factor 0.50',
    ],
  },
  todo_terreno: {
    pesos: { ritmo: 0.1, consistencia: 0.1, adaptabilidad: 0.6, agresividad: 0.1, gestion: 0.1 },
    reglasUsuario: [
      'Factor base: lluvia activa 1.00, tiempo seco 0.50.',
      'Cada Safety Car suma 0.05 al factor.',
      'Cada Safety Car Virtual suma 0.05 al factor.',
      'Cada abandono en carrera suma 0.10 al factor.',
      'Si el piloto no sale, abandona o es descalificado: factor 0.50.',
    ],
  },
  base: {
    pesos: { ritmo: 0.2, consistencia: 0.2, adaptabilidad: 0.2, agresividad: 0.2, gestion: 0.2 },
    reglasUsuario: [
      'Carta neutra, sin especialización.',
      'Factor de jornada fijo: 1.00 siempre.',
      'Puntúa su base íntegra, sin bonus ni penalización por la carrera.',
    ],
  },
  remontador: {
    pesos: { ritmo: 0.2, consistencia: 0, adaptabilidad: 0.4, agresividad: 0.4, gestion: 0 },
    reglasUsuario: [
      'Factor según diferencial de adelantamientos (OpenF1).',
      'Diferencial = adelantamientos realizados menos recibidos.',
      'Factor = 1.0 mas diferencial por 0.1.',
      'Ejemplo: +5 da factor 1.50, neutro da 1.00, -5 da 0.50.',
      'Si el piloto no sale, abandona o es descalificado: factor 0.50.',
    ],
  },
  estratega: {
    pesos: { ritmo: 0.1, consistencia: 0.4, adaptabilidad: 0, agresividad: 0, gestion: 0.5 },
    reglasUsuario: [
      'Factor compuesto por posición, paradas y stint más largo.',
      'Base: 0.70.',
      'Stint mayor al 60%: +0.50 / mayor al 45%: +0.30 / mayor al 35%: +0.20 / mayor al 25%: +0.10.',
      '1 parada en boxes: +0.15 / 2 paradas: +0.05 / 3 o mas: sin bono.',
      'P1 a P3: +0.15 / P4 a P10: +0.05 / P16 en adelante: -0.10.',
      'Si el piloto no sale, abandona o es descalificado: factor 0.50.',
    ],
  },
}
