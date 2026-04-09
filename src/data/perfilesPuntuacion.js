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
  qualy:        { clave: 'qualy',        nombre: 'Qualy',        descripcion: 'Prioriza la velocidad pura en clasificación. El factor de jornada depende de la posición en qualy.',               pesos: { ritmo: 0.6, consistencia: 0.3, adaptabilidad: 0.1, agresividad: 0, gestion: 0 }, reglasUsuario: ['Ritmo x0.6 — premia la vuelta rápida y la velocidad pura.', 'Consistencia x0.3 — un piloto regular suma puntos estables.', 'Adaptabilidad x0.1 — muy poco peso, no importa el clima o la estrategia.'] },
  carrera:      { clave: 'carrera',      nombre: 'Carrera',      descripcion: 'Prioriza la regularidad y los resultados en carrera.',                                                              pesos: { ritmo: 0.2, consistencia: 0.6, adaptabilidad: 0.2, agresividad: 0, gestion: 0 }, reglasUsuario: ['Consistencia x0.6 — gran importancia por terminar bien cada carrera.', 'Ritmo x0.2 — la velocidad base aporta algo.', 'Adaptabilidad x0.2 — bonus moderado en condiciones cambiantes.'] },
  todo_terreno: { clave: 'todo_terreno', nombre: 'Todo Terreno', descripcion: 'Apuesta por el caos: lluvia, safety cars y abandonos amplifican su factor de jornada.',                             pesos: { ritmo: 0.2, consistencia: 0.2, adaptabilidad: 0.6, agresividad: 0, gestion: 0 }, reglasUsuario: ['Adaptabilidad x0.6 — brilla en lluvia, caos y condiciones cambiantes.', 'Ritmo x0.2 — la velocidad base aporta algo.', 'Consistencia x0.2 — la regularidad en carrera tiene menos peso.'] },
  base:         { clave: 'base',         nombre: 'Base',         descripcion: 'Perfil equilibrado sin priorizar ningún atributo.',                                                                 pesos: { ritmo: 0.3, consistencia: 0.4, adaptabilidad: 0.3, agresividad: 0, gestion: 0 }, reglasUsuario: ['Ritmo x0.3 — contribucion equilibrada de velocidad.', 'Consistencia x0.4 — contribucion equilibrada de regularidad.', 'Adaptabilidad x0.3 — contribucion equilibrada de versatilidad.'] },
  remontador:   { clave: 'remontador',   nombre: 'Remontador',   descripcion: 'Brilla cuando más adelanta. El factor de jornada usa los adelantamientos reales registrados por OpenF1.',          pesos: { ritmo: 0.3, consistencia: 0, adaptabilidad: 0, agresividad: 0.6, gestion: 0.1 }, reglasUsuario: ['Agresividad x0.6 — el número real de adelantamientos en pista determina el factor.', 'Ritmo x0.3 — la velocidad base sigue aportando puntos.', 'Gestión x0.1 — mínimo peso; este perfil vive en el ataque.'] },
  estratega:    { clave: 'estratega',    nombre: 'Estratega',    descripcion: 'Maximiza puntos con stints largos y pocas paradas. El factor de jornada mide la gestión de neumáticos real.',     pesos: { ritmo: 0, consistencia: 0.4, adaptabilidad: 0.1, agresividad: 0, gestion: 0.5 }, reglasUsuario: ['Gestión x0.5 — stints más largos y menos paradas disparan el factor.', 'Consistencia x0.4 — terminar la carrera sin errores es clave.', 'Adaptabilidad x0.1 — aprovecha los safety cars para extender o acortar estrategia.'] },
}
