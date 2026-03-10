import { defineStore } from 'pinia'

export const useFantasyStore = defineStore('fantasy', {
  state: () => ({
    usuario: {
      nombre: 'Alberto',
      iniciales: 'AF',
      puntos: 1200,
      presupuesto: 50,
    },
    garaje: [],
  }),

  actions: {
    pujarPorElemento(elemento) {
      if (this.usuario.presupuesto >= elemento.precio) {
        this.usuario.presupuesto = Number((this.usuario.presupuesto - elemento.precio).toFixed(2)) // FIXEO PARA EVITAR ERRORES DE DECIMALES EN JAVASCRIPT
        this.garaje.push(elemento)
        return true // La puja fue exitosa
      } else {
        return false // No hay fondos suficientes
      }
    },
  },
})
