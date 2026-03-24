<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEscuderiaStore } from '@/stores/storeEscuderia';
import { useLigasStore } from '@/stores/storeLigas';

import Header from '@/components/Header.vue'
import Navbar from '@/components/Navbar.vue'
import WidgetGP from '@/components/WidgetGP.vue'
import WidgetUserStats from '@/components/WidgetUserStats.vue'
import ProgressSpinner from 'primevue/progressspinner'

const escuderiaStore = useEscuderiaStore()
const ligasStore = useLigasStore()
const route = useRoute()
const router = useRouter()

/**
 * Al montar el componente, se verifica si hay una liga activa (ya sea por query o por estado global).
 * Si no hay una liga activa, se redirige al usuario a la página de ligas para que elija o cree una. 
 * Si hay una liga activa, se carga la escudería correspondiente a esa liga.
 */
onMounted(async () => {
  const ligaId = route.query.liga || ligasStore.ligaActiva

  if (!ligaId) {
    router.push('/ligas')
    return
  }

  ligasStore.ligaActiva = ligaId
  await escuderiaStore.cargarEscuderia(ligaId)
})
</script>

<template>
  <div class="min-h-screen bg-[#15151E] font-sans pb-24">
    <Header />

    <div v-if="escuderiaStore.cargandoEscuderia" class="flex flex-col items-center justify-center gap-4">
      <ProgressSpinner strokeWidth="4" animationDuration=".5s" class="!w-12 !h-12" />
      <p class="text-[#00E5E5] font-bold tracking-widest animate-pulse uppercase text-sm">Cargando telemetría...</p>
    </div>

    <main v-else class="p-4 max-w-4xl mx-auto flex flex-col gap-6 mt-2">
      <WidgetUserStats />
      <WidgetGP />
    </main>

    <Navbar />
  </div>
</template>