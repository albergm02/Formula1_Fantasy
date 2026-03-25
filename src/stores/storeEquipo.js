import { defineStore } from 'pinia'
import { collection, doc, updateDoc, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/services/servicioFirebase'
import { usarStoreAutenticacion } from './storeAutenticacion'
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
    async cargarEquipo(leagueId) {
      this.cargandoEquipo = true
      const storeAutenticacion = usarStoreAutenticacion()

      try {
        this.idLigaActiva = leagueId
        const participantsRef = collection(db, 'participaciones')
        const participantQuery = query(
          participantsRef,
          where('id_liga', '==', leagueId),
          where('email_usuario', '==', storeAutenticacion.usuarioActual.correoAutenticacion),
        )
        const querySnapshot = await getDocs(participantQuery)

        if (!querySnapshot.empty) {
          const participantDocument = querySnapshot.docs[0]
          this.idParticipanteActivo = participantDocument.id
          const participantData = participantDocument.data()
          this.presupuesto = participantData.presupuesto
          this.puntos = participantData.puntos
          this.garaje = participantData.garaje || crearGarajeVacio()
          return
        }

        console.warn(
          'Error in cargarEquipo (storeEquipo.js): active participant not found for the selected league',
        )
        this.presupuesto = 50.0
        this.puntos = 0
        this.garaje = crearGarajeVacio()
      } catch (error) {
        console.warn('Error in cargarEquipo (storeEquipo.js):', error)
        this.presupuesto = 50.0
        this.puntos = 0
        this.garaje = crearGarajeVacio()
      } finally {
        this.cargandoEquipo = false
      }
    },

    async guardarEstadoEquipo() {
      if (!this.idParticipanteActivo) {
        console.warn('Error in guardarEstadoEquipo (storeEquipo.js): missing active participant id')
        return
      }

      try {
        const participantRef = doc(db, 'participaciones', this.idParticipanteActivo)
        await updateDoc(participantRef, {
          presupuesto: this.presupuesto,
          puntos: this.puntos,
          garaje: this.garaje,
        })
      } catch (error) {
        console.error('Error in guardarEstadoEquipo (storeEquipo.js):', error)
      }
    },

    async comprarElemento(item) {
      if (this.presupuesto < item.precio) {
        return {
          success: false,
          message: 'No tienes suficiente presupuesto para fichar este elemento.',
        }
      }

      if (item.tipo === 'coche' && this.garaje.coche) {
        return {
          success: false,
          message: 'Ya tienes un coche fichado. Vende el actual para fichar uno nuevo.',
        }
      }

      if (item.tipo === 'piloto' && this.garaje.pilotos.length >= 2) {
        return {
          success: false,
          message: 'Ya tienes 2 pilotos fichados. Vende uno para fichar otro.',
        }
      }

      this.presupuesto -= item.precio
      const elementoComprado = { ...item, instancia_id: Date.now() }

      if (item.tipo === 'coche') {
        this.garaje.coche = elementoComprado
      } else if (item.tipo === 'piloto') {
        this.garaje.pilotos.push(elementoComprado)
      } else if (item.tipo === 'potenciador') {
        this.garaje.potenciadores.push(elementoComprado)
      }

      await this.guardarEstadoEquipo()
      return { success: true, message: `Has fichado: ${item.nombre} exitosamente.` }
    },

    async venderElemento(item) {
      if (!item) {
        return { success: false, message: 'Elemento no encontrado para vender.' }
      }

      try {
        this.presupuesto += calcularValorReventa(item.precio)

        if (item.tipo === 'coche') {
          this.garaje.coche = null
          this.garaje.potenciadores.forEach((booster) => {
            booster.equipado = false
          })
        } else if (item.tipo === 'piloto') {
          this.garaje.pilotos = this.garaje.pilotos.filter(
            (driver) => driver.instancia_id !== item.instancia_id,
          )
        } else if (item.tipo === 'potenciador') {
          this.garaje.potenciadores = this.garaje.potenciadores.filter(
            (booster) => booster.instancia_id !== item.instancia_id,
          )
        }

        await this.guardarEstadoEquipo()
        return {
          success: true,
          message: `Has obtenido ${calcularValorReventa(item.precio)} de presupuesto, Â¡Hasta pronto, ${item.nombre}.!`,
        }
      } catch (error) {
        console.error('Error in venderElemento (storeEquipo.js):', error)
        return { success: false, message: 'Error al vender el elemento. IntÃ©ntalo de nuevo.' }
      }
    },

    async alternarPotenciador(idInstancia) {
      const booster = this.garaje.potenciadores.find((item) => item.instancia_id === idInstancia)

      if (!booster) {
        return { success: false, message: 'Potenciador no encontrado para equipar.' }
      }

      if (!this.garaje.coche) {
        return {
          success: false,
          message: 'Debes tener un coche fichado para equipar un potenciador.',
        }
      }

      booster.equipado = !booster.equipado
      await this.guardarEstadoEquipo()
      return {
        success: true,
        message: `Has ${booster.equipado ? 'equipado' : 'desequipado'} el potenciador: ${booster.nombre}.`,
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



