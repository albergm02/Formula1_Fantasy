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

export const usarStoreAutenticacion = defineStore('autenticacion', () => {
  const perfilExiste = ref(false)
  const datosCargados = ref(false)

    async function cargarPerfil(uid, correoUsuario, datosPerfil) {
    const storePerfil = usarStorePerfil()
    storePerfil.establecerDatosUsuario({
      uid,
      correo: correoUsuario,
      nombre: datosPerfil.nombreVisible || datosPerfil.nombre || 'Piloto',
      idsLigas: datosPerfil.ligasIds || [],
      esAdmin: datosPerfil.esAdministrador === true,
    })
    perfilExiste.value = true
  }

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

  // Tras verificar el correo nuevo en Auth, el token lo refleja pero Firestore
  // conserva el anterior. Tolerante a fallos: se reintentará en el próximo login.
    async function reconciliarCorreoMigrado(correoToken, correoPerfil) {
    const correoNuevo = correoToken.trim().toLowerCase()
    const correoAnterior = correoPerfil.trim().toLowerCase()
    if (!correoAnterior || correoAnterior === correoNuevo) return
    await migrarCorreo(correoAnterior, correoNuevo).catch(() => {})
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

    function limpiarSesion() {
    const storePerfil = usarStorePerfil()
    datosCargados.value = false
    storePerfil.limpiarDatosUsuario()
    perfilExiste.value = false
    datosCargados.value = true
  }

    async function procesarRegistro(correo, contrasena, nombreUsuario) {
    await registrarse(correo, contrasena)
    await enviarVerificacionCorreo()
    await crearPerfil(nombreUsuario)
    await cerrarSesion()
  }

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

    async function iniciarSesionConGoogle() {
    const credencial = await iniciarSesionConGoogleProveedor()
    const correoGoogle = credencial.user.email?.trim()
    if (!correoGoogle) throw new Error('SIN_CORREO_GOOGLE')
    const perfilEncontrado = await verificarExistenciaPerfil(credencial.user.uid, correoGoogle)
    const storePerfil = usarStorePerfil()
    return { perfilEncontrado, esAdministrador: storePerfil.esAdministrador }
  }

    async function cerrarSesion() {
    await cerrarSesionProveedor()
    limpiarSesion()
  }

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
