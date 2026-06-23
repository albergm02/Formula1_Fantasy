import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  cargarListaJornadas,
  cargarListaLigas,
  cargarListaUsuarios,
  eliminarLigaComoAdministrador,
  eliminarUsuarioComoAdministrador,
} from '@/services/servicioAdministracion'

/**
 * Store para manejar la administración de ligas, usuarios y jornadas.
 *
 * @returns {Object} - Contiene las listas de ligas, usuarios y jornadas, y las funciones para cargarlas y eliminarlas.
 */
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
  /**
   * Elimina un usuario como administrador.
   *
   * @param {string} uid - ID del usuario a eliminar.
   */
  async function eliminarUsuario(uid) {
    await eliminarUsuarioComoAdministrador(uid)
    await cargarListas()
  }

  /**
   * Elimina una liga como administrador.
   *
   * @param {string} idLiga - ID de la liga a eliminar.
   */
  async function eliminarLiga(idLiga) {
    await eliminarLigaComoAdministrador(idLiga)
    await cargarListas()
  }

  return { ligas, usuarios, jornadas, cargarListas, eliminarUsuario, eliminarLiga }
})
