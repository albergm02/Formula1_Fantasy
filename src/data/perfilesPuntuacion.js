/**
 * Perfiles de puntuacion con sistema de atributos ponderados.
 * Cada variante aplica diferentes pesos a los 3 atributos del piloto:
 *   ritmo (0-100), consistencia (0-100), adaptabilidad (0-100)
 *
 * Formula: puntuacionBase = (pesoRitmo × ritmo) + (pesoConsistencia × consistencia) + (pesoAdaptabilidad × adaptabilidad)
 * Rango resultante: 0-100 → se escala a puntos de fantasy
 */
export const perfilesPuntuacion = {
  clasificador: {
    clave: 'clasificador',
    nombre: 'Clasificador',
    descripcion: 'Prioriza la velocidad pura en clasificacion.',
    pesos: { ritmo: 0.6, consistencia: 0.3, adaptabilidad: 0.1 },
    reglasUsuario: [
      'Ritmo x0.6 — penaliza pilotos lentos, premia la vuelta rapida.',
      'Consistencia x0.3 — un piloto regular suma puntos estables.',
      'Adaptabilidad x0.1 — poco peso, no importa el clima o la estrategia.',
    ],
  },
  carrera: {
    clave: 'carrera',
    nombre: 'Carrera',
    descripcion: 'Prioriza la regularidad y los resultados en carrera.',
    pesos: { ritmo: 0.2, consistencia: 0.6, adaptabilidad: 0.2 },
    reglasUsuario: [
      'Consistencia x0.6 — premio fuerte por terminar bien cada carrera.',
      'Ritmo x0.2 — la velocidad ayuda, pero no define.',
      'Adaptabilidad x0.2 — bonus moderado en condiciones cambiantes.',
    ],
  },
  lluvia: {
    clave: 'lluvia',
    nombre: 'Lluvia',
    descripcion: 'Apuesta por condiciones extremas y caos en pista.',
    pesos: { ritmo: 0.2, consistencia: 0.2, adaptabilidad: 0.6 },
    reglasUsuario: [
      'Adaptabilidad x0.6 — los pilotos que brillan en lluvia y caos dominan.',
      'Ritmo x0.2 — la velocidad base aporta algo.',
      'Consistencia x0.2 — no es lo principal cuando todo cambia.',
    ],
  },
  base: {
    clave: 'base',
    nombre: 'Base',
    descripcion: 'Perfil equilibrado sin priorizar ningun atributo.',
    pesos: { ritmo: 0.3, consistencia: 0.3, adaptabilidad: 0.3 },
    reglasUsuario: [
      'Ritmo x0.3 — contribucion equilibrada de velocidad.',
      'Consistencia x0.3 — contribucion equilibrada de regularidad.',
      'Adaptabilidad x0.3 — contribucion equilibrada de versatilidad.',
    ],
  },
}
