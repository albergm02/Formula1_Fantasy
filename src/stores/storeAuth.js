import { defineStore } from 'pinia'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../services/firebase'

/* Definición del almacén de autenticación */
export const useAuthStore = defineStore('auth', {

  state: () => ({
    usuarioGlobal: {
      emailAuth: '',
      nombre: '',
      ligasIds: [],
    },

    // Booleano creado para mostrar una pantalla de "Cargando"
    datosCargados: false,
  }),

  actions: {
    /* Iniciar sesión y traer datos de perfil de Firebase */
    async initializeUserData(emailUsuario, nombreUsuario) {
      try {
        this.datosCargados = false
        this.usuarioGlobal.emailAuth = emailUsuario
        const docRef = doc(db, 'usuarios', emailUsuario)
        const docSnap = await getDoc(docRef)
        // Caso de un login
        if (docSnap.exists()) {
          const data = docSnap.data()
          this.usuarioGlobal.nombre = data.nombre || 'Piloto'
          this.usuarioGlobal.ligasIds = data.ligasIds || []
          // Caso de que sea un registro
        } else {
          this.usuarioGlobal.nombre = nombreUsuario
          this.usuarioGlobal.ligasIds = []
          await setDoc(docRef, {
            emailAuth: emailUsuario,
            nombre: nombreUsuario,
            ligasIds: [],
          })
        }
      } catch (error) {
        console.error('Error en initializeUserData (storeAuth.js):', error)
      } finally {
        this.datosCargados = true
      }
    },

    /* Cerrar sesión y limpiar datos */
    cerrarSesion() {
      this.datosCargados = false
      this.usuarioGlobal = {
        emailAuth: '',
        nombre: '',
        ligasIds: [],
      }
      this.datosCargados = true
    },
  },
})
