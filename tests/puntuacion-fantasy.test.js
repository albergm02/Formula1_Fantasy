import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

const cargarModulo = createRequire(import.meta.url)
const { calcularPuntosVariante, calcularPuntuacionGaraje } = cargarModulo('../functions/logica/puntuacion.js')
const { construirPuntosPorPiloto } = cargarModulo('../functions/logica/jornada.js')
const fixtureBahrein = cargarModulo('./fixtures/gp-bahrein-2026.json')

/**
 * Sistema de puntuación 2026.
 *
 *   1. La tabla FIA aplicada a Qualy y Carrera (techo idéntico).
 *   2. Las variantes contextuales (Todo Terreno, Remontador, Estratega).
 *   3. Las reglas de borde por abandono (DNF / DSQ / DNS / NC).
 *   4. El ciclo completo desde fixture: puntos × multiplicador condicional.
 */

// =====================================================================
// 1. Tabla FIA: Qualy y Carrera comparten escala (techo P1 = 25)
// =====================================================================
describe('1. Sistema FIA de puntos por posición', () => {
  const condicionesSecas = { llovio: false, numeroDNFs: 0, numeroSafetyCarActivos: 0, numeroVirtualSafetyCarActivos: 0 }

  it('asigna 25 puntos al ganador de la carrera', () => {
    expect(calcularPuntosVariante('carrera', { posicionCarrera: 1 }, condicionesSecas)).toBe(25)
  })

  it('asigna 25 puntos al pole-sitter en la variante Qualy', () => {
    expect(calcularPuntosVariante('qualy', { posicionQualy: 1 }, condicionesSecas)).toBe(25)
  })

  it('asigna 1 punto al P10 y 0 puntos a quien acaba fuera del top 10', () => {
    expect(calcularPuntosVariante('carrera', { posicionCarrera: 10 }, condicionesSecas)).toBe(1)
    expect(calcularPuntosVariante('carrera', { posicionCarrera: 11 }, condicionesSecas)).toBe(0)
  })
})

// =====================================================================
// 2. Variantes contextuales: caos, posiciones ganadas y estrategia
// =====================================================================
describe('2. Variantes contextuales', () => {
  it('Todo Terreno: el factor caos modula los puntos según meteo y SC', () => {
    const seco = { llovio: false, numeroSafetyCarActivos: 0, numeroVirtualSafetyCarActivos: 0, numeroDNFs: 0 }
    const apocaliptico = { llovio: true, numeroSafetyCarActivos: 2, numeroVirtualSafetyCarActivos: 1, numeroDNFs: 6 }

    // 25 (P1) × 0.5 (factor mínimo, carrera seca limpia) = 12.5
    expect(calcularPuntosVariante('todo_terreno', { posicionCarrera: 1 }, seco)).toBe(12.5)
    // 25 (P1) × (0.5 + 0.4 lluvia + 0.15 SC + 0.1 DNFs) = 25 × 1.15 = 28.75
    expect(calcularPuntosVariante('todo_terreno', { posicionCarrera: 1 }, apocaliptico)).toBe(28.75)
  })

  it('Remontador: tabla por diferencial neto de adelantamientos', () => {
    // 4 adelantamientos, 1 recibido: diferencial 3 → 12 puntos
    expect(calcularPuntosVariante('remontador', { numeroAdelantos: 4, numeroVecesAdelantado: 1 }, {})).toBe(12)
    // 7 adelantamientos, 0 recibidos: diferencial 7, acotado al tope de 25
    expect(calcularPuntosVariante('remontador', { numeroAdelantos: 7, numeroVecesAdelantado: 0 }, {})).toBe(25)
    // Adelanta 1 y recibe 3: diferencial negativo, 0 puntos
    expect(calcularPuntosVariante('remontador', { numeroAdelantos: 1, numeroVecesAdelantado: 3 }, {})).toBe(0)
  })

  it('Estratega: suma bonus por paradas, stint largo y posición', () => {
    // 1 parada (10) + stint 55% (round(5.5)=6) + P1-P3 (10) = 26 puntos
    const actuacion = { posicionCarrera: 1, numeroPitStops: 1, porcentajeStintMaximo: 0.55 }
    expect(calcularPuntosVariante('estratega', actuacion, {})).toBe(26)
  })
})

// =====================================================================
// 3. Reglas de borde: DNF, DSQ, DNS, NC
// =====================================================================
describe('3. Pilotos sin actuación válida en carrera', () => {
  it('un abandono anula Carrera, Todo Terreno, Remontador y Estratega', () => {
    const dnf = { posicionQualy: 5, posicionCarrera: 99, posicionSalida: 5, dnf: true }
    expect(calcularPuntosVariante('carrera', dnf, {})).toBe(0)
    expect(calcularPuntosVariante('todo_terreno', dnf, { llovio: true })).toBe(0)
    expect(calcularPuntosVariante('remontador', dnf, {})).toBe(0)
    expect(calcularPuntosVariante('estratega', dnf, {})).toBe(0)
  })

  it('Qualy sigue puntuando aunque haya DNF (la clasificación es el sábado)', () => {
    const dnfTrasPole = { posicionQualy: 1, posicionCarrera: 99, dnf: true }
    expect(calcularPuntosVariante('qualy', dnfTrasPole, {})).toBe(25)
  })

  it('Base con DNF sólo cuenta los puntos de qualy (mitad)', () => {
    // Pole (25) + DNF (0) = 25 / 2 = 12.5
    expect(calcularPuntosVariante('base', { posicionQualy: 1, posicionCarrera: 99, dsq: true }, {})).toBe(12.5)
  })
})

// =====================================================================
// 4. Ciclo completo: fixture → puntos del garaje con potenciador condicional
// =====================================================================
describe('4. Ciclo completo desde fixture de OpenF1', () => {
  it('Verstappen Carrera + Red Bull + Mapeo Agresivo (×1.5) suma 57.5 puntos', () => {
    const garaje = {
      pilotos: [{ id: '3_carrera', numero: 3, nombre: 'Max Verstappen', variante: 'carrera', equipado: true }],
      coches: [{ id: 'red_bull', nombre: 'Red Bull Racing', puntuacionBase: 20, equipado: true }],
      potenciadores: [{ id: 'mapeo_agresivo', nombre: 'Mapeo Agresivo', multiplicador: 1.5, condicion: null, equipado: true }],
    }

    const { puntos } = construirPuntosPorPiloto(garaje.pilotos, fixtureBahrein.actuacionesPorPiloto, fixtureBahrein.condiciones)
    const resultado = calcularPuntuacionGaraje(garaje, {
      puntosPorPiloto: puntos,
      condiciones: fixtureBahrein.condiciones,
      actuacionesPorPiloto: fixtureBahrein.actuacionesPorPiloto,
    })

    // 25 (P1) × 1.5 (Mapeo) = 37.5 + 20 (coche) = 57.5
    expect(resultado.puntosTotal).toBe(57.5)
  })

  it('Meteorología (×2 si llueve) NO se aplica en una carrera seca', () => {
    const garaje = {
      pilotos: [{ id: '3_carrera', numero: 3, nombre: 'Max Verstappen', variante: 'carrera', equipado: true }],
      coches: [],
      potenciadores: [{ id: 'meteorologia', nombre: 'Meteorología', multiplicador: 2.0, condicion: 'lluvia', equipado: true }],
    }

    const { puntos } = construirPuntosPorPiloto(garaje.pilotos, fixtureBahrein.actuacionesPorPiloto, fixtureBahrein.condiciones)
    const resultado = calcularPuntuacionGaraje(garaje, {
      puntosPorPiloto: puntos,
      condiciones: fixtureBahrein.condiciones,
      actuacionesPorPiloto: fixtureBahrein.actuacionesPorPiloto,
    })

    // Carrera seca: el multiplicador no se activa, 25 × 1 = 25
    expect(resultado.puntosTotal).toBe(25)
    expect(resultado.desglose.potenciadoresAplicados).toEqual([])
  })

  it('Modo Defensa (stint_largo) SÍ se aplica si un piloto del garaje tuvo un stint ≥ 50%', () => {
    // Verstappen en Bahrein tuvo porcentajeStintMaximo = 0.55 → cumple stint_largo
    const garaje = {
      pilotos: [{ id: '3_carrera', numero: 3, nombre: 'Max Verstappen', variante: 'carrera', equipado: true }],
      coches: [],
      potenciadores: [{ id: 'modo_defensa', nombre: 'Modo Defensa', multiplicador: 1.5, condicion: 'stint_largo', equipado: true }],
    }

    const { puntos } = construirPuntosPorPiloto(garaje.pilotos, fixtureBahrein.actuacionesPorPiloto, fixtureBahrein.condiciones)
    const resultado = calcularPuntuacionGaraje(garaje, {
      puntosPorPiloto: puntos,
      condiciones: fixtureBahrein.condiciones,
      actuacionesPorPiloto: fixtureBahrein.actuacionesPorPiloto,
    })

    // 25 (P1) × 1.5 (Modo Defensa) = 37.5
    expect(resultado.puntosTotal).toBe(37.5)
    expect(resultado.desglose.potenciadoresAplicados).toHaveLength(1)
  })

  it('Modo Override (mis_remontadas) NO se aplica si ningún piloto remonta ≥3 posiciones netas', () => {
    // Verstappen tiene diferencial neto = 0 - 3 = -3 → no cumple mis_remontadas
    const garaje = {
      pilotos: [{ id: '3_carrera', numero: 3, nombre: 'Max Verstappen', variante: 'carrera', equipado: true }],
      coches: [],
      potenciadores: [{ id: 'modo_override', nombre: 'Modo Override', multiplicador: 1.6, condicion: 'mis_remontadas', equipado: true }],
    }

    const { puntos } = construirPuntosPorPiloto(garaje.pilotos, fixtureBahrein.actuacionesPorPiloto, fixtureBahrein.condiciones)
    const resultado = calcularPuntuacionGaraje(garaje, {
      puntosPorPiloto: puntos,
      condiciones: fixtureBahrein.condiciones,
      actuacionesPorPiloto: fixtureBahrein.actuacionesPorPiloto,
    })

    expect(resultado.puntosTotal).toBe(25)
    expect(resultado.desglose.potenciadoresAplicados).toEqual([])
  })
})
