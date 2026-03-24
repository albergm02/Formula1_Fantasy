import { defineStore } from 'pinia'
import { collection, doc, updateDoc, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useAuthStore } from './storeAuth'
import { createEmptyGarage, calculateResaleValue } from '@/utils/garage'

export const useEscuderiaStore = defineStore('escuderia', {
  state: () => ({
    activeLeagueId: null,
    activeParticipantId: null,
    budget: 0,
    points: 0,
    garage: createEmptyGarage(),
    isTeamLoading: false,
  }),

  actions: {
    async loadTeam(leagueId) {
      this.isTeamLoading = true
      const authStore = useAuthStore()

      try {
        this.activeLeagueId = leagueId
        const participantsRef = collection(db, 'participaciones')
        const participantQuery = query(
          participantsRef,
          where('id_liga', '==', leagueId),
          where('email_usuario', '==', authStore.currentUser.authEmail),
        )
        const querySnapshot = await getDocs(participantQuery)

        if (!querySnapshot.empty) {
          const participantDocument = querySnapshot.docs[0]
          this.activeParticipantId = participantDocument.id
          const participantData = participantDocument.data()
          this.budget = participantData.presupuesto
          this.points = participantData.puntos
          this.garage = participantData.garaje || createEmptyGarage()
          return
        }

        console.warn(
          'Error in loadTeam (storeTeam.js): active participant not found for the selected league',
        )
        this.budget = 50.0
        this.points = 0
        this.garage = createEmptyGarage()
      } catch (error) {
        console.warn('Error in loadTeam (storeTeam.js):', error)
        this.budget = 50.0
        this.points = 0
        this.garage = createEmptyGarage()
      } finally {
        this.isTeamLoading = false
      }
    },

    async saveTeamState() {
      if (!this.activeParticipantId) {
        console.warn('Error in saveTeamState (storeTeam.js): missing active participant id')
        return
      }

      try {
        const participantRef = doc(db, 'participaciones', this.activeParticipantId)
        await updateDoc(participantRef, {
          presupuesto: this.budget,
          puntos: this.points,
          garaje: this.garage,
        })
      } catch (error) {
        console.error('Error in saveTeamState (storeTeam.js):', error)
      }
    },

    async buyItem(item) {
      if (this.budget < item.precio) {
        return {
          success: false,
          message: 'No tienes suficiente presupuesto para fichar este elemento.',
        }
      }

      if (item.tipo === 'coche' && this.garage.coche) {
        return {
          success: false,
          message: 'Ya tienes un coche fichado. Vende el actual para fichar uno nuevo.',
        }
      }

      if (item.tipo === 'piloto' && this.garage.pilotos.length >= 2) {
        return {
          success: false,
          message: 'Ya tienes 2 pilotos fichados. Vende uno para fichar otro.',
        }
      }

      this.budget -= item.precio
      const ownedItem = { ...item, instancia_id: Date.now() }

      if (item.tipo === 'coche') {
        this.garage.coche = ownedItem
      } else if (item.tipo === 'piloto') {
        this.garage.pilotos.push(ownedItem)
      } else if (item.tipo === 'potenciador') {
        this.garage.potenciadores.push(ownedItem)
      }

      await this.saveTeamState()
      return { success: true, message: `Has fichado: ${item.nombre} exitosamente.` }
    },

    async sellItem(item) {
      if (!item) {
        return { success: false, message: 'Elemento no encontrado para vender.' }
      }

      try {
        this.budget += calculateResaleValue(item.precio)

        if (item.tipo === 'coche') {
          this.garage.coche = null
          this.garage.potenciadores.forEach((booster) => {
            booster.equipado = false
          })
        } else if (item.tipo === 'piloto') {
          this.garage.pilotos = this.garage.pilotos.filter(
            (driver) => driver.instancia_id !== item.instancia_id,
          )
        } else if (item.tipo === 'potenciador') {
          this.garage.potenciadores = this.garage.potenciadores.filter(
            (booster) => booster.instancia_id !== item.instancia_id,
          )
        }

        await this.saveTeamState()
        return {
          success: true,
          message: `Has obtenido ${calculateResaleValue(item.precio)} de presupuesto, ¡Hasta pronto, ${item.nombre}.!`,
        }
      } catch (error) {
        console.error('Error in sellItem (storeTeam.js):', error)
        return { success: false, message: 'Error al vender el elemento. Inténtalo de nuevo.' }
      }
    },

    async toggleBooster(instanceId) {
      const booster = this.garage.potenciadores.find((item) => item.instancia_id === instanceId)

      if (!booster) {
        return { success: false, message: 'Potenciador no encontrado para equipar.' }
      }

      if (!this.garage.coche) {
        return {
          success: false,
          message: 'Debes tener un coche fichado para equipar un potenciador.',
        }
      }

      booster.equipado = !booster.equipado
      await this.saveTeamState()
      return {
        success: true,
        message: `Has ${booster.equipado ? 'equipado' : 'desequipado'} el potenciador: ${booster.nombre}.`,
      }
    },

    clearActiveLeagueState() {
      this.activeLeagueId = null
      this.activeParticipantId = null
      this.budget = 0
      this.points = 0
      this.garage = createEmptyGarage()
    },
  },
})
