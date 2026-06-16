import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  suscribirseHistorialJornadas,
  cargarCatalogoPilotos,
  cargarPerfilesPuntuacion,
} from '@/services/servicioJornada'
import {
  obtenerUltimoGranPremioFinalizado,
  obtenerSiguienteGranPremio,
} from '@/services/servicioOpenF1'

export const usarStoreJornada = defineStore('jornada', () => {
  const historial = ref([])
  const catalogoPilotos = ref([])
  const perfilesPuntuacion = ref({})
  const ultimoGranPremioPendiente = ref(null)
  const siguienteGranPremio = ref(null)

  async function cargarCatalogo() {
    try {
      catalogoPilotos.value = await cargarCatalogoPilotos()
    } catch {
      catalogoPilotos.value = []
    }
    try {
      perfilesPuntuacion.value = await cargarPerfilesPuntuacion()
    } catch {
      perfilesPuntuacion.value = {}
    }
  }

  // Si Firestore aún no tiene jornadas, consulto OpenF1 directamente para
  // evitar una pantalla vacía mostrando el último Gran Premio finalizado.
  async function cargarGranPremioPendiente() {
    if (ultimoGranPremioPendiente.value) return
    try {
      ultimoGranPremioPendiente.value = await obtenerUltimoGranPremioFinalizado()
    } catch {
      ultimoGranPremioPendiente.value = null
    }
  }

  function escucharHistorial(alActualizar) {
    return suscribirseHistorialJornadas(async (jornadas) => {
      historial.value = jornadas
      if (jornadas.length === 0) await cargarGranPremioPendiente()
      alActualizar(jornadas)
    })
  }

  async function cargarSiguienteGranPremio() {
    siguienteGranPremio.value = await obtenerSiguienteGranPremio()
  }

  return {
    historial,
    catalogoPilotos,
    perfilesPuntuacion,
    ultimoGranPremioPendiente,
    siguienteGranPremio,
    cargarCatalogo,
    escucharHistorial,
    cargarSiguienteGranPremio,
  }
})
