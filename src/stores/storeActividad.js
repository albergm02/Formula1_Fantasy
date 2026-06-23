/**
 * @module StoreActividad
 * @description Estado global para la actividad de la liga.
 */

import { ref } from 'vue'
import { defineStore } from 'pinia'
import { usarStoreLigas } from './storeLigas'
import { cargarActividadLiga } from '@/services/servicioActividad'

/**
 * Store para manejar la actividad de la liga.
 *
 * @returns {Object} - Contiene la actividad, el estado de carga y la función para cargar la actividad.
 */
export const usarStoreActividad = defineStore('actividad', () => {
  const storeLigas = usarStoreLigas()

  const actividad = ref([])
  const cargando = ref(false)

  /**
   * Carga la actividad de la liga activa.
   * @function cargarActividad
   * @memberof module:StoreActividad
   * @returns {Promise<void>}
   */
  async function cargarActividad() {
    const idLiga = storeLigas.idLigaActiva
    if (!idLiga) return

    cargando.value = true
    try {
      actividad.value = await cargarActividadLiga(idLiga)
    } catch (error) {
      actividad.value = []
      throw new Error(`Error al cargar la actividad de la liga: ${error.message}`)
    } finally {
      cargando.value = false
    }
  }

  return { actividad, cargando, cargarActividad }
})
