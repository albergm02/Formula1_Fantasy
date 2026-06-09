import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import { calcularFactorJornada as calcularFactorJornadaCliente } from '@/utils/puntuacion'

const cargarModuloServidor = createRequire(import.meta.url)
const { calcularFactorJornada: calcularFactorJornadaServidor } = cargarModuloServidor(
  '../../functions/dominio/puntuacion.js',
)

const sinCondiciones = {
  llovio: false,
  numeroDNFs: 0,
  numeroSafetyCarActivos: 0,
  numeroVirtualSafetyCarActivos: 0,
}

const casosDeJornada = [
  {
    nombre: 'Pole position en Qualy',
    actuacion: { posicionQualy: 1 },
    condiciones: sinCondiciones,
    variante: 'qualy',
  },
  {
    nombre: 'Victoria en carrera',
    actuacion: { posicionCarrera: 1 },
    condiciones: sinCondiciones,
    variante: 'carrera',
  },
  {
    nombre: 'Carrera caótica con lluvia y safety cars',
    actuacion: {},
    condiciones: {
      llovio: true,
      numeroDNFs: 2,
      numeroSafetyCarActivos: 1,
      numeroVirtualSafetyCarActivos: 1,
    },
    variante: 'todo_terreno',
  },
  {
    nombre: 'Remontada de 6 posiciones netas',
    actuacion: { numeroAdelantos: 9, numeroVecesAdelantado: 3 },
    condiciones: sinCondiciones,
    variante: 'remontador',
  },
  {
    nombre: 'Estrategia perfecta a una parada',
    actuacion: {
      posicionCarrera: 2,
      numeroPitStops: 1,
      porcentajeStintMaximo: 0.55,
      dnf: false,
    },
    condiciones: sinCondiciones,
    variante: 'estratega',
  },
  {
    nombre: 'Variante base con clasificación y carrera mixtas',
    actuacion: { posicionQualy: 5, posicionCarrera: 8 },
    condiciones: { ...sinCondiciones, llovio: true },
    variante: 'base',
  },
  {
    nombre: 'Todo Terreno anulado por abandono del propio piloto',
    actuacion: { dnf: true },
    condiciones: {
      llovio: true,
      numeroDNFs: 3,
      numeroSafetyCarActivos: 2,
      numeroVirtualSafetyCarActivos: 0,
    },
    variante: 'todo_terreno',
  },
  {
    nombre: 'Estratega anulado por descalificación del piloto',
    actuacion: { posicionCarrera: 4, numeroPitStops: 1, porcentajeStintMaximo: 0.6, dsq: true },
    condiciones: sinCondiciones,
    variante: 'estratega',
  },
  {
    nombre: 'Todo Terreno anulado porque el piloto no sale (DNS)',
    actuacion: { dns: true },
    condiciones: {
      llovio: true,
      numeroDNFs: 2,
      numeroSafetyCarActivos: 1,
      numeroVirtualSafetyCarActivos: 1,
    },
    variante: 'todo_terreno',
  },
]

describe('Coherencia entre cliente y servidor', () => {
  for (const caso of casosDeJornada) {
    it(`debería calcular el mismo factor en ambos lados para: ${caso.nombre}`, () => {
      const factorCliente = calcularFactorJornadaCliente(
        caso.actuacion,
        caso.condiciones,
        caso.variante,
      )
      const factorServidor = calcularFactorJornadaServidor(
        caso.actuacion,
        caso.condiciones,
        caso.variante,
      )
      expect(factorCliente).toBe(factorServidor)
    })
  }
})
