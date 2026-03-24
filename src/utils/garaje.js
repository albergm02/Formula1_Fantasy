export const createEmptyGarage = () => ({
  coche: null,
  pilotos: [],
  potenciadores: [],
})

export const calculateResaleValue = (price = 0) => Math.floor(Number(price || 0) * 0.5)
