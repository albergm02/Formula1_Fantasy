import { describe, it, expect } from 'vitest'
import { calcularPuntosJornada } from '@/utils/puntuacion'

/**
 * Conversión de la puntuación base de un piloto en puntos finales de jornada
 * multiplicando por el factor calculado para su variante.
 *
 * La función es la última pieza del pipeline de puntuación, por eso se cubre
 * de forma aislada: redondeo, suelo a cero y factor por defecto.
 */

describe('calcularPuntosJornada', () => {
  it('debería devolver la puntuación base sin cambios si no se pasa factor', () => {
    expect(calcularPuntosJornada(80)).toBe(80)
  })

  it('debería multiplicar la puntuación base por el factor de jornada', () => {
    expect(calcularPuntosJornada(80, 1.25)).toBe(100)
  })

  it('debería redondear al entero más cercano para que los puntos sean números limpios', () => {
    expect(calcularPuntosJornada(73, 1.27)).toBe(93)
  })

  it('debería devolver 0 cuando la puntuación base es negativa para no penalizar de más', () => {
    expect(calcularPuntosJornada(-50, 1.5)).toBe(0)
  })

  it('debería devolver 0 cuando el factor anula totalmente la puntuación', () => {
    expect(calcularPuntosJornada(120, 0)).toBe(0)
  })
})
