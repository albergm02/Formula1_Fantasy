import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { cargarPerfilUsuario, migrarCorreo, crearPerfil as llamarCrearPerfil } from '@/services/servicioPerfil'
import {
  registrarse,
  enviarVerificacionCorreo,
  iniciarSesion,
  iniciarSesionConGoogle as iniciarSesionConGoogleProveedor,
  restablecerContraseña,
  cerrarSesion as cerrarSesionProveedor,
  escucharCambioEstadoAutenticacion,
} from '@/services/servicioAutenticacion'
import { auth } from '@/services/servicioFirebase'
import { usarStorePerfil } from '@/stores/storePerfil'

/**
 * Store para manejar la autenticación y el perfil del usuario.
 *
 * @returns {Object} - Contiene el estado de autenticación, el perfil del usuario y las funciones para iniciar sesión, registrarse y cerrar sesión.
 */
export const usarStoreAutenticacion = defineStore('autenticacion', () => {
  const perfilExiste = ref(false)
  const datosCargados = ref(false)

  /**
   * Carga el perfil del usuario en el store.
   * @param {string} uid - El UID del usuario.
   * @param {string} correoUsuario - El correo del usuario.
   * @param {Object} datosPerfil - Los datos del perfil del usuario.
   * @returns {Promise<void>}
   */
  async function cargarPerfil(uid, correoUsuario, datosPerfil) {
    const storePerfil = usarStorePerfil()
    storePerfil.establecerDatosUsuario({
      uid,
      correo: correoUsuario,
      nombre: datosPerfil.nombreVisible || 'Piloto',
      idsLigas: datosPerfil.ligasIds || [],
      esAdmin: datosPerfil.esAdministrador === true,
    })
    perfilExiste.value = true
  }

  /**
   * Crea un perfil de usuario en la base de datos y actualiza el store de perfil.
   * @param {string} nombreUsuario - Nombre del usuario a crear.
   * @returns {Promise<void>}
   */
  async function crearPerfil(nombreUsuario) {
    const storePerfil = usarStorePerfil()
    await llamarCrearPerfil(nombreUsuario)
    storePerfil.establecerDatosUsuario({
      uid: auth.currentUser?.uid || '',
      correo: auth.currentUser?.email || '',
      nombre: nombreUsuario,
      idsLigas: [],
      esAdmin: false,
    })
    perfilExiste.value = true
  }

  /**
   * Actualiza el correo del perfil si ha sido migrado desde otro correo.
   * @param {string} correoToken - El correo obtenido del token de autenticación.
   * @param {string} correoPerfil - El correo almacenado en el perfil del usuario.
   * @returns {Promise<void>}
   */
  async function reconciliarCorreoMigrado(correoToken, correoPerfil) {
    const correoNuevo = correoToken.trim().toLowerCase()
    const correoAnterior = correoPerfil.trim().toLowerCase()
    if (!correoAnterior || correoAnterior === correoNuevo) return
    await migrarCorreo(correoAnterior, correoNuevo).catch(() => {})
  }

  /**
   * Verifica la existencia del perfil del usuario en la base de datos.
   * @param {string} uid - El UID del usuario.
   * @param {string} correoUsuario - El correo del usuario.
   * @returns {Promise<boolean>} - Devuelve true si el perfil existe, false en caso contrario.
   */
  async function verificarExistenciaPerfil(uid, correoUsuario) {
    const storePerfil = usarStorePerfil()
    datosCargados.value = false
    storePerfil.usuarioActual.uid = uid
    storePerfil.usuarioActual.correoAutenticacion = correoUsuario

    try {
      const datosPerfil = await cargarPerfilUsuario(uid)

      if (datosPerfil.correoAutenticacion) {
        await reconciliarCorreoMigrado(correoUsuario, datosPerfil.correoAutenticacion)
        await cargarPerfil(uid, correoUsuario, datosPerfil)
        return true
      }

      storePerfil.establecerDatosUsuario({
        uid,
        correo: correoUsuario,
        nombre: '',
        idsLigas: [],
        esAdmin: false,
      })
      perfilExiste.value = false
      return false
    } finally {
      datosCargados.value = true
    }
  }

  /**
   * Limpia la sesión del usuario, restableciendo los datos del perfil y el estado de carga.
   * @returns {void}
   */
  function limpiarSesion() {
    const storePerfil = usarStorePerfil()
    storePerfil.limpiarDatosUsuario()
    perfilExiste.value = false
    datosCargados.value = true
  }

  /**
   * Procesa el registro de un nuevo usuario, incluyendo la creación del perfil y el envío de la verificación de correo.
   * @param {string} correo - El correo del usuario.
   * @param {string} contrasena - La contraseña del usuario.
   * @param {string} nombreUsuario - El nombre del usuario.
   * @returns {Promise<void>}
   */
  async function procesarRegistro(correo, contrasena, nombreUsuario) {
    await registrarse(correo, contrasena)
    await enviarVerificacionCorreo()
    await crearPerfil(nombreUsuario)
    await cerrarSesion()
  }

  /**
   * Inicia sesión con correo y contraseña, verificando la existencia del perfil y el estado de verificación del correo.
   * @param {string} correo - El correo del usuario.
   * @param {string} contrasena - La contraseña del usuario.
   * @returns {Promise<{esAdministrador: boolean}>} - Devuelve un objeto indicando si el usuario es administrador.
   */
  async function iniciarSesionConCorreo(correo, contrasena) {
    const credencial = await iniciarSesion(correo, contrasena)
    if (!credencial.user.emailVerified) {
      await cerrarSesion()
      throw new Error('CORREO_NO_VERIFICADO')
    }
    await verificarExistenciaPerfil(credencial.user.uid, credencial.user.email)
    const storePerfil = usarStorePerfil()
    return { esAdministrador: storePerfil.esAdministrador }
  }

  /**
   * Inicia sesión con Google, verificando la existencia del perfil y el estado de verificación del correo.
   * @returns {Promise<{perfilEncontrado: boolean, esAdministrador: boolean}>} - Devuelve un objeto indicando si se encontró el perfil y si el usuario es administrador.
   */
  async function iniciarSesionConGoogle() {
    const credencial = await iniciarSesionConGoogleProveedor()
    const correoGoogle = credencial.user.email?.trim()
    if (!correoGoogle) throw new Error('SIN_CORREO_GOOGLE')
    const perfilEncontrado = await verificarExistenciaPerfil(credencial.user.uid, correoGoogle)
    const storePerfil = usarStorePerfil()
    return { perfilEncontrado, esAdministrador: storePerfil.esAdministrador }
  }

  /**
   * Cierra la sesión del usuario, limpiando los datos del perfil y restableciendo el estado de carga.
   * @returns {Promise<void>}
   */
  async function cerrarSesion() {
    await cerrarSesionProveedor()
    limpiarSesion()
  }

  /**
   * Observa el estado de la sesión del usuario, ejecutando una función cuando cambia el usuario.
   * @param {Function} alCambiarUsuario - Función a ejecutar cuando cambia el usuario.
   * @returns {Function} - Devuelve una función para cancelar la observación.
   */
  function observarEstadoSesion(alCambiarUsuario) {
    return escucharCambioEstadoAutenticacion(alCambiarUsuario)
  }

  const tieneSesionConContrasena = computed(() => auth.currentUser?.providerData.some((p) => p.providerId === 'password') ?? false)

  return {
    perfilExiste,
    datosCargados,
    tieneSesionConContrasena,
    crearPerfil,
    verificarExistenciaPerfil,
    limpiarSesion,
    procesarRegistro,
    iniciarSesionConCorreo,
    iniciarSesionConGoogle,
    restablecerContrasena: restablecerContraseña,
    cerrarSesion,
    observarEstadoSesion,
  }
})
