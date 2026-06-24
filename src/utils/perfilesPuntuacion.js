export const perfilesPuntuacion = {
  qualy: {
    reglasUsuario: [
      'Puntos según posición en la sesión de clasificación.',
      'P1: 25 / P2: 18 / P3: 15 / P4: 12 / P5: 10.',
      'P6: 8 / P7: 6 / P8: 4 / P9: 2 / P10: 1.',
      'P11 en adelante: 0 puntos.',
      'Sigue puntuando aunque el piloto abandone en carrera.',
    ],
  },
  carrera: {
    reglasUsuario: [
      'Puntos según posición final en carrera.',
      'P1: 25 / P2: 18 / P3: 15 / P4: 12 / P5: 10.',
      'P6: 8 / P7: 6 / P8: 4 / P9: 2 / P10: 1.',
      'P11 en adelante: 0 puntos.',
      'Si el piloto no termina (ABN / DESC / N/S): 0 puntos.',
    ],
  },
  todo_terreno: {
    reglasUsuario: [
      'Puntos de carrera multiplicados por un factor de caos (rango 0.70 a 1.45).',
      'Factor base: 0.70 (carrera seca y sin incidentes).',
      'Si llovió: +0.30.',
      'Cada Coche de Seguridad (real o virtual cuentan por igual): +0.05, hasta un máximo de 3 (tope +0.15).',
      'Si hubo 5 o más abandonos en la carrera: +0.30.',
      'Si el piloto no termina: 0 puntos (el factor no aplica).',
    ],
  },
  base: {
    reglasUsuario: [
      'Media de los puntos de Clasificación y Carrera.',
      '(Puntos Clasificación + Puntos Carrera) / 2.',
      'Si abandona en carrera, sólo cuentan los puntos de Clasificación / 2.',
    ],
  },
  remontador: {
    reglasUsuario: [
      'Premia los adelantamientos en pista.',
      'Diferencial = adelantamientos realizados − veces adelantado.',
      'Diferencial 0 o negativo: 0 puntos.',
      'Diferencial 1: 3 pts — 2: 7 pts — 3: 12 pts — 4: 18 pts.',
      'Diferencial 5 o más: 25 puntos (tope).',
      'Si el piloto no termina: 0 puntos.',
    ],
  },
  estratega: {
    reglasUsuario: [
      'Suma de tres bonus: paradas, stint más largo y posición final.',
      '1 parada en boxes: +10 / 2 paradas: +5 / 3 o más: 0.',
      'Bonus stint = porcentaje del stint más largo × 10 puntos.',
      'P1 a P3: +10 / P4 a P6: +7 / P7 a P10: +4 / fuera del 10: 0.',
      'Si el piloto no termina: 0 puntos.',
    ],
  },
}
