export const estiloVariante = {
  qualy: { color: '#38bdf8', icono: 'pi-stopwatch' },
  carrera: { color: '#f97316', icono: 'pi-flag-fill' },
  todo_terreno: { color: '#a78bfa', icono: 'pi-cloud' },
  base: { color: '#a1a1aa', icono: 'pi-user' },
  remontador: { color: '#ef4444', icono: 'pi-arrow-up' },
  estratega: { color: '#10b981', icono: 'pi-chart-bar' },
}

export const VARIANTES = [
  { id: 'qualy', etiqueta: 'Qualy', ...estiloVariante.qualy },
  { id: 'carrera', etiqueta: 'Carrera', ...estiloVariante.carrera },
  { id: 'todo_terreno', etiqueta: 'Todo Terreno', ...estiloVariante.todo_terreno },
  { id: 'remontador', etiqueta: 'Remontador', ...estiloVariante.remontador },
  { id: 'estratega', etiqueta: 'Estratega', ...estiloVariante.estratega },
  { id: 'base', etiqueta: 'Base', ...estiloVariante.base },
]
