import { ref } from 'vue'
import { defineStore } from 'pinia'
import { usarStoreLigas } from './storeLigas'
import { cargarActividadLiga } from '@/services/servicioActividad'

export const usarStoreActividad = defineStore('actividad', () => {
  const storeLigas = usarStoreLigas()

  const actividad = ref([])
  const cargando = ref(false)

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
