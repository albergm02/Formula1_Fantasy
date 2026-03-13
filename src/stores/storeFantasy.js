import { defineStore } from 'pinia'

/* Comenzamos con importaciones a Firebase */
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../services/firebase'

const crearEstadoInicial = () => ({
  usuario: {
    nombre: 'ALBERTO',
    iniciales: 'AM',
    puntos: 0,
    presupuesto: 50.0,
  },
  garaje: {
    coche: null,
    pilotos: [],
    potenciadores: [],
  },
})

/* TODO: COMIENZO DE LÓGICA DE JUEGO */

export const useFantasyStore = defineStore('fantasy', {
  state: () => {
    return {
      /* Arrancamos primero con el estado base, que es el mismo para todos los usuarios */
      ...crearEstadoInicial(),
      datosCargados: false,
    }
  },

  actions: {

    /* COMIENZO DE CONEXIÓN CON FIREBASE */

    async inicializarDatos() {
      try{
        const idUsuario = 'ALBERTO' // Aqui tengo que poner el email del usuario.
        const docRef = doc(db, 'usuarios_fantasy', idUsuario)
        const docSnap = await getDoc(docRef)

        /* Si el usuario existe */
        if (docSnap.exists()) {
          const data = docSnap.data()
          this.usuario = data.usuario
          this.garaje = data.garaje
        } else {
          /* En caso de que no exista se crea un nuevo estado inicial */
          await setDoc(docRef, crearEstadoInicial())
        }
      } catch (error) {
        console.error('Error al inicializar los datos:', error)
      }
      this.datosCargados = true
    },

    /* GUARDADO DE DATOS EN FIREBASE */

    async guardarDatosEnFirebase() {
      try {
        const idUsuario = 'ALBERTO' // Aqui tengo que poner el email del usuario.
        const docRef = doc(db, 'usuarios_fantasy', idUsuario)

        await setDoc(docRef, {
          usuario: this.usuario,
          garaje: this.garaje,
        })
      } catch (error) {
        console.error('Error al guardar los datos:', error)
      }
    },

    /** 
     * Fichar un elemento (coche, piloto o potenciador) 
     * Antes de fichar, se realizan varias comprobaciones:
     * - Presupuesto suficiente
     * - No tener ya un coche (si el elemento es un coche)
     * - No tener ya 2 pilotos (si el elemento es un piloto)
     * Si todo es correcto, se descuenta el presupuesto, se añade el elemento al garaje y se guardan los datos en Firebase
     */
    async fichar(elemento) {
      if (this.usuario.presupuesto < elemento.precio) {
        return { exito: false, mensaje: 'Presupuesto insuficiente.' }
      }

      if (elemento.tipo === 'coche' && this.garaje.coche) {
        return { exito: false, mensaje: 'Ya tienes un coche. Véndelo primero.' }
      }

      if (elemento.tipo === 'piloto' && this.garaje.pilotos.length >= 2) {
        return { exito: false, mensaje: 'Asientos ocupados. Despide a un piloto primero.' }
      }

      /* Si todo es correcto, se descuenta el presupuesto, se añade el elemento al garaje y se guardan los datos en Firebase */
      this.usuario.presupuesto = Number((this.usuario.presupuesto - elemento.precio).toFixed(1))
      const adquisicion = { ...elemento, idInstancia: Date.now() }

      /* Dependiendo del tipo de elemento, se añade a la sección correspondiente del garaje */
      if (elemento.tipo === 'coche') this.garaje.coche = adquisicion
      if (elemento.tipo === 'piloto') this.garaje.pilotos.push(adquisicion)
      if (elemento.tipo === 'potenciador') {
        adquisicion.equipado = false
        this.garaje.potenciadores.push(adquisicion)
      }

      /* Guardamos los datos en Firebase después de cada acción */
      await this.guardarDatosEnFirebase()
      return { exito: true, mensaje: `Fichaje de ${elemento.nombre} completado.` }
    },

    /**
     * Vender un coche:
     * - Solo se puede vender si se tiene un coche en el garaje
     * - Se suma el precio del coche al presupuesto del usuario
     * - Se elimina el coche del garaje
     * - Se guardan los datos en Firebase
     * - Se desequipan las mejoras equipadas (si las hubiera), ya que no se pueden mantener sin un coche
     */
    async venderCoche() {
      if (!this.garaje.coche) return

      this.usuario.presupuesto = Number(
        (this.usuario.presupuesto + this.garaje.coche.precio).toFixed(1),
      )
      this.garaje.coche = null
      
      this.garaje.potenciadores.forEach((p) => (p.equipado = false))
      await this.guardarDatosEnFirebase()
    },

    /**
     * Despedir a un piloto:
     * - Solo se puede despedir si el piloto existe en el garaje
     * - Se suma el precio del piloto al presupuesto del usuario
     * - Se elimina el piloto del garaje
     * - Se guardan los datos en Firebase
     */
    async despedirPiloto(idInstancia) {
      const index = this.garaje.pilotos.findIndex((p) => p.idInstancia === idInstancia)
      if (index === -1) return

      this.usuario.presupuesto = Number(
        (this.usuario.presupuesto + this.garaje.pilotos[index].precio).toFixed(1),
      )
      this.garaje.pilotos.splice(index, 1)
      await this.guardarDatosEnFirebase()
    },

    /**
     * Instalar o desinstalar una mejora:
     * - Solo se puede instalar si existe la mejora en el garaje
     * - Solo se puede instalar si hay un coche en el garaje
     * - Se actualiza el estado de la mejora (equipado/no equipado)
     * - Se guardan los datos en Firebase
     */
    async instalarMejora(idInstancia) {
      const pieza = this.garaje.potenciadores.find((p) => p.idInstancia === idInstancia)
      if (!pieza) return { exito: false, mensaje: 'Pieza no encontrada.' }

      if (!pieza.equipado && !this.garaje.coche) {
        return { exito: false, mensaje: 'Necesitas un monoplaza para instalar mejoras.' }
      }

      pieza.equipado = !pieza.equipado
      await this.guardarDatosEnFirebase()
      return { exito: true }
    },

    /**
     * Resetear la cuenta:
     * - Elimina los datos almacenados en localStorage
     * - Recarga la página para iniciar sesión nuevamente
     */
    async resetearCuenta() {
      const estadoVacio = crearEstadoInicial()
      this.usuario = estadoVacio.usuario
      this.garaje = estadoVacio.garaje
      
      await this.guardarDatosEnFirebase()
      location.reload()
    },
  },
})
