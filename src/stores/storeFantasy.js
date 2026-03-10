import { defineStore } from 'pinia'

export const useFantasyStore = defineStore('fantasy', {
  state: () => {
    const datosGuardados = localStorage.getItem('miFantasyF1')
    if (datosGuardados) {
      return JSON.parse(datosGuardados)
    }

    return {
      usuario: {
        nombre: 'Alberto',
        iniciales: 'AL',
        puntos: 1200,
        presupuesto: 50.0
      },
      garaje: {   
        coche: null,
        pilotos: [],
        potenciadores: []
      }
    }
  },

  actions: {
    guardarPartida() {
      localStorage.setItem('miFantasyF1', JSON.stringify({
        usuario: this.usuario,
        garaje: this.garaje
      }))
    },

    pujarPorElemento(elemento) {
      if (elemento.tipo === 'coche' && this.garaje.coche !== null) {
        return { exito: false, mensaje: 'Ya tienes un coche. Véndelo primero en el garaje.' }
      }
      if (elemento.tipo === 'piloto' && this.garaje.pilotos.length >= 2) {
        return { exito: false, mensaje: 'Tus 2 asientos están ocupados. Despide a un piloto primero.' }
      }

      if (this.usuario.presupuesto >= elemento.precio) {
        this.usuario.presupuesto = Number((this.usuario.presupuesto - elemento.precio).toFixed(1))
        const nuevaCarta = { ...elemento, idInstancia: Date.now() }

        if (elemento.tipo === 'coche') {
          this.garaje.coche = nuevaCarta
        } else if (elemento.tipo === 'piloto') {
          this.garaje.pilotos.push(nuevaCarta)
        } else if (elemento.tipo === 'potenciador') {
          // Inicialmente la pieza viene desequipada (falsa)
          nuevaCarta.equipado = false
          this.garaje.potenciadores.push(nuevaCarta)
        }

        this.guardarPartida()
        return { exito: true, mensaje: `Fichaje de ${elemento.nombre} completado.` }
      }
      
      return { exito: false, mensaje: 'Fondos insuficientes para esta operación.' }
    },

    venderElemento(tipo, idInstancia = null) {
      if (tipo === 'coche' && this.garaje.coche) {
        this.usuario.presupuesto = Number((this.usuario.presupuesto + this.garaje.coche.precio).toFixed(1))
        this.garaje.coche = null
      } else if (tipo === 'piloto') {
        const index = this.garaje.pilotos.findIndex(p => p.idInstancia === idInstancia)
        if (index > -1) {
          this.usuario.presupuesto = Number((this.usuario.presupuesto + this.garaje.pilotos[index].precio).toFixed(1))
          this.garaje.pilotos.splice(index, 1)
        }
      }
      this.guardarPartida()
    },

    toggleEquiparPieza(idInstancia) {
      // 1. Buscamos la pieza exacta que el usuario ha tocado
      const pieza = this.garaje.potenciadores.find(p => p.idInstancia === idInstancia)
      
      // 2. Si la encuentra, invierte su estado (si era true pasa a false, y viceversa)
      if (pieza) {
        pieza.equipado = !pieza.equipado
        // 3. Guardamos en el localStorage para que recuerde que está instalada
        this.guardarPartida()
      }
    },

    resetearCuenta() {
      localStorage.removeItem('miFantasyF1')
      location.reload()
    },
    
  }
})