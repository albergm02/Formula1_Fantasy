import { ref } from 'vue'
import { defineStore } from 'pinia'
import { cargarPerfilUsuario, crearPerfilUsuario } from '@/services/servicioAutenticacion'
import { migrarCorreoUsuario } from '@/services/servicioPerfil'

export const usarStoreAutenticacion = defineStore('autenticacion', () => {
  const usuarioActual = ref({
    uid: '',
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
   * @param {string} uid - UID de Firebase Auth (clave del documento en Firestore).
   * @param {string} correoUsuario
   * @param {string} nombreUsuario
   */
  async function cargarOCrearPerfil(uid, correoUsuario, nombreUsuario = '') {
    datosCargados.value = false
    usuarioActual.value.uid = uid
    usuarioActual.value.correoAutenticacion = correoUsuario

    try {
      const datosPerfil = await cargarPerfilUsuario(uid)

      if (datosPerfil.correoAutenticacion) {
        usuarioActual.value.nombreVisible = datosPerfil.nombre || 'Piloto'
        usuarioActual.value.idsLigas = datosPerfil.ligasIds || []
        esAdministrador.value = datosPerfil.esAdministrador === true
        perfilExiste.value = true
        return
      }

      await crearPerfilUsuario(uid, correoUsuario, nombreUsuario)
      usuarioActual.value.nombreVisible = nombreUsuario
      usuarioActual.value.idsLigas = []
      perfilExiste.value = true
    } finally {
      datosCargados.value = true
    }
  }

  /**
   * Propaga a Firestore un cambio de correo ya verificado en Firebase Auth.
   * Tras confirmar el correo nuevo, el token lo refleja pero el perfil conserva
   * el anterior; esta reconciliación actualiza usuarios, participaciones y ligas.
   * Tolera fallos para no impedir el acceso: el desfase se reintenta en el
   * siguiente inicio de sesión.
   * @param {string} correoToken - Correo actual del token autenticado (el nuevo).
   * @param {string} correoPerfil - Correo guardado en Firestore (el anterior).
   * @returns {Promise<void>}
   */
  async function reconciliarCorreoMigrado(correoToken, correoPerfil) {
    const correoNuevo = correoToken.trim().toLowerCase()
    const correoAnterior = correoPerfil.trim().toLowerCase()
    if (!correoAnterior || correoAnterior === correoNuevo) return
    await migrarCorreoUsuario(correoAnterior, correoNuevo).catch(() => {})
  }

  /**
   * Verifica si el perfil del usuario existe en Firestore y carga sus datos.
   * No crea el perfil si no existe: devuelve false para que el llamador decida.
   * Usado en el inicio de sesión y en el guardia de navegación del router.
   * @param {string} uid - UID de Firebase Auth (clave del documento en Firestore).
   * @param {string} correoUsuario
   * @returns {Promise<boolean>} true si el perfil existe y se cargó, false si no existe.
   */
  async function verificarExistenciaPerfil(uid, correoUsuario) {
    datosCargados.value = false
    usuarioActual.value.uid = uid
    usuarioActual.value.correoAutenticacion = correoUsuario

    try {
      const datosPerfil = await cargarPerfilUsuario(uid)

      if (datosPerfil.correoAutenticacion) {
        await reconciliarCorreoMigrado(correoUsuario, datosPerfil.correoAutenticacion)
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
      uid: '',
      correoAutenticacion: '',
      nombreVisible: '',
      idsLigas: [],
    }
    perfilExiste.value = false
    esAdministrador.value = false
    datosCargados.value = true
  }

  /**
   * Actualiza la lista de IDs de ligas del usuario en el estado local.
   * Invocado por el listener en tiempo real de App.vue cuando Firestore notifica
   * que ligasIds cambió (p.ej. tras una expulsión por parte del administrador).
   * @param {string[]} idsNuevos - El nuevo array de IDs de ligas.
   */
  function actualizarIdsLigas(idsNuevos) {
    usuarioActual.value.idsLigas = idsNuevos
  }

  return {
    usuarioActual,
    perfilExiste,
    datosCargados,
    esAdministrador,
    cargarOCrearPerfil,
    verificarExistenciaPerfil,
    limpiarSesion,
    actualizarIdsLigas,
  }
})
