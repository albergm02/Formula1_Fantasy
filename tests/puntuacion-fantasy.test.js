import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

const cargarModulo = createRequire(import.meta.url)
const { calcularPuntosVariante, calcularPuntuacionGaraje, construirRankingStints } = cargarModulo('../functions/logica/puntuacion.js')
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
    // 4 adelantamientos, 1 recibido: diferencial 3 → 16 puntos (7 + 3×3)
    expect(calcularPuntosVariante('remontador', { numeroAdelantos: 4, numeroVecesAdelantado: 1 }, {})).toBe(16)
    // 7 adelantamientos, 0 recibidos: diferencial 7, acotado al tope de 25
    expect(calcularPuntosVariante('remontador', { numeroAdelantos: 7, numeroVecesAdelantado: 0 }, {})).toBe(25)
    // Adelanta 1 y recibe 3: diferencial −2 → 4 pts (consolación, ya no se anula)
    expect(calcularPuntosVariante('remontador', { numeroAdelantos: 1, numeroVecesAdelantado: 3 }, {})).toBe(4)
    // Diferencial 0 → 7 pts (sin ganar ni perder plazas netas)
    expect(calcularPuntosVariante('remontador', { numeroAdelantos: 2, numeroVecesAdelantado: 2 }, {})).toBe(7)
    // Diferencial −1 → 5 pts
    expect(calcularPuntosVariante('remontador', { numeroAdelantos: 0, numeroVecesAdelantado: 1 }, {})).toBe(5)
    // Diferencial −6: suelo de 1 pt
    expect(calcularPuntosVariante('remontador', { numeroAdelantos: 0, numeroVecesAdelantado: 6 }, {})).toBe(1)
  })

  it('Estratega: puntúa por posición en el ranking de stints (escala base)', () => {
    // Posición 1 → 25 pts (igual que P1 en carrera)
    expect(calcularPuntosVariante('estratega', { posicionStint: 1 }, {})).toBe(25)

    // Posición 3 → 18 pts
    expect(calcularPuntosVariante('estratega', { posicionStint: 3 }, {})).toBe(18)

    // Posición 20 → 1 pt
    expect(calcularPuntosVariante('estratega', { posicionStint: 20 }, {})).toBe(1)

    // Sin posicionStint → suelo de 1 pt (posición 20 por defecto)
    expect(calcularPuntosVariante('estratega', {}, {})).toBe(1)
  })

  it('Estratega: construirRankingStints ordena por stint (desc) y desempata por posición de carrera', () => {
    const actuaciones = {
      1: { porcentajeStintMaximo: 0.8, posicionCarrera: 3 },
      2: { porcentajeStintMaximo: 0.8, posicionCarrera: 1 },
      3: { porcentajeStintMaximo: 0.6, posicionCarrera: 2 },
      4: { porcentajeStintMaximo: 0 },
      5: {},
      6: { porcentajeStintMaximo: 1.0, posicionCarrera: 5 },
    }
    const ranking = construirRankingStints(actuaciones)
    expect(ranking[2]).toBe(1)
    expect(ranking[1]).toBe(2)
    expect(ranking[3]).toBe(3)
    expect(ranking[4]).toBeUndefined()
    expect(ranking[5]).toBeUndefined()
    expect(ranking[6]).toBeUndefined()
  })

  it('Estratega: construirRankingStints devuelve {} si todos son 100% o inválidos', () => {
    expect(construirRankingStints({ 1: { porcentajeStintMaximo: 1.0 }, 2: { porcentajeStintMaximo: 1.0 } })).toEqual({})
  })

  it('Estratega: construirRankingStints excluye a los pilotos que no terminaron (DNF, DSQ, DNS, NC)', () => {
    const actuaciones = {
      1: { porcentajeStintMaximo: 0.8, posicionCarrera: 99, dnf: true },
      2: { porcentajeStintMaximo: 0.7, posicionCarrera: 99, dsq: true },
      3: { porcentajeStintMaximo: 0.6, posicionCarrera: 1 },
      4: { porcentajeStintMaximo: 0.5, posicionCarrera: 2 },
    }
    const ranking = construirRankingStints(actuaciones)
    expect(ranking[1]).toBeUndefined()
    expect(ranking[2]).toBeUndefined()
    expect(ranking[3]).toBe(1)
    expect(ranking[4]).toBe(2)
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
