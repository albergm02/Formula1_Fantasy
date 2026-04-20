import { mercadoPilotos } from '@/data/variantesPiloto'
import { cochesBase } from '@/data/bases/cochesBase'
import { potenciadoresBase } from '@/data/bases/potenciadoresBase'

const calcularPrecioPorPuntuacion = (
	puntuacionBase,
	puntuacionMinima,
	puntuacionMaxima,
	precioMinimo,
	precioMaximo,
) => {
	if (puntuacionMaxima <= puntuacionMinima) {
		return Number(precioMinimo.toFixed(1))
	}

	const pesoNormalizado = (puntuacionBase - puntuacionMinima) / (puntuacionMaxima - puntuacionMinima)
	const precio = precioMinimo + pesoNormalizado * (precioMaximo - precioMinimo)
	return Number(precio.toFixed(1))
}

const calcularPuntuacionBasePotenciador = (mejoras = {}) => {
	const ritmo = mejoras.ritmo || 0
	const consistencia = mejoras.consistencia || 0
	const adaptabilidad = mejoras.adaptabilidad || 0
	const agresividad = mejoras.agresividad || 0
	const gestion = mejoras.gestion || 0

	return Math.round((ritmo + consistencia + adaptabilidad + agresividad + gestion) * 10) / 10
}

const cochesConPuntuacion = cochesBase.map((coche) => ({
	...coche,
	puntuacionBase: coche.puntos || 0,
}))
const puntuacionCocheMinima = Math.min(...cochesConPuntuacion.map((coche) => coche.puntuacionBase))
const puntuacionCocheMaxima = Math.max(...cochesConPuntuacion.map((coche) => coche.puntuacionBase))

const potenciadoresConPuntuacion = potenciadoresBase.map((potenciador) => ({
	...potenciador,
	puntuacionBase: calcularPuntuacionBasePotenciador(potenciador.mejoras),
}))
const puntuacionPotenciadorMinima = Math.min(
	...potenciadoresConPuntuacion.map((potenciador) => potenciador.puntuacionBase),
)
const puntuacionPotenciadorMaxima = Math.max(
	...potenciadoresConPuntuacion.map((potenciador) => potenciador.puntuacionBase),
)

export { mercadoPilotos }
export const mercadoPotenciadores = potenciadoresConPuntuacion.map((potenciador) => ({
	...potenciador,
	precio: calcularPrecioPorPuntuacion(
		potenciador.puntuacionBase,
		puntuacionPotenciadorMinima,
		puntuacionPotenciadorMaxima,
		2,
		5,
	),
}))

export const mercadoCoches = cochesConPuntuacion.map((coche) => ({
	...coche,
	precio: calcularPrecioPorPuntuacion(
		coche.puntuacionBase,
		puntuacionCocheMinima,
		puntuacionCocheMaxima,
		10,
		30,
	),
}))
