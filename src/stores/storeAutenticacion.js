import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { cargarPerfilUsuario, crearPerfilUsuario } from '@/services/servicioAutenticacion'
import { migrarCorreoUsuario } from '@/services/servicioPerfil'
import { auth } from '@/services/servicioFirebase'
import { usarStoreUsuario } from '@/stores/storeUsuario'

export const usarStoreAutenticacion = defineStore('autenticacion', () => {
  const perfilExiste = ref(false)
  const datosCargados = ref(false)

  async function cargarOCrearPerfil(uid, correoUsuario, nombreUsuario = '') {
    const storeUsuario = usarStoreUsuario()
    datosCargados.value = false
    storeUsuario.usuarioActual.uid = uid
    storeUsuario.usuarioActual.correoAutenticacion = correoUsuario

    try {
      const datosPerfil = await cargarPerfilUsuario(uid)

      if (datosPerfil.correoAutenticacion) {
        storeUsuario.establecerDatosUsuario({
          uid,
          correo: correoUsuario,
          nombre: datosPerfil.nombre || 'Piloto',
          idsLigas: datosPerfil.ligasIds || [],
          esAdmin: datosPerfil.esAdministrador === true,
        })
        perfilExiste.value = true
        return
      }

      await crearPerfilUsuario(uid, correoUsuario, nombreUsuario)
      storeUsuario.establecerDatosUsuario({
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
    const storeUsuario = usarStoreUsuario()
    datosCargados.value = false
    storeUsuario.usuarioActual.uid = uid
    storeUsuario.usuarioActual.correoAutenticacion = correoUsuario

    try {
      const datosPerfil = await cargarPerfilUsuario(uid)

      if (datosPerfil.correoAutenticacion) {
        await reconciliarCorreoMigrado(correoUsuario, datosPerfil.correoAutenticacion)
        storeUsuario.establecerDatosUsuario({
          uid,
          correo: correoUsuario,
          nombre: datosPerfil.nombre || 'Piloto',
          idsLigas: datosPerfil.ligasIds || [],
          esAdmin: datosPerfil.esAdministrador === true,
        })
        perfilExiste.value = true
        return true
      }

      storeUsuario.establecerDatosUsuario({
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
    const storeUsuario = usarStoreUsuario()
    datosCargados.value = false
    storeUsuario.limpiarDatosUsuario()
    perfilExiste.value = false
    datosCargados.value = true
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
  }
})
