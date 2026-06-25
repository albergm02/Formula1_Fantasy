/**
 * @module StoreAdministracion
 * @description Estado global para la administración.
 */

import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  cargarListaLigas,
  cargarListaUsuarios,
  eliminarLigaComoAdministrador,
  eliminarUsuarioComoAdministrador,
} from '@/services/servicioAdministracion'

/**
 * Store para manejar la administración de ligas y usuarios.
 *
 * @returns {Object} - Contiene las listas de ligas y usuarios, y las funciones para cargarlas y eliminarlas.
 */
export const usarStoreAdministracion = defineStore('administracion', () => {
  const ligas = ref([])
  const usuarios = ref([])

  /**
   * Carga en paralelo las listas de ligas y usuarios.
   * @function cargarListas
   * @memberof module:StoreAdministracion
   * @returns {Promise<void>}
   */
  async function cargarListas() {
    const [listaLigas, listaUsuarios] = await Promise.all([cargarListaLigas(), cargarListaUsuarios()])
    ligas.value = listaLigas
    usuarios.value = listaUsuarios
  }
  /**
   * Elimina un usuario como administrador.
   *
   * @function eliminarUsuario
   * @memberof module:StoreAdministracion
   * @param {string} uid - ID del usuario a eliminar.
   */
  async function eliminarUsuario(uid) {
    await eliminarUsuarioComoAdministrador(uid)
    await cargarListas()
  }

  /**
   * Elimina una liga como administrador.
   *
   * @function eliminarLiga
   * @memberof module:StoreAdministracion
   * @param {string} idLiga - ID de la liga a eliminar.
   */
  async function eliminarLiga(idLiga) {
    await eliminarLigaComoAdministrador(idLiga)
    await cargarListas()
  }

  return { ligas, usuarios, jornadas, cargarListas, eliminarUsuario, eliminarLiga }
})
