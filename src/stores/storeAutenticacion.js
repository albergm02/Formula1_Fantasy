import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { cargarPerfilUsuario, migrarCorreoUsuario } from '@/services/servicioPerfil'
import {
  guardarNuevoUsuario,
  registrarse,
  enviarVerificacionCorreo,
  iniciarSesion,
  iniciarSesionConGoogle as iniciarSesionConGoogleProveedor,
  restablecerContraseña,
  verificarBloqueoAcceso,
  registrarIntentoFallido,
  reiniciarContadorIntentos,
  cerrarSesion as cerrarSesionProveedor,
  escucharCambioEstadoAutenticacion,
} from '@/services/servicioAutenticacion'
import { auth } from '@/services/servicioFirebase'
import { usarStorePerfil } from '@/stores/storePerfil'

const CODIGOS_CREDENCIAL_INVALIDA = [
  'auth/invalid-credential',
  'auth/user-not-found',
  'auth/wrong-password',
]

export const usarStoreAutenticacion = defineStore('autenticacion', () => {
  const perfilExiste = ref(false)
  const datosCargados = ref(false)

  async function cargarOCrearPerfil(uid, correoUsuario, nombreUsuario = '') {
    const storePerfil = usarStorePerfil()
    datosCargados.value = false
    storePerfil.usuarioActual.uid = uid
    storePerfil.usuarioActual.correoAutenticacion = correoUsuario

    try {
      const datosPerfil = await cargarPerfilUsuario(uid)

      if (datosPerfil.correoAutenticacion) {
        storePerfil.establecerDatosUsuario({
          uid,
          correo: correoUsuario,
          nombre: datosPerfil.nombre || 'Piloto',
          idsLigas: datosPerfil.ligasIds || [],
          esAdmin: datosPerfil.esAdministrador === true,
        })
        perfilExiste.value = true
        return
      }

      await guardarNuevoUsuario(uid, correoUsuario, nombreUsuario)
      storePerfil.establecerDatosUsuario({
        uid,
        correo: correoUsuario,
        nombre: nombreUsuario,
        idsLigas: [],
        esAdmin: false,
      })
      perfilExiste.value = true
    } finally {
      datosCargados.value = true
    }
  }

  // Tras verificar el correo nuevo en Auth, el token lo refleja pero Firestore
  // conserva el anterior. Tolerante a fallos: se reintentará en el próximo login.
  async function reconciliarCorreoMigrado(correoToken, correoPerfil) {
    const correoNuevo = correoToken.trim().toLowerCase()
    const correoAnterior = correoPerfil.trim().toLowerCase()
    if (!correoAnterior || correoAnterior === correoNuevo) return
    await migrarCorreoUsuario(correoAnterior, correoNuevo).catch(() => {})
  }

  async function verificarExistenciaPerfil(uid, correoUsuario) {
    const storePerfil = usarStorePerfil()
    datosCargados.value = false
    storePerfil.usuarioActual.uid = uid
    storePerfil.usuarioActual.correoAutenticacion = correoUsuario

    try {
      const datosPerfil = await cargarPerfilUsuario(uid)

      if (datosPerfil.correoAutenticacion) {
        await reconciliarCorreoMigrado(correoUsuario, datosPerfil.correoAutenticacion)
        storePerfil.establecerDatosUsuario({
          uid,
          correo: correoUsuario,
          nombre: datosPerfil.nombre || 'Piloto',
          idsLigas: datosPerfil.ligasIds || [],
          esAdmin: datosPerfil.esAdministrador === true,
        })
        perfilExiste.value = true
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

  function limpiarSesion() {
    const storePerfil = usarStorePerfil()
    datosCargados.value = false
    storePerfil.limpiarDatosUsuario()
    perfilExiste.value = false
    datosCargados.value = true
  }

  function obtenerEstadoSesion() {
    const storePerfil = usarStorePerfil()
    return { esAdministrador: storePerfil.esAdministrador }
  }

  async function procesarRegistro(correo, contrasena, nombreUsuario) {
    const credencial = await registrarse(correo, contrasena)
    await enviarVerificacionCorreo()
    await cargarOCrearPerfil(credencial.user.uid, credencial.user.email, nombreUsuario)
    await cerrarSesion()
  }

  async function autenticarConCorreo(correo, contrasena) {
    try {
      return await iniciarSesion(correo, contrasena)
    } catch (error) {
      if (CODIGOS_CREDENCIAL_INVALIDA.includes(error?.code)) {
        await registrarIntentoFallido(correo.trim())
      }
      throw error
    }
  }

  async function iniciarSesionConCorreo(correo, contrasena) {
    await verificarBloqueoAcceso(correo.trim())
    const credencial = await autenticarConCorreo(correo, contrasena)
    if (!credencial.user.emailVerified) {
      await cerrarSesion()
      throw new Error('CORREO_NO_VERIFICADO')
    }
    await reiniciarContadorIntentos()
    await verificarExistenciaPerfil(credencial.user.uid, credencial.user.email)
    return obtenerEstadoSesion()
  }

  async function iniciarSesionConGoogle() {
    const credencial = await iniciarSesionConGoogleProveedor()
    const correoGoogle = credencial.user.email?.trim()
    if (!correoGoogle) throw new Error('SIN_CORREO_GOOGLE')
    const perfilEncontrado = await verificarExistenciaPerfil(credencial.user.uid, correoGoogle)
    return { perfilEncontrado, ...obtenerEstadoSesion() }
  }

  async function restablecerContrasena(correo) {
    await restablecerContraseña(correo)
  }

  async function cerrarSesion() {
    await cerrarSesionProveedor()
    limpiarSesion()
  }

  function observarEstadoSesion(alCambiarUsuario) {
    return escucharCambioEstadoAutenticacion(alCambiarUsuario)
  }

  const tieneSesionConContrasena = computed(
    () => auth.currentUser?.providerData.some((p) => p.providerId === 'password') ?? false,
  )

  return {
    perfilExiste,
    datosCargados,
    tieneSesionConContrasena,
    cargarOCrearPerfil,
    verificarExistenciaPerfil,
    limpiarSesion,
    procesarRegistro,
    iniciarSesionConCorreo,
    iniciarSesionConGoogle,
    restablecerContrasena,
    cerrarSesion,
    observarEstadoSesion,
  }
})
