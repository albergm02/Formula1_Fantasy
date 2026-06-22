/**
 * Normaliza garajes del formato anterior (campo `coche` singular) al formato
 * actual (`coches` array) y garantiza que todos los pilotos tienen el flag
 * `equipado`. Se usa tanto en la lectura del propio garaje como en la del rival.
 *
 * @param {Object} garajeOriginal
 * @returns {Object}
 */
export function migrarGaraje(garajeOriginal) {
  const garaje = { ...garajeOriginal }

  if (garaje.coche !== undefined || !garaje.coches) {
    garaje.coches = garaje.coche ? [{ ...garaje.coche, equipado: true }] : []
    delete garaje.coche
  }

  garaje.pilotos = (garaje.pilotos || []).map((piloto) => ({ ...piloto, equipado: piloto.equipado !== undefined ? piloto.equipado : true }))
  garaje.potenciadores = garaje.potenciadores || []

  return garaje
}
