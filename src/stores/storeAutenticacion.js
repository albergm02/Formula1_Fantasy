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

    /**
     * Inicializa los datos del usuario en el store.
     * @param {string} correoUsuario - El correo del usuario.
     * @param {string} nombreUsuario - El nombre visible del usuario.
     * @param {Object} opciones - Opciones adicionales.
     * @param {boolean} opciones.crearNuevo - Indica si se debe crear un perfil si no existe.
     * @returns {Promise<boolean>} - Retorna true si el perfil existe o se creó, false en caso contrario.
     */
    async inicializarDatosUsuario(correoUsuario, nombreUsuario = '', opciones = {}) {
      const { crearNuevo = true } = opciones

      try {
        this.datosCargados = false
        this.usuarioActual.correoAutenticacion = correoUsuario
        // Compruebo si el perfil del usuario ya existe en Firestore.
        const docRef = doc(db, 'usuarios', correoUsuario)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          this.usuarioActual.nombreVisible = data.nombre || 'Piloto'
          this.usuarioActual.idsLigas = data.ligasIds || []
          this.perfilExiste = true
          return true
        }

        // Si el perfil no existe y no se desea crear uno nuevo, se limpian los datos y se retorna false.
        if (!crearNuevo) {
          this.usuarioActual.nombreVisible = ''
          this.usuarioActual.idsLigas = []
          this.perfilExiste = false
          return false
        }

        // Si el perfil no existe y se desea crear uno nuevo, se inicializan los datos y se guarda en Firestore.
        this.usuarioActual.nombreVisible = nombreUsuario
        this.usuarioActual.idsLigas = []
        await setDoc(docRef, {
          correoAutenticacion: correoUsuario,
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

    /**
     * Limpia los datos de la sesión actual, restableciendo el estado del store a su configuración inicial.
     */
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



