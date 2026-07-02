export const perfilesPuntuacion = {
  qualy: {
    resumenPuntuacion: 'Este piloto puntúa en base a su posición en la sesión de clasificación.',
    reglasUsuario: [
      '- Puntos según posición en la sesión de clasificación (escala base).',
      '- Sigue puntuando aunque el piloto abandone en carrera.',
    ],
  },
  carrera: {
    resumenPuntuacion: 'Este piloto puntúa en base a su posición final en carrera.',
    reglasUsuario: ['- Puntos según posición final en carrera (escala base).', '- Si el piloto no termina (ABN / DESC / N/S): 0 puntos.'],
  },
  todo_terreno: {
    resumenPuntuacion:
      'Este piloto puntúa en base a su posición en carrera, amplificada por el caos de la jornada (lluvia, coches de seguridad y abandonos).',
    reglasUsuario: [
      '- Parte de los puntos de carrera (escala base).',
      '- Esos puntos se multiplican por un factor de caos (rango 0.75 a 1.25).',
      '- Factor base: 0.75 (carrera seca y sin incidentes).',
      '- Si llovió: +0.10.',
      '- Cada Coche de Seguridad (real o virtual): +0.05, máximo 3 (tope +0.15).',
      '- Cada abandono (DNF): +0.05, máximo 5 (tope +0.25).',
      '- Si el piloto no termina: 0 puntos (el factor no aplica).',
    ],
  },
  base: {
    resumenPuntuacion: 'Este piloto puntúa en base a la media entre su posición en clasificación y su posición final en carrera.',
    reglasUsuario: [
      '- Media de los puntos de Clasificación y Carrera.',
      '- (Puntos Clasificación + Puntos Carrera) / 2.',
      '- Si abandona en carrera, sólo cuentan los puntos de Clasificación / 2.',
    ],
  },
  remontador: {
    resumenPuntuacion:
      'Este piloto puntúa en base al diferencial de adelantamientos (adelantamientos realizados menos veces que fue adeladado).',
    reglasUsuario: [
      '- Diferencial = adelantamientos realizados − veces adelantado.',
      '- Diferencial −4 o menos: suelo de 1–2 pts (ya no se anula por perder plazas netas).',
      '- Diferencial −4: 2 pts — −3: 3 pts — −2: 4 pts — −1: 5 pts.',
      '- Diferencial 0: 7 pts.',
      '- Diferencial 1: 10 pts — 2: 13 pts — 3: 16 pts — 4: 19 pts — 5: 22 pts (+3 por plaza).',
      '- Diferencial 6 o más: 25 puntos (tope).',
      '- Si el piloto no termina: 0 puntos.',
    ],
  },
  estratega: {
    resumenPuntuacion:
      'Este piloto puntúa según su posición en el ranking de stints de la carrera: quien hizo el tramo más largo sin parar queda 1.º (25 pts) y bajan desde ahí.',
    reglasUsuario: [
      '- Se ordenan todos los pilotos por su stint más largo (de mayor a menor).',
      '- Empates se desempatan por posición de carrera (mejor posición = mejor puesto).',
      '- La posición en ese ranking usa la misma escala que Qualy y Carrera: P1 = 25, P2 = 20, P3 = 18…',
      '- Descarta los stint del 100% (suelen ser DNFs o fallos de la API).',
      '- Si el piloto no termina: 0 puntos.',
    ],
  },
}
