/**
 * @module StorePerfil
 * @description Estado global para el perfil del usuario.
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  cargarPerfilUsuario,
  escucharPerfilUsuario,
  reautenticarUsuario,
  solicitarRestablecimientoContrasena,
  solicitarCambioCorreo,
  eliminarMiCuenta,
} from '@/services/servicioPerfil'

/**
 * Store para manejar el perfil del usuario.
 *
 * @returns {Object} - Contiene el estado del perfil del usuario y funciones para gestionarlo.
 */
export const usarStorePerfil = defineStore('perfil', () => {
  const usuarioActual = ref({ uid: '', correoAutenticacion: '', nombreVisible: '', idsLigas: [] })
  const esAdministrador = ref(false)

  /**
   * Establece los datos del usuario actual.
   * @function establecerDatosUsuario
   * @memberof module:StorePerfil
   * @param {Object} datos - Datos del usuario.
   * @param {string} datos.uid - ID del usuario.
   * @param {string} datos.correo - Correo electrónico del usuario.
   * @param {string} datos.nombre - Nombre visible del usuario.
   * @param {Array<string>} datos.idsLigas - IDs de las ligas a las que pertenece el usuario.
   * @param {boolean} datos.esAdmin - Indica si el usuario es administrador.
   */
  function establecerDatosUsuario({ uid, correo, nombre, idsLigas, esAdmin }) {
    usuarioActual.value.uid = uid
    usuarioActual.value.correoAutenticacion = correo
    usuarioActual.value.nombreVisible = nombre
    usuarioActual.value.idsLigas = idsLigas
    esAdministrador.value = esAdmin
  }

  /**
   * Limpia los datos del usuario actual.
   * @function limpiarDatosUsuario
   * @memberof module:StorePerfil
   * @returns {void}
   */
  function limpiarDatosUsuario() {
    usuarioActual.value = { uid: '', correoAutenticacion: '', nombreVisible: '', idsLigas: [] }
    esAdministrador.value = false
  }

  /**
   * Actualiza los IDs de las ligas a las que pertenece el usuario.
   * @function actualizarIdsLigas
   * @memberof module:StorePerfil
   * @param {Array<string>} idsNuevos - Nuevos IDs de las ligas.
   */
  function actualizarIdsLigas(idsNuevos) {
    usuarioActual.value.idsLigas = idsNuevos
  }

  /**
   * Carga la fecha del último cambio de correo del usuario.
   * @function cargarFechaCambioCorreo
   * @memberof module:StorePerfil
   * @param {string} uid - ID del usuario.
   * @returns {Promise<Date|null>} - Fecha del último cambio de correo o null si no existe.
   */
  async function cargarFechaCambioCorreo(uid) {
    const datos = await cargarPerfilUsuario(uid)
    if (!datos.fechaUltimoCambioCorreo) return null
    return datos.fechaUltimoCambioCorreo.toDate()
  }

  /**
   * Cambia la contraseña del usuario.
   * @function cambiarContrasena
   * @memberof module:StorePerfil
   * @returns {Promise<void>} - Promesa que se resuelve cuando la contraseña ha sido cambiada.
   */
  async function cambiarContrasena() {
    await solicitarRestablecimientoContrasena()
  }

  /**
   * Cambia el correo electrónico del usuario.
   * @function cambiarCorreo
   * @memberof module:StorePerfil
   * @param {string} correoNuevo - Nuevo correo electrónico.
   * @param {string} contrasenaActual - Contraseña actual del usuario.
   * @returns {Promise<void>} - Promesa que se resuelve cuando el correo ha sido cambiado.
   */
  async function cambiarCorreo(correoNuevo, contrasenaActual) {
    await reautenticarUsuario(contrasenaActual)
    await solicitarCambioCorreo(correoNuevo)
  }

  /**
   * Elimina la cuenta del usuario.
   * @function eliminarCuenta
   * @memberof module:StorePerfil
   * @param {string} contrasenaActual - Contraseña actual del usuario.
   * @returns {Promise<void>} - Promesa que se resuelve cuando la cuenta ha sido eliminada.
   */
  async function eliminarCuenta(contrasenaActual) {
    await reautenticarUsuario(contrasenaActual)
    await eliminarMiCuenta()
  }

  /**
   * Observa los cambios en el perfil del usuario.
   * @function observarPerfil
   * @memberof module:StorePerfil
   * @param {string} uid - ID del usuario.
   * @param {Function} alCambiarPerfil - Función a ejecutar cuando el perfil cambie.
   * @returns {Function} - Función para detener la observación.
   */
  function observarPerfil(uid, alCambiarPerfil) {
    return escucharPerfilUsuario(uid, alCambiarPerfil)
  }

  return {
    usuarioActual,
    esAdministrador,
    establecerDatosUsuario,
    limpiarDatosUsuario,
    actualizarIdsLigas,
    cargarFechaCambioCorreo,
    cambiarContrasena,
    cambiarCorreo,
    eliminarCuenta,
    observarPerfil,
  }
})
