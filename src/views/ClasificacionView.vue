<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usarStoreLigas } from '@/stores/storeLigas'
import { usarStoreAutenticacion } from '@/stores/storeAutenticacion'
import { usarStoreEscuderia } from '@/stores/storeEquipo'
import BarraNavegacion from '@/components/BarraNavegacion.vue'
import Cabecera from '@/components/Cabecera.vue'

const storeLigas = usarStoreLigas()
const storeAutenticacion = usarStoreAutenticacion()
const storeEscuderia = usarStoreEscuderia()
const ruta = useRoute()

const ranking = ref([])
const cargando = ref(true)

/**
 * Carga la clasificación de la liga activa delegando al store.
 * @returns {Promise<void>}
 */
async function cargarClasificacion() {
  cargando.value = true

  try {
    const idLiga = ruta.query.liga || storeLigas.idLigaActiva
    if (!idLiga) return

    storeLigas.idLigaActiva = idLiga
    ranking.value = await storeLigas.cargarClasificacion(idLiga)
  } catch (error) {
    ranking.value = []
    throw new Error(`Error al cargar la clasificación: ${error.message}`)
  } finally {
    cargando.value = false
  }
}

onMounted(async () => {
  if (!storeEscuderia.idLigaActiva && ruta.query.liga) {
    await storeEscuderia.cargarEquipo(ruta.query.liga)
  }

  await cargarClasificacion()
})
</script>

<!-------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!-------------------------------------------------------------------------------------------------------------------------->

<template>
  <div class="min-h-screen pb-24 font-sans">
    <Cabecera />

    <main class="mx-auto w-full max-w-md p-4 flex flex-col gap-4 mt-4">

      <div class="flex justify-center pb-2 border-b border-[#FFFFFF]/50">
        <h2 class="text-2xl font-black text-white uppercase">Clasificación general</h2>
      </div>

      <div v-if="cargando" class="flex flex-col items-center justify-center py-10 gap-3">
        <i class="text-4xl text-[#D4A843] pi pi-spinner animate-spin"></i>
        <p class="text-[#D4A843] text-sm font-bold uppercase tracking-widest animate-pulse">Cargando clasificación...
        </p>
      </div>

      <div v-else class="flex flex-col gap-3">
        <div v-for="(jugador, indice) in ranking" :key="jugador.id"
          class="flex items-center justify-between p-4 border border-white"
          :class="{ '!border-[#E10600] !bg-[#E10600]/10': jugador.correo === storeAutenticacion.usuarioActual.correoAutenticacion }">
          <div class="flex items-center gap-4">
            <div class="relative text-2xl font-black italic -top-4" :class="{
              'text-yellow-400': indice === 0,
              'text-gray-200': indice === 1,
              'text-amber-600': indice === 2,
              'text-[#FFFFFF]': indice > 2
            }">{{ indice + 1 }}º</div>
            <div class="flex flex-col">
              <span class="font-bold text-lg uppercase text-white">{{ jugador.nombre }}</span>
              <span class="mt-1 text-xs text-[#F0ECEC]">
                Presupuesto: <span class="text-[#E10600] font-bold">${{ jugador.presupuesto }}M</span>
              </span>
            </div>
          </div>

          <div class="flex flex-col items-end justify-center text-right">
            <span class="text-3xl font-black text-[#D4A843]">{{ jugador.puntos }}</span>
            <span class="mt-1 text-xs uppercase font-bold text-[#F0ECEC]">PTS</span>
          </div>
        </div>
      </div>
    </main>
    <BarraNavegacion />
  </div>
</template>
