import { defineStore } from 'pinia'
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  arrayUnion,
  arrayRemove,
  getDoc,
  deleteDoc,
} from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuthStore } from './storeAuth'
import { createEmptyGarage } from '@/utils/garage'
import { generateLeagueInviteCode, hasReachedLeagueLimit } from '@/utils/leagues'

export const useLigasStore = defineStore('ligas', {
  state: () => ({
    leagueDetails: [],
    activeLeagueId: null,
  }),

  actions: {
    async createLeague(leagueName) {
      const authStore = useAuthStore()
      const userEmail = authStore.currentUser.authEmail

      if (hasReachedLeagueLimit(authStore.currentUser.leagueIds)) {
        return {
          success: false,
          message: 'Solo puedes pertenecer o crear un máximo de 8 ligas.',
        }
      }

      try {
        const participantsRef = collection(db, 'participaciones')
        const adminQuery = query(
          participantsRef,
          where('email_usuario', '==', userEmail),
          where('rol', '==', 'admin'),
        )
        const adminSnapshot = await getDocs(adminQuery)

        if (adminSnapshot.size >= 2) {
          return {
            success: false,
            message: 'Reglamento FIA: Has alcanzado el límite máximo de 2 ligas creadas.',
          }
        }

        const inviteCode = generateLeagueInviteCode()
        const newLeague = {
          nombre: leagueName,
          admin: authStore.currentUser.authEmail,
          codigo_invitacion: inviteCode,
          participantes: 1,
          fecha_creacion: new Date(),
        }
        const leagueDocument = await addDoc(collection(db, 'ligas'), newLeague)
        const leagueId = leagueDocument.id

        const participant = {
          id_liga: leagueId,
          email_usuario: authStore.currentUser.authEmail,
          rol: 'admin',
          presupuesto: 50.0,
          puntos: 0,
          garaje: createEmptyGarage(),
        }
        await addDoc(collection(db, 'participaciones'), participant)

        const userRef = doc(db, 'usuarios', authStore.currentUser.authEmail)
        await updateDoc(userRef, {
          ligasIds: arrayUnion(leagueId),
        })
        authStore.currentUser.leagueIds.push(leagueId)
        await this.loadUserLeagues()
        return { success: true, message: `Liga creada. Código: ${inviteCode}` }
      } catch (error) {
        console.error('Error in createLeague (storeLeagues.js):', error)
        return { success: false, message: 'Error al crear la liga. Inténtalo de nuevo.' }
      }
    },

    async loadUserLeagues() {
      const authStore = useAuthStore()

      if (!authStore.currentUser.leagueIds.length) {
        this.leagueDetails = []
        return
      }

      try {
        const leaguesRef = collection(db, 'ligas')
        const leaguesSnapshot = await getDocs(leaguesRef)
        const leaguesData = leaguesSnapshot.docs.map((leagueDoc) => ({
          id: leagueDoc.id,
          ...leagueDoc.data(),
        }))
        this.leagueDetails = leaguesData.filter((league) =>
          authStore.currentUser.leagueIds.includes(league.id),
        )
      } catch (error) {
        console.error('Error in loadUserLeagues (storeLeagues.js):', error)
        this.leagueDetails = []
      }
    },

    async joinLeague(inviteCode) {
      const authStore = useAuthStore()

      if (hasReachedLeagueLimit(authStore.currentUser.leagueIds)) {
        return {
          success: false,
          message: 'Solo puedes pertenecer o crear un máximo de 8 ligas.',
        }
      }

      try {
        const normalizedInviteCode = inviteCode.toUpperCase()
        const leaguesRef = collection(db, 'ligas')
        const leagueQuery = query(leaguesRef, where('codigo_invitacion', '==', normalizedInviteCode))
        const querySnapshot = await getDocs(leagueQuery)

        if (querySnapshot.empty) {
          return { success: false, message: 'Código de invitación no válido.' }
        }

        const leagueDocument = querySnapshot.docs[0]
        const leagueId = leagueDocument.id

        if (authStore.currentUser.leagueIds.includes(leagueId)) {
          return { success: false, message: 'Ya perteneces a esta liga.' }
        }

        const participant = {
          id_liga: leagueId,
          email_usuario: authStore.currentUser.authEmail,
          rol: 'miembro',
          presupuesto: 50.0,
          puntos: 0,
          garaje: createEmptyGarage(),
        }
        await addDoc(collection(db, 'participaciones'), participant)

        const leagueRef = doc(db, 'ligas', leagueId)
        await updateDoc(leagueRef, {
          participantes: leagueDocument.data().participantes + 1,
        })

        const userRef = doc(db, 'usuarios', authStore.currentUser.authEmail)
        await updateDoc(userRef, {
          ligasIds: arrayUnion(leagueId),
        })

        authStore.currentUser.leagueIds.push(leagueId)
        await this.loadUserLeagues()
        return { success: true, message: 'Te has unido a la liga.' }
      } catch (error) {
        console.error('Error in joinLeague (storeLeagues.js):', error)
        return { success: false, message: 'Error al unirse a la liga. Inténtalo de nuevo.' }
      }
    },

    async leaveLeague(leagueId) {
      const authStore = useAuthStore()
      const userEmail = authStore.currentUser.authEmail

      try {
        const leagueRef = doc(db, 'ligas', leagueId)
        const leagueSnapshot = await getDoc(leagueRef)
        if (!leagueSnapshot.exists()) {
          return { success: false, message: 'La liga no existe.' }
        }
        const leagueData = leagueSnapshot.data()

        const participantsRef = collection(db, 'participaciones')
        const leagueQuery = query(participantsRef, where('id_liga', '==', leagueId))
        const participantsSnapshot = await getDocs(leagueQuery)

        let currentParticipant = null
        const remainingParticipants = []

        participantsSnapshot.forEach((participantDocument) => {
          if (participantDocument.data().email_usuario === userEmail) {
            currentParticipant = { id: participantDocument.id, ...participantDocument.data() }
          } else {
            remainingParticipants.push({ id: participantDocument.id, ...participantDocument.data() })
          }
        })

        if (!currentParticipant) {
          return { success: false, message: 'No estás en esta liga.' }
        }

        if (remainingParticipants.length === 0) {
          return await this.deleteLeague(leagueId)
        }

        if (currentParticipant.rol === 'admin') {
          remainingParticipants.sort((firstParticipant, secondParticipant) => {
            return secondParticipant.puntos - firstParticipant.puntos
          })
          const nextAdmin = remainingParticipants[0]

          await updateDoc(doc(db, 'participaciones', nextAdmin.id), { rol: 'admin' })
          await updateDoc(leagueRef, {
            admin: nextAdmin.email_usuario,
            participantes: leagueData.participantes - 1,
          })
        } else {
          await updateDoc(leagueRef, { participantes: leagueData.participantes - 1 })
        }

        await deleteDoc(doc(db, 'participaciones', currentParticipant.id))
        const userRef = doc(db, 'usuarios', userEmail)
        await updateDoc(userRef, { ligasIds: arrayRemove(leagueId) })

        authStore.currentUser.leagueIds = authStore.currentUser.leagueIds.filter(
          (id) => id !== leagueId,
        )

        if (this.activeLeagueId === leagueId) {
          this.activeLeagueId = null
        }

        await this.loadUserLeagues()

        return { success: true, message: 'Has abandonado la liga.' }
      } catch (error) {
        console.error('Error in leaveLeague (storeLeagues.js):', error)
        return { success: false, message: 'Error de telemetría al abandonar.' }
      }
    },

    async deleteLeague(leagueId) {
      const authStore = useAuthStore()
      const userEmail = authStore.currentUser.authEmail

      try {
        const leagueRef = doc(db, 'ligas', leagueId)
        const leagueSnapshot = await getDoc(leagueRef)

        if (!leagueSnapshot.exists()) {
          return { success: false, message: 'La liga no existe.' }
        }

        if (leagueSnapshot.data().admin !== userEmail) {
          return { success: false, message: 'Acceso denegado: No eres la FIA (Admin).' }
        }

        const participantsRef = collection(db, 'participaciones')
        const leagueQuery = query(participantsRef, where('id_liga', '==', leagueId))
        const participantsSnapshot = await getDocs(leagueQuery)

        for (const participantDocument of participantsSnapshot.docs) {
          const participantData = participantDocument.data()
          const userRef = doc(db, 'usuarios', participantData.email_usuario)
          await updateDoc(userRef, { ligasIds: arrayRemove(leagueId) })
          await deleteDoc(doc(db, 'participaciones', participantDocument.id))
        }

        await deleteDoc(leagueRef)

        authStore.currentUser.leagueIds = authStore.currentUser.leagueIds.filter(
          (id) => id !== leagueId,
        )

        if (this.activeLeagueId === leagueId) {
          this.activeLeagueId = null
        }

        await this.loadUserLeagues()

        return { success: true, message: 'Campeonato disuelto con éxito.' }
      } catch (error) {
        console.error('Error in deleteLeague (storeLeagues.js):', error)
        return { success: false, message: 'Error al destruir la liga.' }
      }
    },
  },
})
