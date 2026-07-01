export const perfilesPuntuacion = {
  qualy: {
    resumenPuntuacion: 'Este piloto puntúa en base a su posición en la sesión de clasificación.',
    reglasUsuario: [
      'Puntos según posición en la sesión de clasificación.',
      'P1: 25 / P2: 18 / P3: 15 / P4: 12 / P5: 10.',
      'P6: 8 / P7: 6 / P8: 4 / P9: 2 / P10: 1.',
      'P11 en adelante: 0 puntos.',
      'Sigue puntuando aunque el piloto abandone en carrera.',
    ],
  },
  carrera: {
    resumenPuntuacion: 'Este piloto puntúa en base a su posición final en carrera.',
    reglasUsuario: [
      'Puntos según posición final en carrera.',
      'P1: 25 / P2: 18 / P3: 15 / P4: 12 / P5: 10.',
      'P6: 8 / P7: 6 / P8: 4 / P9: 2 / P10: 1.',
      'P11 en adelante: 0 puntos.',
      'Si el piloto no termina (ABN / DESC / N/S): 0 puntos.',
    ],
  },
  todo_terreno: {
    resumenPuntuacion:
      'Este piloto puntúa en base a su posición en carrera, amplificada por el caos de la jornada (lluvia, coches de seguridad y abandonos).',
    reglasUsuario: [
      'Puntos de carrera multiplicados por un factor de caos (rango 0.75 a 1.25).',
      'Factor base: 0.75 (carrera seca y sin incidentes).',
      'Si llovió: +0.10.',
      'Cada Coche de Seguridad (real o virtual cuentan por igual): +0.05, hasta un máximo de 3 (tope +0.15).',
      'Cada abandonado (DNF): +0.05, hasta un máximo de 5 (tope +0.25).',
      'Si el piloto no termina: 0 puntos (el factor no aplica).',
    ],
  },
  base: {
    resumenPuntuacion: 'Este piloto puntúa en base a la media entre su posición en clasificación y su posición final en carrera.',
    reglasUsuario: [
      'Media de los puntos de Clasificación y Carrera.',
      '(Puntos Clasificación + Puntos Carrera) / 2.',
      'Si abandona en carrera, sólo cuentan los puntos de Clasificación / 2.',
    ],
  },
  remontador: {
    resumenPuntuacion:
      'Este piloto puntúa en base al diferencial de adelantamientos (adelantamientos realizados menos veces que fue adelantado).',
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
    resumenPuntuacion:
      'Este piloto puntúa en base a su posición en carrera, modulada por la calidad de su estrategia: pocas paradas y stint largo suman, muchas paradas y stint corto restan.',
    reglasUsuario: [
      'Puntos de carrera multiplicados por un factor de estrategia (rango 0.75 a 1.25).',
      'Factor base: 0.75.',
      'Si hizo menos de 3 paradas en boxes: +0.25 (factor 1.0).',
      'Si el stint más largo supera el 50% de la carrera: +0.25 (factor 1.25 si además hizo pocas paradas).',
      'Puntos por posición: escala estándar (P1: 25, P2: 20, P3: 18 ... bajando hasta P20: 1).',
      'Si el piloto no ha realizado ninguna parada: 0 puntos.',
      'Si el piloto no termina: 0 puntos.',
    ],
  },
}
