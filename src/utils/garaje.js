// Utilidades del garaje del jugador

// Estructura vacÃ­a al unirse a una liga
export const crearGarajeVacio = () => ({
  coche: null,
  pilotos: [],
  potenciadores: [],
})

// Reventa = 50% del precio, redondeado abajo
export const calcularValorReventa = (price = 0) => Math.floor(Number(price || 0) * 0.5)

