/**
 * @module StoreJornada
 * @description Estado global para la información de las jornadas.
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { suscribirseHistorialJornadas, cargarCatalogoYPerfiles } from '@/services/servicioJornada'
import { obtenerUltimoGranPremioFinalizado, obtenerSiguienteGranPremio } from '@/services/servicioOpenF1'

/**
 * Store para manejar la información de las jornadas, incluyendo el historial de jornadas, el catálogo de pilotos y los próximos eventos.
 *
 * @returns {Object} - Contiene el historial de jornadas, el catálogo de pilotos, el último Gran Premio pendiente y el siguiente Gran Premio, junto con funciones para cargar y escuchar estos datos.
 */
export const usarStoreJornada = defineStore('jornada', () => {
  const historial = ref([])
  const catalogoPilotos = ref([])
  const ultimoGranPremioPendiente = ref(null)
  const siguienteGranPremio = ref(null)

  /**
   * Carga el catálogo de pilotos.
   * @function cargarCatalogo
   * @memberof module:StoreJornada
   * @returns {Promise<void>}
   */
  async function cargarCatalogo() {
    try {
      catalogoPilotos.value = await cargarCatalogoYPerfiles()
    } catch {
      catalogoPilotos.value = []
    }
  }

  /**
   * Carga el último Gran Premio pendiente.
   * @function cargarGranPremioPendiente
   * @memberof module:StoreJornada
   * @returns {Promise<void>}
   */
  async function cargarGranPremioPendiente() {
    if (ultimoGranPremioPendiente.value) return
    try {
      ultimoGranPremioPendiente.value = await obtenerUltimoGranPremioFinalizado()
    } catch {
      ultimoGranPremioPendiente.value = null
    }
  }

  /**
   * Escucha los cambios en el historial de jornadas y actualiza el estado del store.
   * @function escucharHistorial
   * @memberof module:StoreJornada
   * @param {Function} alActualizar - Función callback que se ejecuta cuando el historial se actualiza.
   * @returns {Function} - Devuelve una función para cancelar la suscripción al historial.
   */
  function escucharHistorial(alActualizar) {
    return suscribirseHistorialJornadas(async (jornadas) => {
      historial.value = jornadas
      if (jornadas.length === 0) await cargarGranPremioPendiente()
      alActualizar(jornadas)
    })
  }

  /**
   * Carga el siguiente Gran Premio.
   * @function cargarSiguienteGranPremio
   * @memberof module:StoreJornada
   * @returns {Promise<void>}
   */
  async function cargarSiguienteGranPremio() {
    siguienteGranPremio.value = await obtenerSiguienteGranPremio()
  }

  return {
    historial,
    catalogoPilotos,
    ultimoGranPremioPendiente,
    siguienteGranPremio,
    cargarCatalogo,
    escucharHistorial,
    cargarSiguienteGranPremio,
  }
})
