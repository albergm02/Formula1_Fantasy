import { defineStore } from 'pinia'

const crearEstadoInicial = () => ({
  usuario: {
    nombre: 'Alberto',
    iniciales: 'AL',
    puntos: 1200,
    presupuesto: 50.0,
  },
  garaje: {
    coche: null,
    pilotos: [],
    potenciadores: [],
  },
})

export const usarEstadoPartida = defineStore('fantasy', {
  state: () => {
    const partidaGuardada = localStorage.getItem('miFantasyF1')
    return partidaGuardada ? JSON.parse(partidaGuardada) : crearEstadoInicial()
  },

  actions: {
    guardar() {
      localStorage.setItem(
        'miFantasyF1',
        JSON.stringify({
          usuario: this.usuario,
          garaje: this.garaje,
        }),
      )
    },

    ficharElemento(elemento) {
      if (this.usuario.presupuesto < elemento.precio) {
        return { exito: false, mensaje: 'Presupuesto insuficiente.' }
      }

      if (elemento.tipo === 'coche' && this.garaje.coche) {
        return { exito: false, mensaje: 'Ya tienes un coche. Véndelo primero.' }
      }

      if (elemento.tipo === 'piloto' && this.garaje.pilotos.length >= 2) {
        return { exito: false, mensaje: 'Asientos ocupados. Despide a un piloto primero.' }
      }

      this.usuario.presupuesto = Number((this.usuario.presupuesto - elemento.precio).toFixed(1))

      const adquisicion = { ...elemento, idInstancia: Date.now() }

      if (elemento.tipo === 'coche') this.garaje.coche = adquisicion
      if (elemento.tipo === 'piloto') this.garaje.pilotos.push(adquisicion)
      if (elemento.tipo === 'potenciador') {
        adquisicion.equipado = false
        this.garaje.potenciadores.push(adquisicion)
      }

      this.guardar()
      return { exito: true, mensaje: `Fichaje de ${elemento.nombre} completado.` }
    },

    venderCoche() {
      if (!this.garaje.coche) return

      this.usuario.presupuesto = Number(
        (this.usuario.presupuesto + this.garaje.coche.precio).toFixed(1),
      )
      this.garaje.coche = null
      this.guardar()
    },

    despedirPiloto(idInstancia) {
      const index = this.garaje.pilotos.findIndex((p) => p.idInstancia === idInstancia)
      if (index === -1) return

      this.usuario.presupuesto = Number(
        (this.usuario.presupuesto + this.garaje.pilotos[index].precio).toFixed(1),
      )
      this.garaje.pilotos.splice(index, 1)
      this.guardar()
    },

    instalarMejora(idInstancia) {
      const pieza = this.garaje.potenciadores.find((p) => p.idInstancia === idInstancia)
      if (!pieza) return { exito: false, mensaje: 'Pieza no encontrada.' }

      if (!pieza.equipado && !this.garaje.coche) {
        return { exito: false, mensaje: 'Necesitas un monoplaza para instalar mejoras.' }
      }

      pieza.equipado = !pieza.equipado
      this.guardar()
      return { exito: true }
    },

    resetearCuenta() {
      localStorage.removeItem('miFantasyF1')
      location.reload()
    },
  },
})
