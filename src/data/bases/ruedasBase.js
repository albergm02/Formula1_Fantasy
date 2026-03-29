/**
 * Compuestos de neumaticos disponibles en 2026.
 * Cada compuesto modifica atributos de los pilotos asignados.
 * El jugador debe elegir un compuesto para la jornada.
 */
export const ruedasBase = [
  {
    id: 'blando',
    nombre: 'Blando (C5)',
    compuesto: 'blando',
    imagen: '/Ruedas/blandos.webp',
    color: '#ef4444',
    mejoras: { ritmo: 10, consistencia: -5, adaptabilidad: 0 },
  },
  {
    id: 'medio',
    nombre: 'Medio (C3)',
    compuesto: 'medio',
    imagen: '/Ruedas/medios.webp',
    color: '#eab308',
    mejoras: { ritmo: 4, consistencia: 4, adaptabilidad: 0 },
  },
  {
    id: 'duro',
    nombre: 'Duro (C1)',
    compuesto: 'duro',
    imagen: '/Ruedas/hard.webp',
    color: '#e5e7eb',
    mejoras: { ritmo: -5, consistencia: 10, adaptabilidad: 0 },
  },
  {
    id: 'intermedio',
    nombre: 'Intermedios',
    compuesto: 'intermedio',
    imagen: '/Ruedas/intermedios.webp',
    color: '#22c55e',
    mejoras: { ritmo: 0, consistencia: 0, adaptabilidad: 10 },
  },
  {
    id: 'lluvia',
    nombre: 'Full Wet',
    compuesto: 'lluvia',
    imagen: '/Ruedas/wet.webp',
    color: '#3b82f6',
    mejoras: { ritmo: -3, consistencia: 3, adaptabilidad: 8 },
  },
]
