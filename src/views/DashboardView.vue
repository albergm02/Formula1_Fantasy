<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

/* Stores */
import { useEscuderiaStore } from '@/stores/storeTeam';
import { useLigasStore } from '@/stores/storeLeagues';

/* Componentes UI */
import Header from '@/components/Header.vue'
import Navbar from '@/components/Navbar.vue'
import WidgetGP from '@/components/WidgetGP.vue'
import WidgetUserStats from '@/components/WidgetUserStats.vue'
import ProgressSpinner from 'primevue/progressspinner'

const escuderiaStore = useEscuderiaStore()
const ligasStore = useLigasStore()
const route = useRoute()
const router = useRouter()

/* Al montar, comprobamos si hay una liga activa. Si no la hay, redirigimos a /ligas */
onMounted(async () => {
  const leagueId = route.query.liga || ligasStore.activeLeagueId

  if (!leagueId) {
    router.push('/ligas')
    return
  }

  // Guardamos la liga activa y cargamos la escudería del jugador
  ligasStore.activeLeagueId = leagueId
  await escuderiaStore.loadTeam(leagueId)
})
</script>

<!-------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!-------------------------------------------------------------------------------------------------------------------------->

<template>
  <div class="min-h-screen bg-[#1A1A1F] font-sans pb-24">
    <Header />

    <!-- Spinner mientras carga la escudería -->
    <div v-if="escuderiaStore.isTeamLoading" class="flex flex-col items-center justify-center gap-4">
      <ProgressSpinner strokeWidth="4" animationDuration=".5s" class="!w-12 !h-12" />
      <p class="text-[#D4A843] font-bold tracking-widest animate-pulse uppercase text-sm">Cargando telemetría...</p>
    </div>

    <!-- Contenido principal: widgets de stats y próximo GP -->
    <main v-else class="p-4 max-w-4xl mx-auto flex flex-col gap-6 mt-2">
      <WidgetUserStats />
      <WidgetGP />
    </main>

    <Navbar />
  </div>
</template>