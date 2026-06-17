// La ganadora es la puja de mayor cantidad. En caso de empate gana la primera
// registrada, lo que mantiene un comportamiento determinista.
function seleccionarPujasGanadoras(pujas) {
  const pujasPorCarta = {}
  for (const puja of pujas) {
    const actual = pujasPorCarta[puja.idCarta]
    if (!actual || puja.cantidad > actual.cantidad) {
      pujasPorCarta[puja.idCarta] = puja
    }
  }
  return pujasPorCarta
}

module.exports = { seleccionarPujasGanadoras }
