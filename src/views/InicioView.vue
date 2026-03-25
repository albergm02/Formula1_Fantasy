<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

/* Stores */
import { usarStoreEscuderia } from '@/stores/storeEquipo';
import { usarStoreLigas } from '@/stores/storeLigas';

/* Componentes UI */
import Cabecera from '@/components/Cabecera.vue'
import BarraNavegacion from '@/components/BarraNavegacion.vue'
import WidgetGranPremio from '@/components/WidgetGranPremio.vue'
import WidgetEstadisticasUsuario from '@/components/WidgetEstadisticasUsuario.vue'
import ProgressSpinner from 'primevue/progressspinner'

const escuderiaStore = usarStoreEscuderia()
const ligasStore = usarStoreLigas()
const route = useRoute()
const router = useRouter()

/* Al montar, comprobamos si hay una liga activa. Si no la hay, redirigimos a /ligas */
onMounted(async () => {
  const leagueId = route.query.liga || ligasStore.idLigaActiva

  if (!leagueId) {
    router.push('/ligas')
    return
  }

  // Guardamos la liga activa y cargamos la escuderÃ­a del jugador
  ligasStore.idLigaActiva = leagueId
  await escuderiaStore.cargarEquipo(leagueId)
})
</script>

<!-------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!-------------------------------------------------------------------------------------------------------------------------->

<template>
  <div class="min-h-screen pb-24 bg-[#1A1A1F] font-sans">
    <Cabecera />

    <!-- Spinner mientras carga la escuderÃ­a -->
    <div v-if="escuderiaStore.cargandoEquipo" class="flex flex-col items-center justify-center gap-4">
      <ProgressSpinner strokeWidth="4" animationDuration=".5s" class="!w-12 !h-12" />
      <p class="text-[#D4A843] font-bold tracking-widest uppercase text-sm animate-pulse">Cargando telemetrÃ­a...</p>
    </div>

    <!-- Contenido principal: widgets de stats y prÃ³ximo GP -->
    <main v-else class="p-4 max-w-md mx-auto w-full flex flex-col gap-6 mt-2">
      <WidgetEstadisticasUsuario />
      <WidgetGranPremio />
    </main>

    <BarraNavegacion />
  </div>
</template>


