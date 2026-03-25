import { defineStore } from 'pinia'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../services/servicioFirebase'

export const usarStoreAutenticacion = defineStore('auth', {
  state: () => ({
    usuarioActual: {
      correoAutenticacion: '',
      nombreVisible: '',
      idsLigas: [],
    },
    perfilExiste: false,
    datosCargados: false,
  }),

  actions: {
    async inicializarDatosUsuario(correoUsuario, nombreUsuario = '', opciones = {}) {
      const { createIfMissing = true } = opciones

      try {
        this.datosCargados = false
        this.usuarioActual.correoAutenticacion = correoUsuario
        const docRef = doc(db, 'usuarios', correoUsuario)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          this.usuarioActual.nombreVisible = data.nombre || 'Piloto'
          this.usuarioActual.idsLigas = data.ligasIds || []
          this.perfilExiste = true
          return true
        }

        if (!createIfMissing) {
          this.usuarioActual.nombreVisible = ''
          this.usuarioActual.idsLigas = []
          this.perfilExiste = false
          return false
        }

        this.usuarioActual.nombreVisible = nombreUsuario
        this.usuarioActual.idsLigas = []
        await setDoc(docRef, {
          emailAuth: correoUsuario,
          nombre: nombreUsuario,
          ligasIds: [],
        })
        this.perfilExiste = true
        return true
      } catch (error) {
        console.error('Error en inicializarDatosUsuario (storeAutenticacion.js):', error)
        this.perfilExiste = false
        return false
      } finally {
        this.datosCargados = true
      }
    },

    limpiarSesion() {
      this.datosCargados = false
      this.usuarioActual = {
        correoAutenticacion: '',
        nombreVisible: '',
        idsLigas: [],
      }
      this.perfilExiste = false
      this.datosCargados = true
    },
  },
})



