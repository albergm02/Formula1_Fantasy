// Utilidades del garaje del jugador

// Estructura vacía al unirse a una liga
export const createEmptyGarage = () => ({
  coche: null,
  pilotos: [],
  potenciadores: [],
})

// Reventa = 50% del precio, redondeado abajo
export const calculateResaleValue = (price = 0) => Math.floor(Number(price || 0) * 0.5)
