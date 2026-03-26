import { defineStore } from 'pinia'
import { collection, doc, updateDoc, query, where, getDocs } from 'firebase/firestore'

import { db } from '@/services/servicioFirebase'
import { usarStoreAutenticacion } from './storeAutenticacion'

/* Utilidades para manejar el garaje del equipo */
import { crearGarajeVacio, calcularValorReventa } from '@/utils/garaje'

export const usarStoreEscuderia = defineStore('escuderia', {
  state: () => ({
    idLigaActiva: null,
    idParticipanteActivo: null,
    presupuesto: 0,
    puntos: 0,
    garaje: crearGarajeVacio(),
    cargandoEquipo: false,
  }),

  actions: {
    /**
     * Carga los datos del equipo para la liga especificada.
     * @param {string} idLiga - El ID de la liga.
     * @returns {Promise<void>} - Una promesa que se resuelve cuando los datos del equipo han sido cargados.
     */
    async cargarEquipo(idLiga) {
      this.cargandoEquipo = true
      const storeAutenticacion = usarStoreAutenticacion()

      try {
        // Pillo el ID de la liga activa, busco el participante activo para esa liga y cargo su equipo
        this.idLigaActiva = idLiga
        const referenciaParticipaciones = collection(db, 'participaciones')
        const consultaParticipante = query(
          referenciaParticipaciones,
          where('id_liga', '==', idLiga),
          where('email_usuario', '==', storeAutenticacion.usuarioActual.correoAutenticacion),
        )
        const instantaneaConsulta = await getDocs(consultaParticipante)

        // Si encuentro un participante activo, cargo su equipo. Si no, inicializo el equipo con valores por defecto.
        if (!instantaneaConsulta.empty) {
          const documentoParticipante = instantaneaConsulta.docs[0]
          this.idParticipanteActivo = documentoParticipante.id
          const datosParticipante = documentoParticipante.data()
          this.presupuesto = datosParticipante.presupuesto
          this.puntos = datosParticipante.puntos
          this.garaje = datosParticipante.garaje || crearGarajeVacio()
          return
        }
        console.warn(
          'Error en cargarEquipo (storeEquipo.js): participante activo no encontrado para la liga seleccionada',
        )
        this.presupuesto = 50.0
        this.puntos = 0
        this.garaje = crearGarajeVacio()
      } catch (error) {
        console.warn('Error en cargarEquipo (storeEquipo.js):', error)
        this.presupuesto = 50.0
        this.puntos = 0
        this.garaje = crearGarajeVacio()
      } finally {
        this.cargandoEquipo = false
      }
    },

    /**
     * Guarda el estado actual del equipo en Firestore.
     * @returns {Promise<void>} - Una promesa que se resuelve cuando el estado del equipo ha sido guardado.
     */
    async guardarEstadoEquipo() {
      if (!this.idParticipanteActivo) {
        console.warn('Error en guardarEstadoEquipo (storeEquipo.js): falta el ID del participante activo, no se puede guardar el estado del equipo')
        return
      }

      try {
        const referenciaParticipante = doc(db, 'participaciones', this.idParticipanteActivo)
        await updateDoc(referenciaParticipante, {
          presupuesto: this.presupuesto,
          puntos: this.puntos,
          garaje: this.garaje,
        })
      } catch (error) {
        console.error('Error en guardarEstadoEquipo (storeEquipo.js):', error)
      }
    },

    /**
     * Compra un elemento para el equipo.
     * @param {Object} elemento - El elemento a comprar.
     * @returns {Promise<Object>} - Una promesa que se resuelve con el resultado de la compra.
     */
    async comprarElemento(elemento) {
      if (this.presupuesto < elemento.precio) {
        return {
          success: false,
          message: 'No tienes suficiente presupuesto para fichar este elemento.',
        }
      }

      if (elemento.tipo === 'coche' && this.garaje.coche) {
        return {
          success: false,
          message: 'Ya tienes un coche fichado. Vende el actual para fichar uno nuevo.',
        }
      }

      if (elemento.tipo === 'piloto' && this.garaje.pilotos.length >= 2) {
        return {
          success: false,
          message: 'Ya tienes 2 pilotos fichados. Vende uno para fichar otro.',
        }
      }

      this.presupuesto -= elemento.precio
      const elementoComprado = { ...elemento, instancia_id: Date.now() }

      if (elemento.tipo === 'coche') {
        this.garaje.coche = elementoComprado
      } else if (elemento.tipo === 'piloto') {
        this.garaje.pilotos.push(elementoComprado)
      } else if (elemento.tipo === 'potenciador') {
        this.garaje.potenciadores.push(elementoComprado)
      }

      await this.guardarEstadoEquipo()
      return { success: true, message: `Has fichado: ${elemento.nombre} exitosamente.` }
    },

    /**
     * Vende un elemento del equipo.
     * @param {Object} elemento - El elemento a vender.
     * @returns {Promise<Object>} - Una promesa que se resuelve con el resultado de la venta.
     */
    async venderElemento(elemento) {
      if (!elemento) {
        return { success: false, message: 'Elemento no encontrado para vender.' }
      }

      try {
        this.presupuesto += calcularValorReventa(elemento.precio)

        if (elemento.tipo === 'coche') {
          this.garaje.coche = null
          this.garaje.potenciadores.forEach((potenciador) => {
            potenciador.equipado = false
          })
        } else if (elemento.tipo === 'piloto') {
          this.garaje.pilotos = this.garaje.pilotos.filter(
            (piloto) => piloto.instancia_id !== elemento.instancia_id,
          )
        } else if (elemento.tipo === 'potenciador') {
          this.garaje.potenciadores = this.garaje.potenciadores.filter(
            (potenciador) => potenciador.instancia_id !== elemento.instancia_id,
          )
        }

        await this.guardarEstadoEquipo()
        return {
          success: true,
          message: `Has obtenido ${calcularValorReventa(elemento.precio)} de presupuesto, Â¡Hasta pronto, ${elemento.nombre}.!`,
        }
      } catch (error) {
        console.error('Error in venderElemento (storeEquipo.js):', error)
        return { success: false, message: 'Error al vender el elemento. IntÃ©ntalo de nuevo.' }
      }
    },

    /**
     * Alterna el estado de un potenciador (equipado/desequipado).
     * @param {number} idInstancia - El ID de instancia del potenciador.
     * @returns {Promise<Object>} - Una promesa que se resuelve con el resultado de la operación.
     */
    async alternarPotenciador(idInstancia) {
      const potenciador = this.garaje.potenciadores.find((elemento) => elemento.instancia_id === idInstancia)

      if (!potenciador) {
        return { success: false, message: 'Potenciador no encontrado para equipar.' }
      }

      if (!this.garaje.coche) {
        return {
          success: false,
          message: 'Debes tener un coche fichado para equipar un potenciador.',
        }
      }

      potenciador.equipado = !potenciador.equipado
      await this.guardarEstadoEquipo()
      return {
        success: true,
        message: `Has ${potenciador.equipado ? 'equipado' : 'desequipado'} el potenciador: ${potenciador.nombre}.`,
      }
    },

    limpiarEstadoLigaActiva() {
      this.idLigaActiva = null
      this.idParticipanteActivo = null
      this.presupuesto = 0
      this.puntos = 0
      this.garaje = crearGarajeVacio()
    },
  },
})



