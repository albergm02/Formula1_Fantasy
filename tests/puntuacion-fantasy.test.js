import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

const cargarModulo = createRequire(import.meta.url)
const { calcularPuntosVariante, calcularPuntuacionGaraje } = cargarModulo('../functions/logica/puntuacion.js')
const { construirPuntosPorPiloto } = cargarModulo('../functions/logica/jornada.js')
const ejemplo = cargarModulo('./ejemplo.json')

// =====================================================================
// 1. Escala continua de puntos por posición (Qualy y Carrera comparten escala)
// =====================================================================
describe('1. Escala continua de puntos por posición', () => {
  const condicionesSecas = { llovio: false, numeroDNFs: 0, numeroSafetyCarActivos: 0, numeroVirtualSafetyCarActivos: 0 }

  it('asigna 25 puntos al ganador de la carrera', () => {
    expect(calcularPuntosVariante('carrera', { posicionCarrera: 1 }, condicionesSecas)).toBe(25)
  })

  it('asigna 25 puntos al pole-sitter en la variante Qualy', () => {
    expect(calcularPuntosVariante('qualy', { posicionQualy: 1 }, condicionesSecas)).toBe(25)
  })

  it('la escala es decreciente y continua: P2=20, P3=18 y baja 1 punto hasta P20=1', () => {
    expect(calcularPuntosVariante('carrera', { posicionCarrera: 2 }, condicionesSecas)).toBe(20)
    expect(calcularPuntosVariante('carrera', { posicionCarrera: 3 }, condicionesSecas)).toBe(18)
    expect(calcularPuntosVariante('carrera', { posicionCarrera: 10 }, condicionesSecas)).toBe(11)
    expect(calcularPuntosVariante('carrera', { posicionCarrera: 20 }, condicionesSecas)).toBe(1)
  })

  it('a partir de P20 se mantiene el suelo de 1 punto, siempre se puntúa', () => {
    expect(calcularPuntosVariante('carrera', { posicionCarrera: 25 }, condicionesSecas)).toBe(1)
  })
})

// =====================================================================
// 2. Variantes contextuales: caos, posiciones ganadas y estrategia
// =====================================================================
describe('2. Variantes contextuales', () => {
  it('Todo Terreno: el factor caos modula los puntos según meteo y SC', () => {
    const seco = { llovio: false, numeroSafetyCarActivos: 0, numeroVirtualSafetyCarActivos: 0, numeroDNFs: 0 }
    const apocaliptico = { llovio: true, numeroSafetyCarActivos: 2, numeroVirtualSafetyCarActivos: 1, numeroDNFs: 6 }

    // 25 (P1) × 0.75 (factor mínimo, carrera seca limpia) = 18.75
    expect(calcularPuntosVariante('todo_terreno', { posicionCarrera: 1 }, seco)).toBe(18.75)
    // 25 (P1) × (0.75 + 0.10 lluvia + 0.15 SC + 0.25 DNFs) = 25 × 1.25 = 31.25
    expect(calcularPuntosVariante('todo_terreno', { posicionCarrera: 1 }, apocaliptico)).toBe(31.25)
  })

  it('Remontador: tabla por diferencial neto de adelantamientos', () => {
    // 4 adelantamientos, 1 recibido: diferencial 3 → 12 puntos
    expect(calcularPuntosVariante('remontador', { numeroAdelantos: 4, numeroVecesAdelantado: 1 }, {})).toBe(12)
    // 7 adelantamientos, 0 recibidos: diferencial 7, acotado al tope de 25
    expect(calcularPuntosVariante('remontador', { numeroAdelantos: 7, numeroVecesAdelantado: 0 }, {})).toBe(25)
    // Adelanta 1 y recibe 3: diferencial negativo, 0 puntos
    expect(calcularPuntosVariante('remontador', { numeroAdelantos: 1, numeroVecesAdelantado: 3 }, {})).toBe(0)
  })

  it('Estratega: el factor de estrategia modula los puntos por posición', () => {
    // P1 (25) × 1.25 (1 parada < 3 + stint 80% > 50%) = 31.25
    const buenaEstrategia = { posicionCarrera: 1, numeroPitStops: 1, porcentajeStintMaximo: 0.8 }
    expect(calcularPuntosVariante('estratega', buenaEstrategia, {})).toBe(31.25)

    // P1 (25) × 1.0 (1 parada < 3, stint 30% ≤ 50%) = 25
    const stintCorto = { posicionCarrera: 1, numeroPitStops: 1, porcentajeStintMaximo: 0.3 }
    expect(calcularPuntosVariante('estratega', stintCorto, {})).toBe(25)

    // P1 (25) × 1.0 (3 paradas ≥ 3, stint 80% > 50%) = 25
    const muchasParadas = { posicionCarrera: 1, numeroPitStops: 3, porcentajeStintMaximo: 0.8 }
    expect(calcularPuntosVariante('estratega', muchasParadas, {})).toBe(25)

    // P1 (25) × 0.75 (3 paradas ≥ 3, stint 30% ≤ 50%) = 18.75
    const peorCaso = { posicionCarrera: 1, numeroPitStops: 3, porcentajeStintMaximo: 0.3 }
    expect(calcularPuntosVariante('estratega', peorCaso, {})).toBe(18.75)

    // P10 (11) × 1.25 (1 parada + stint 55%) = 13.75
    const enrichmentP10 = { posicionCarrera: 10, numeroPitStops: 1, porcentajeStintMaximo: 0.55 }
    expect(calcularPuntosVariante('estratega', enrichmentP10, {})).toBe(13.75)
  })

  it('Estratega: 0 paradas en boxes anula toda la puntuación', () => {
    expect(calcularPuntosVariante('estratega', { posicionCarrera: 1, numeroPitStops: 0, porcentajeStintMaximo: 1 }, {})).toBe(0)
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
// 4. Ciclo completo: fixture → puntos del garaje con potenciador
// =====================================================================
describe('4. Ciclo completo desde fixture de OpenF1', () => {
  it('Verstappen Carrera + Red Bull + Mapeo Agresivo (×1.5) suma 43.5 puntos', () => {
    const garaje = {
      pilotos: [{ id: '3_carrera', numero: 3, nombre: 'Max Verstappen', variante: 'carrera', equipado: true }],
      coches: [{ id: 'red_bull', nombre: 'Red Bull Racing', puntuacionBase: 6, equipado: true }],
      potenciadores: [{ id: 'mapeo_agresivo', nombre: 'Mapeo Agresivo', multiplicador: 1.5, equipado: true }],
    }

    const { puntos } = construirPuntosPorPiloto(garaje.pilotos, ejemplo.actuacionesPorPiloto, ejemplo.condiciones)
    const resultado = calcularPuntuacionGaraje(garaje, {
      puntosPorPiloto: puntos,
      condiciones: ejemplo.condiciones,
      actuacionesPorPiloto: ejemplo.actuacionesPorPiloto,
    })

    // 25 (P1) × 1.5 (Mapeo) = 37.5 + 6 (coche) = 43.5
    expect(resultado.puntosTotal).toBe(43.5)
  })

  it('Meteorología (×2) siempre se aplica independientemente del clima', () => {
    const garaje = {
      pilotos: [{ id: '3_carrera', numero: 3, nombre: 'Max Verstappen', variante: 'carrera', equipado: true }],
      coches: [],
      potenciadores: [{ id: 'meteorologia', nombre: 'Meteorología', multiplicador: 2.0, equipado: true }],
    }

    const { puntos } = construirPuntosPorPiloto(garaje.pilotos, ejemplo.actuacionesPorPiloto, ejemplo.condiciones)
    const resultado = calcularPuntuacionGaraje(garaje, {
      puntosPorPiloto: puntos,
      condiciones: ejemplo.condiciones,
      actuacionesPorPiloto: ejemplo.actuacionesPorPiloto,
    })

    // 25 × 2 = 50
    expect(resultado.puntosTotal).toBe(50)
    expect(resultado.desglose.potenciadoresAplicados).toHaveLength(1)
  })

  it('Modo Defensa (×1.5) siempre se aplica independientemente del stint', () => {
    const garaje = {
      pilotos: [{ id: '3_carrera', numero: 3, nombre: 'Max Verstappen', variante: 'carrera', equipado: true }],
      coches: [],
      potenciadores: [{ id: 'modo_defensa', nombre: 'Modo Defensa', multiplicador: 1.5, equipado: true }],
    }

    const { puntos } = construirPuntosPorPiloto(garaje.pilotos, ejemplo.actuacionesPorPiloto, ejemplo.condiciones)
    const resultado = calcularPuntuacionGaraje(garaje, {
      puntosPorPiloto: puntos,
      condiciones: ejemplo.condiciones,
      actuacionesPorPiloto: ejemplo.actuacionesPorPiloto,
    })

    // 25 (P1) × 1.5 (Modo Defensa) = 37.5
    expect(resultado.puntosTotal).toBe(37.5)
    expect(resultado.desglose.potenciadoresAplicados).toHaveLength(1)
  })

  it('Modo Override (×1.6) siempre se aplica independientemente de las remontadas', () => {
    const garaje = {
      pilotos: [{ id: '3_carrera', numero: 3, nombre: 'Max Verstappen', variante: 'carrera', equipado: true }],
      coches: [],
      potenciadores: [{ id: 'modo_override', nombre: 'Modo Override', multiplicador: 1.6, equipado: true }],
    }

    const { puntos } = construirPuntosPorPiloto(garaje.pilotos, ejemplo.actuacionesPorPiloto, ejemplo.condiciones)
    const resultado = calcularPuntuacionGaraje(garaje, {
      puntosPorPiloto: puntos,
      condiciones: ejemplo.condiciones,
      actuacionesPorPiloto: ejemplo.actuacionesPorPiloto,
    })

    // 25 × 1.6 = 40
    expect(resultado.puntosTotal).toBe(40)
    expect(resultado.desglose.potenciadoresAplicados).toHaveLength(1)
  })
})
