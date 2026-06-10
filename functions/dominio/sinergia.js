const BONUS_EQUIPO_COMPLETO = 0.1
const BONUS_COMBO_VARIANTE = 0.05

function obtenerCocheEquipado(garaje) {
  if (garaje.coches) {
    return garaje.coches.find(function (c) {
      return c.equipado
    })
  }
  return garaje.coche || null
}

function calcularSinergias(garaje) {
  const sinergias = []
  const coche = obtenerCocheEquipado(garaje)
  const pilotos = (garaje.pilotos || []).filter(function (p) {
    return p.equipado !== false
  })

  if (coche && pilotos.length > 0) {
    const cocheId = coche.id || ''
    const pilotosDelEquipo = pilotos.filter(function (p) {
      const equipoNormalizado = (p.equipo || '').toLowerCase().replace(/\s+/g, '_')
      return p.equipo === coche.nombre || cocheId.indexOf(equipoNormalizado) !== -1
    })
    if (pilotosDelEquipo.length > 0) {
      sinergias.push({
        nombre: 'Equipo Completo',
        bonus: BONUS_EQUIPO_COMPLETO,
        descripcion:
          '+' + BONUS_EQUIPO_COMPLETO * 100 + '% por alinear piloto(s) con coche del mismo equipo.',
      })
    }
  }

  if (pilotos.length === 2 && pilotos[0].variante == pilotos[1].variante) {
    sinergias.push({
      nombre: 'Combo Variante',
      bonus: BONUS_COMBO_VARIANTE,
      descripcion:
        '+' + BONUS_COMBO_VARIANTE * 100 + '% por tener 2 pilotos con la misma variante.',
    })
  }

  const multiplicadorTotal = sinergias.reduce(function (acc, s) {
    return acc + s.bonus
  }, 1.0)
  return { sinergias, multiplicadorTotal }
}

function aplicarSinergia(puntosBase, multiplicador) {
  return Math.round(puntosBase * multiplicador)
}

module.exports = { calcularSinergias, aplicarSinergia }
