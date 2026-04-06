import { ref } from 'vue'
import { defineStore } from 'pinia'
import { cargarPerfilUsuario, crearPerfilUsuario } from '@/services/servicioAutenticacion'

export const usarStoreAutenticacion = defineStore('autenticacion', () => {
  const usuarioActual = ref({
    correoAutenticacion: '',
    nombreVisible: '',
    idsLigas: [],
  })
  const perfilExiste = ref(false)
  const datosCargados = ref(false)
  const esAdministrador = ref(false)

  /**
   * Carga el perfil del usuario desde Firestore y actualiza el estado.
   * Si el perfil no existe, lo crea con los datos básicos proporcionados.
   * Usado en los flujos de registro (email/contraseña y Google completado).
   * @param {string} correoUsuario
   * @param {string} nombreUsuario
   */
  async function cargarOCrearPerfil(correoUsuario, nombreUsuario = '') {
    datosCargados.value = false
    usuarioActual.value.correoAutenticacion = correoUsuario

    try {
      const datosPerfil = await cargarPerfilUsuario(correoUsuario)

      if (datosPerfil.correoAutenticacion) {
        usuarioActual.value.nombreVisible = datosPerfil.nombre || 'Piloto'
        usuarioActual.value.idsLigas = datosPerfil.ligasIds || []
        esAdministrador.value = datosPerfil.esAdministrador === true
        perfilExiste.value = true
        return
      }

      await crearPerfilUsuario(correoUsuario, nombreUsuario)
      usuarioActual.value.nombreVisible = nombreUsuario
      usuarioActual.value.idsLigas = []
      perfilExiste.value = true
    } finally {
      datosCargados.value = true
    }
  }

  /**
   * Verifica si el perfil del usuario existe en Firestore y carga sus datos.
   * No crea el perfil si no existe: devuelve false para que el llamador decida.
   * Usado en el inicio de sesión y en el guardia de navegación del router.
   * @param {string} correoUsuario
   * @returns {Promise<boolean>} true si el perfil existe y se cargó, false si no existe.
   */
  async function verificarExistenciaPerfil(correoUsuario) {
    datosCargados.value = false
    usuarioActual.value.correoAutenticacion = correoUsuario

    try {
      const datosPerfil = await cargarPerfilUsuario(correoUsuario)

      if (datosPerfil.correoAutenticacion) {
        usuarioActual.value.nombreVisible = datosPerfil.nombre || 'Piloto'
        usuarioActual.value.idsLigas = datosPerfil.ligasIds || []
        esAdministrador.value = datosPerfil.esAdministrador === true
        perfilExiste.value = true
        return true
      }

      usuarioActual.value.nombreVisible = ''
      usuarioActual.value.idsLigas = []
      perfilExiste.value = false
      return false
    } finally {
      datosCargados.value = true
    }
  }

  /**
   * Limpia los datos de la sesión actual, restableciendo el estado del store a su configuración inicial.
   * Invocado por el observador de Firebase Auth cuando detecta que la sesión se cerró.
   */
  function limpiarSesion() {
    datosCargados.value = false
    usuarioActual.value = {
      correoAutenticacion: '',
      nombreVisible: '',
      idsLigas: [],
    }
    perfilExiste.value = false
    esAdministrador.value = false
    datosCargados.value = true
  }

  return {
    usuarioActual,
    perfilExiste,
    datosCargados,
    esAdministrador,
    cargarOCrearPerfil,
    verificarExistenciaPerfil,
    limpiarSesion,
  }
})
