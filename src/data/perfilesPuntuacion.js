export const perfilesPuntuacion = {
  clasificador: {
    clave: 'clasificador',
    nombre: 'Clasificador',
    descripcion: 'Puntua por rendimiento en clasificacion.',
    reglasUsuario: [
      '+10 si clasifica en Top 10.',
      '+8 extra si entra en Q3.',
      '-6 si es eliminado en Q1.',
    ],
    puntuacion: { top10Qualy: 10, q3: 8, eliminadoQ1: -6 },
  },
  carrera: {
    clave: 'carrera',
    nombre: 'Carrera',
    descripcion: 'Puntua por resultado final y adelantamientos.',
    reglasUsuario: [
      '+3 por cada posicion ganada en carrera.',
      '+10 si termina en Top 5.',
      '-6 si abandona (DNF).',
    ],
    puntuacion: { posicionGanadaCarrera: 3, top5Final: 10, dnf: -6 },
  },
  lluvia: {
    clave: 'lluvia',
    nombre: 'Lluvia',
    descripcion: 'Apuesta por la lluvia. Alto riesgo, alta recompensa.',
    reglasUsuario: [
      '+3 por cada posicion ganada en carrera.',
      'Si llueve (>= 5 vueltas mojadas), todos los puntos x1.5.',
      'Si NO llueve, todos los puntos x0.75.',
    ],
    puntuacion: {
      posicionGanadaCarrera: 3,
      top5Final: 10,
      dnf: -6,
      multiplicadorLluvia: 1.5,
      multiplicadorSeco: 0.75,
    },
  },
}
