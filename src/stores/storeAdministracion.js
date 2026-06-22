import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  cargarListaJornadas,
  cargarListaLigas,
  cargarListaUsuarios,
  eliminarLigaComoAdministrador,
  eliminarUsuarioComoAdministrador,
} from '@/services/servicioAdministracion'

export const usarStoreAdministracion = defineStore('administracion', () => {
  const ligas = ref([])
  const usuarios = ref([])
  const jornadas = ref([])

    async function cargarListas() {
    const [listaLigas, listaUsuarios, listaJornadas] = await Promise.all([cargarListaLigas(), cargarListaUsuarios(), cargarListaJornadas()])
    ligas.value = listaLigas
    usuarios.value = listaUsuarios
    jornadas.value = listaJornadas
  }

    async function eliminarUsuario(uid) {
    await eliminarUsuarioComoAdministrador(uid)
    await cargarListas()
  }

    async function eliminarLiga(idLiga) {
    await eliminarLigaComoAdministrador(idLiga)
    await cargarListas()
  }

  return { ligas, usuarios, jornadas, cargarListas, eliminarUsuario, eliminarLiga }
})
