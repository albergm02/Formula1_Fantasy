import { describe, it, expect } from 'vitest'
import { calcularFactorJornada } from '@/utils/puntuacion'

/**
 * Factor de jornada por variante de carta.
 *
 * El factor se calcula a partir de la actuación real del piloto (datos de
 * OpenF1) y de las condiciones generales de la carrera. Siempre queda acotado
 * entre 0.5 y 1.5 para evitar que una carta dispare la puntuación.
 */

const sinCondiciones = {
  llovio: false,
  numeroDNFs: 0,
  numeroSafetyCarActivos: 0,
  numeroVirtualSafetyCarActivos: 0,
}

describe('Variante Qualy', () => {
  it('debería puntuar al máximo (1.5) si el piloto clasifica en el top 3', () => {
    const actuacion = { posicionQualy: 2 }
    expect(calcularFactorJornada(actuacion, sinCondiciones, 'qualy')).toBe(1.5)
  })

  it('debería dar factor medio (1.1) para una clasificación entre P7 y P10', () => {
    const actuacion = { posicionQualy: 9 }
    expect(calcularFactorJornada(actuacion, sinCondiciones, 'qualy')).toBe(1.1)
  })

  it('debería penalizar (0.65) las clasificaciones por debajo de P15', () => {
    const actuacion = { posicionQualy: 18 }
    expect(calcularFactorJornada(actuacion, sinCondiciones, 'qualy')).toBe(0.65)
  })
})

describe('Variante Carrera', () => {
  it('debería dar el máximo (1.5) al ganador de la carrera', () => {
    const actuacion = { posicionCarrera: 1 }
    expect(calcularFactorJornada(actuacion, sinCondiciones, 'carrera')).toBe(1.5)
  })

  it('debería dar 1.3 al tercer clasificado', () => {
    const actuacion = { posicionCarrera: 3 }
    expect(calcularFactorJornada(actuacion, sinCondiciones, 'carrera')).toBe(1.3)
  })

  it('debería aplicar el mínimo (0.5) a un piloto que termina fuera del top 20', () => {
    const actuacion = { posicionCarrera: 22 }
    expect(calcularFactorJornada(actuacion, sinCondiciones, 'carrera')).toBe(0.5)
  })
})

describe('Variante Todo Terreno', () => {
  it('debería dar 0.5 en carrera seca y sin incidentes', () => {
    expect(calcularFactorJornada({}, sinCondiciones, 'todo_terreno')).toBe(0.5)
  })

  it('debería premiar las condiciones de caos (lluvia, safety cars y abandonos)', () => {
    const condicionesCaoticas = {
      llovio: true,
      numeroDNFs: 3,
      numeroSafetyCarActivos: 2,
      numeroVirtualSafetyCarActivos: 0,
    }
    // base 1.0 + (2 SC × 0.05) + (3 DNF × 0.10) = 1.40
    expect(calcularFactorJornada({}, condicionesCaoticas, 'todo_terreno')).toBe(1.4)
  })
})

describe('Variante Remontador', () => {
  it('debería aplicar factor 1.0 si los adelantamientos hechos y recibidos se compensan', () => {
    const actuacion = { numeroAdelantos: 4, numeroVecesAdelantado: 4 }
    expect(calcularFactorJornada(actuacion, sinCondiciones, 'remontador')).toBe(1.0)
  })

  it('debería premiar con factor alto a un piloto con +5 de diferencial de adelantamientos', () => {
    const actuacion = { numeroAdelantos: 8, numeroVecesAdelantado: 3 }
    expect(calcularFactorJornada(actuacion, sinCondiciones, 'remontador')).toBe(1.5)
  })

  it('debería acotar al mínimo (0.5) a un piloto muy adelantado', () => {
    const actuacion = { numeroAdelantos: 0, numeroVecesAdelantado: 10 }
    expect(calcularFactorJornada(actuacion, sinCondiciones, 'remontador')).toBe(0.5)
  })
})

describe('Variante Estratega', () => {
  it('debería sumar bonus por gestión de stints, una sola parada y podio', () => {
    const actuacion = {
      posicionCarrera: 2,
      numeroPitStops: 1,
      porcentajeStintMaximo: 0.6,
      dnf: false,
    }
    // 0.7 + 0.5 (stint) + 0.15 (1 parada) + 0.15 (podio) = 1.5
    expect(calcularFactorJornada(actuacion, sinCondiciones, 'estratega')).toBe(1.5)
  })

  it('no debería contar el bonus de stint si el piloto sufre DNF', () => {
    const actuacion = {
      posicionCarrera: 18,
      numeroPitStops: 1,
      porcentajeStintMaximo: 0.6,
      dnf: true,
    }
    // 0.7 + 0.15 (1 parada) + (-0.1, fuera del top 15) = 0.75
    expect(calcularFactorJornada(actuacion, sinCondiciones, 'estratega')).toBe(0.75)
  })
})

describe('Variante Base', () => {
  it('debería ser la media de los factores Qualy, Carrera y Todo Terreno', () => {
    const actuacion = { posicionQualy: 2, posicionCarrera: 3 }
    const condiciones = { ...sinCondiciones, llovio: true }
    // (1.5 + 1.3 + 1.0) / 3 = 1.27 (redondeado a 2 decimales)
    expect(calcularFactorJornada(actuacion, condiciones, 'base')).toBe(1.27)
  })
})

describe('Acotado del factor', () => {
  it('no debería superar nunca el techo de 1.5', () => {
    const actuacion = { numeroAdelantos: 100, numeroVecesAdelantado: 0 }
    const factor = calcularFactorJornada(actuacion, sinCondiciones, 'remontador')
    expect(factor).toBeLessThanOrEqual(1.5)
  })

  it('no debería caer nunca por debajo del suelo de 0.5', () => {
    const actuacion = { posicionCarrera: 25 }
    const factor = calcularFactorJornada(actuacion, sinCondiciones, 'carrera')
    expect(factor).toBeGreaterThanOrEqual(0.5)
  })
})
