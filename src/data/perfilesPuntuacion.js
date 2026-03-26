export const perfilesPuntuacion = {
  clasificador: {
    clave: 'clasificador',
    nombre: 'Clasificador',
    descripcion: 'Puntua mejor en clasificacion que en carrera.',
    reglasUsuario: ['+12 si clasifica en Top 10.', '+6 extra si entra en Q3.', '-4 si cae en Q1.'],
    puntuacion: { top10Qualy: 12, q3: 6, eliminadoQ1: -4 },
  },
  carrera: {
    clave: 'carrera',
    nombre: 'Carrera',
    descripcion: 'Puntua por resultado final y remontada.',
    reglasUsuario: ['+2 por cada posicion ganada en carrera.', '+10 si termina en Top 5.', '-8 si abandona (DNF).'],
    puntuacion: { posicionGanadaCarrera: 2, top5Final: 10, dnf: -8 },
  },
  lluvia: {
    clave: 'lluvia',
    nombre: 'Lluvia',
    descripcion: 'Usa reglas de Carrera y activa multiplicador con lluvia.',
    reglasUsuario: [
      'Usa las mismas reglas de la variante Carrera.',
      'Si hay lluvia (>= 5 vueltas mojadas), aplica x1.5 al total.',
      'Si no hay lluvia, se queda en x1.0.',
    ],
    puntuacion: { posicionGanadaCarrera: 2, top5Final: 10, dnf: -8, multiplicadorLluvia: 1.5 },
  },
};
