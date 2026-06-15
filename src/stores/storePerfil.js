import { ref } from 'vue'
import { defineStore } from 'pinia'

export const usarStorePerfil = defineStore('perfil', () => {
  const usuarioActual = ref({
    uid: '',
    correoAutenticacion: '',
    nombreVisible: '',
    idsLigas: [],
  })
  const esAdministrador = ref(false)

  function establecerDatosUsuario({ uid, correo, nombre, idsLigas, esAdmin }) {
    usuarioActual.value.uid = uid
    usuarioActual.value.correoAutenticacion = correo
    usuarioActual.value.nombreVisible = nombre
    usuarioActual.value.idsLigas = idsLigas
    esAdministrador.value = esAdmin
  }

  function limpiarDatosUsuario() {
    usuarioActual.value = {
      uid: '',
      correoAutenticacion: '',
      nombreVisible: '',
      idsLigas: [],
    }
    esAdministrador.value = false
  }

  function actualizarIdsLigas(idsNuevos) {
    usuarioActual.value.idsLigas = idsNuevos
  }

  return {
    usuarioActual,
    esAdministrador,
    establecerDatosUsuario,
    limpiarDatosUsuario,
    actualizarIdsLigas,
  }
})
