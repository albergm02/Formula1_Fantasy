<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { usarStoreEscuderia } from '@/stores/storeEquipo'
import { usarStoreLigas } from '@/stores/storeLigas'

import Cabecera from '@/components/Cabecera.vue'
import BarraNavegacion from '@/components/BarraNavegacion.vue'
import WidgetGranPremio from '@/components/WidgetGranPremio.vue'
import WidgetEstadisticasUsuario from '@/components/WidgetEstadisticasUsuario.vue'
import ProgressSpinner from 'primevue/progressspinner'

const storeEscuderia = usarStoreEscuderia()
const storeLigas = usarStoreLigas()
const ruta = useRoute()
const enrutador = useRouter()

onMounted(async () => {
  const idLiga = ruta.query.liga || storeLigas.idLigaActiva

  if (!idLiga) {
    enrutador.push('/ligas')
    return
  }

  storeLigas.idLigaActiva = idLiga
  await storeEscuderia.cargarEquipo(idLiga)
})
</script>

<!-------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!-------------------------------------------------------------------------------------------------------------------------->

<template>
  <div class="min-h-screen pb-24 bg-[#1A1A1F] font-sans">
    <Cabecera />

    <!-- Spinner mientras carga la escuderÃ­a -->
    <div v-if="storeEscuderia.cargandoEquipo" class="flex flex-col items-center justify-center gap-4">
      <ProgressSpinner strokeWidth="4" animationDuration=".5s" class="!w-12 !h-12" />
      <p class="text-[#D4A843] font-bold tracking-widest uppercase text-sm animate-pulse">Cargando telemetría...</p>
    </div>

    <!-- Contenido principal: widgets de stats y prÃ³ximo GP -->
    <main v-else class="p-4 max-w-md mx-auto w-full flex flex-col gap-6 mt-2">
      <WidgetEstadisticasUsuario />
      <WidgetGranPremio />
    </main>

    <BarraNavegacion />
  </div>
</template>
