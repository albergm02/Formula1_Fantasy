import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  cargarListaLigas,
  cargarListaUsuarios,
  eliminarLigaComoAdministrador,
  eliminarUsuarioComoAdministrador,
} from '@/services/servicioAdministracion'

export const usarStoreAdministracion = defineStore('administracion', () => {
  const ligas = ref([])
  const usuarios = ref([])

  async function cargarListas() {
    const [listaLigas, listaUsuarios] = await Promise.all([
      cargarListaLigas(),
      cargarListaUsuarios(),
    ])
    ligas.value = listaLigas
    usuarios.value = listaUsuarios
  }

  async function eliminarUsuario(uid) {
    await eliminarUsuarioComoAdministrador(uid)
    await cargarListas()
  }

  async function eliminarLiga(idLiga) {
    await eliminarLigaComoAdministrador(idLiga)
    await cargarListas()
  }

  return {
    ligas,
    usuarios,
    cargarListas,
    eliminarUsuario,
    eliminarLiga,
  }
})
