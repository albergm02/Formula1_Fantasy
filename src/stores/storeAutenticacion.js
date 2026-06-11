import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { cargarPerfilUsuario, crearPerfilUsuario } from '@/services/servicioAutenticacion'
import { migrarCorreoUsuario } from '@/services/servicioPerfil'
import { auth } from '@/services/servicioFirebase'

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

  // Tras verificar el correo nuevo en Auth, el token lo refleja pero Firestore
  // conserva el anterior. Tolerante a fallos: se reintentará en el próximo login.
  async function reconciliarCorreoMigrado(correoToken, correoPerfil) {
    const correoNuevo = correoToken.trim().toLowerCase()
    const correoAnterior = correoPerfil.trim().toLowerCase()
    if (!correoAnterior || correoAnterior === correoNuevo) return
    await migrarCorreoUsuario(correoAnterior, correoNuevo).catch(() => {})
  }

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

  function actualizarIdsLigas(idsNuevos) {
    usuarioActual.value.idsLigas = idsNuevos
  }

  const tieneSesionConContrasena = computed(
    () => auth.currentUser?.providerData.some((p) => p.providerId === 'password') ?? false,
  )

  return {
    usuarioActual,
    perfilExiste,
    datosCargados,
    esAdministrador,
    tieneSesionConContrasena,
    cargarOCrearPerfil,
    verificarExistenciaPerfil,
    limpiarSesion,
    actualizarIdsLigas,
  }
})
