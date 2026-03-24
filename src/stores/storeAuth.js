import { defineStore } from 'pinia'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../services/firebase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    currentUser: {
      authEmail: '',
      displayName: '',
      leagueIds: [],
    },
    profileExists: false,
    isDataLoaded: false,
  }),

  actions: {
    async initializeUserData(userEmail, username = '', options = {}) {
      const { createIfMissing = true } = options

      try {
        this.isDataLoaded = false
        this.currentUser.authEmail = userEmail
        const docRef = doc(db, 'usuarios', userEmail)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          this.currentUser.displayName = data.nombre || 'Piloto'
          this.currentUser.leagueIds = data.ligasIds || []
          this.profileExists = true
          return true
        }

        if (!createIfMissing) {
          this.currentUser.displayName = ''
          this.currentUser.leagueIds = []
          this.profileExists = false
          return false
        }

        this.currentUser.displayName = username
        this.currentUser.leagueIds = []
        await setDoc(docRef, {
          emailAuth: userEmail,
          nombre: username,
          ligasIds: [],
        })
        this.profileExists = true
        return true
      } catch (error) {
        console.error('Error en initializeUserData (storeAuth.js):', error)
        this.profileExists = false
        return false
      } finally {
        this.isDataLoaded = true
      }
    },

    clearSession() {
      this.isDataLoaded = false
      this.currentUser = {
        authEmail: '',
        displayName: '',
        leagueIds: [],
      }
      this.profileExists = false
      this.isDataLoaded = true
    },
  },
})
