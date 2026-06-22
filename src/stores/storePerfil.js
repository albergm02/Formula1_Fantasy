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

export const usarStorePerfil = defineStore('perfil', () => {
  const usuarioActual = ref({ uid: '', correoAutenticacion: '', nombreVisible: '', idsLigas: [] })
  const esAdministrador = ref(false)

    function establecerDatosUsuario({ uid, correo, nombre, idsLigas, esAdmin }) {
    usuarioActual.value.uid = uid
    usuarioActual.value.correoAutenticacion = correo
    usuarioActual.value.nombreVisible = nombre
    usuarioActual.value.idsLigas = idsLigas
    esAdministrador.value = esAdmin
  }

    function limpiarDatosUsuario() {
    usuarioActual.value = { uid: '', correoAutenticacion: '', nombreVisible: '', idsLigas: [] }
    esAdministrador.value = false
  }

    function actualizarIdsLigas(idsNuevos) {
    usuarioActual.value.idsLigas = idsNuevos
  }

    async function cargarFechaCambioCorreo(uid) {
    const datos = await cargarPerfilUsuario(uid)
    if (!datos.fechaUltimoCambioCorreo) return null
    return datos.fechaUltimoCambioCorreo.toDate()
  }

    async function cambiarContrasena() {
    await solicitarRestablecimientoContrasena()
  }

    async function cambiarCorreo(correoNuevo, contrasenaActual) {
    await reautenticarUsuario(contrasenaActual)
    await solicitarCambioCorreo(correoNuevo)
  }

    async function eliminarCuenta(contrasenaActual) {
    await reautenticarUsuario(contrasenaActual)
    await eliminarMiCuenta()
  }

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
