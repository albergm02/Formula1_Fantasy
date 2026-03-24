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
    perfilExiste: false,

    // Booleano creado para mostrar una pantalla de "Cargando"
    datosCargados: false,
  }),

  actions: {
    /* Iniciar sesión y traer datos de perfil de Firebase */
    async initializeUserData(emailUsuario, nombreUsuario = '', opciones = {}) {
      const { crearSiNoExiste = true } = opciones

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
          this.perfilExiste = true
          return true
          // Caso de que sea un registro
        } else {
          if (!crearSiNoExiste) {
            this.usuarioGlobal.nombre = ''
            this.usuarioGlobal.ligasIds = []
            this.perfilExiste = false
            return false
          }

          this.usuarioGlobal.nombre = nombreUsuario
          this.usuarioGlobal.ligasIds = []
          await setDoc(docRef, {
            emailAuth: emailUsuario,
            nombre: nombreUsuario,
            ligasIds: [],
          })
          this.perfilExiste = true
          return true
        }
      } catch (error) {
        console.error('Error en initializeUserData (storeAuth.js):', error)
        this.perfilExiste = false
        return false
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
      this.perfilExiste = false
      this.datosCargados = true
    },
  },
})
