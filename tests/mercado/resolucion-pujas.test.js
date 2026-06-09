import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

const cargarModuloServidor = createRequire(import.meta.url)
const { seleccionarPujasGanadoras } = cargarModuloServidor('../../functions/pujasServer.js')

describe('Resolución de pujas de un mercado', () => {
  it('debería devolver un mapa vacío si no se ha registrado ninguna puja', () => {
    expect(seleccionarPujasGanadoras([])).toEqual({})
  })

  it('debería adjudicar la carta a la única puja registrada', () => {
    const pujas = [{ idCarta: 'piloto-1', idParticipante: 'ana', cantidad: 5 }]
    const ganadoras = seleccionarPujasGanadoras(pujas)
    expect(ganadoras['piloto-1'].idParticipante).toBe('ana')
    expect(ganadoras['piloto-1'].cantidad).toBe(5)
  })

  it('debería adjudicar la carta al participante con la puja más alta', () => {
    const pujas = [
      { idCarta: 'piloto-1', idParticipante: 'ana', cantidad: 5 },
      { idCarta: 'piloto-1', idParticipante: 'luis', cantidad: 12 },
      { idCarta: 'piloto-1', idParticipante: 'eva', cantidad: 9 },
    ]
    expect(seleccionarPujasGanadoras(pujas)['piloto-1'].idParticipante).toBe('luis')
  })

  it('debería mantener la primera puja cuando dos pujas empatan en cantidad', () => {
    const pujas = [
      { idCarta: 'piloto-1', idParticipante: 'ana', cantidad: 8 },
      { idCarta: 'piloto-1', idParticipante: 'luis', cantidad: 8 },
    ]
    expect(seleccionarPujasGanadoras(pujas)['piloto-1'].idParticipante).toBe('ana')
  })

  it('debería resolver de forma independiente las pujas de cada carta del mercado', () => {
    const pujas = [
      { idCarta: 'piloto-1', idParticipante: 'ana', cantidad: 5 },
      { idCarta: 'piloto-1', idParticipante: 'luis', cantidad: 7 },
      { idCarta: 'coche-1', idParticipante: 'eva', cantidad: 20 },
      { idCarta: 'coche-1', idParticipante: 'ana', cantidad: 15 },
    ]
    const ganadoras = seleccionarPujasGanadoras(pujas)
    expect(ganadoras['piloto-1'].idParticipante).toBe('luis')
    expect(ganadoras['coche-1'].idParticipante).toBe('eva')
  })
})
