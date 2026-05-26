import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

/**
 * Pipeline completo de cálculo de la jornada de un garaje.
 *
 * Estos tests representan lo que antes se comprobaba a mano desde el panel de
 * administración con el botón "Procesar jornada": se construye un garaje de
 * ejemplo, se invoca `calcularPuntuacionGaraje` con los factores ya resueltos
 * y se verifica el total y el desglose. Si el cálculo se rompe, estos tests
 * lo detectan sin necesidad de lanzar el procesamiento real contra Firestore.
 */
const cargarModuloServidor = createRequire(import.meta.url)
const { calcularPuntuacionGaraje } = cargarModuloServidor('../../functions/puntuacionServer.js')

/** Devuelve un piloto de prueba con atributos y pesos sencillos. */
function construirPilotoDePrueba(id, equipado = true) {
  return {
    id,
    nombre: `Piloto ${id}`,
    equipado,
    atributos: { ritmo: 80, consistencia: 70, adaptabilidad: 60, agresividad: 50, gestion: 50 },
    pesos: { ritmo: 0.4, consistencia: 0.3, adaptabilidad: 0.3, agresividad: 0, gestion: 0 },
  }
}

describe('Pipeline de puntuación del garaje', () => {
  it('debería sumar los puntos de los pilotos equipados más los del coche equipado', () => {
    const garaje = {
      pilotos: [construirPilotoDePrueba('pil-1'), construirPilotoDePrueba('pil-2')],
      coches: [
        { nombre: 'Coche A', puntos: 12.4, equipado: true },
        { nombre: 'Coche B', puntos: 9.1, equipado: false },
      ],
      potenciadores: [],
    }
    const factoresPorPiloto = { 'pil-1': 1.0, 'pil-2': 1.0 }

    const resultado = calcularPuntuacionGaraje(garaje, factoresPorPiloto)

    // base por piloto: 0.4*80 + 0.3*70 + 0.3*60 = 71 → ×1.0 = 71 puntos
    expect(resultado.desglose.pilotos[0].puntosJornada).toBe(71)
    expect(resultado.desglose.pilotos[1].puntosJornada).toBe(71)
    expect(resultado.desglose.coche.puntos).toBe(12.4)
    expect(resultado.puntosTotal).toBe(71 + 71 + 12.4)
  })

  it('no debería puntuar a los pilotos que no están equipados', () => {
    const garaje = {
      pilotos: [construirPilotoDePrueba('pil-1', true), construirPilotoDePrueba('pil-2', false)],
      coches: [],
      potenciadores: [],
    }
    const resultado = calcularPuntuacionGaraje(garaje, { 'pil-1': 1.0, 'pil-2': 1.0 })

    expect(resultado.desglose.pilotos).toHaveLength(1)
    expect(resultado.desglose.pilotos[0].id).toBe('pil-1')
  })

  it('debería aplicar las mejoras de los potenciadores equipados sobre los atributos del piloto', () => {
    const garaje = {
      pilotos: [construirPilotoDePrueba('pil-1')],
      coches: [],
      potenciadores: [
        { equipado: true, mejoras: { ritmo: 5 } },
        { equipado: false, mejoras: { ritmo: 100 } },
      ],
    }
    const resultado = calcularPuntuacionGaraje(garaje, { 'pil-1': 1.0 })

    // base sin mejora = 71; con +5 ritmo (peso 0.4) suma 2 → 73 puntos
    expect(resultado.desglose.pilotos[0].puntosJornada).toBe(73)
  })

  it('debería multiplicar la puntuación base del piloto por el factor de jornada recibido', () => {
    const garaje = {
      pilotos: [construirPilotoDePrueba('pil-1')],
      coches: [],
      potenciadores: [],
    }
    const resultado = calcularPuntuacionGaraje(garaje, { 'pil-1': 1.5 })

    // base 71 × 1.5 = 106.5 → 107 (redondeo)
    expect(resultado.desglose.pilotos[0].puntosJornada).toBe(107)
  })

  it('debería usar factor 1.0 cuando un piloto no tiene factor calculado', () => {
    const garaje = {
      pilotos: [construirPilotoDePrueba('pil-1')],
      coches: [],
      potenciadores: [],
    }
    const resultado = calcularPuntuacionGaraje(garaje, {})

    expect(resultado.desglose.pilotos[0].factorJornada).toBe(1.0)
    expect(resultado.desglose.pilotos[0].puntosJornada).toBe(71)
  })
})
