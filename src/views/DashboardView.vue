<template>

  <Header />

  <div v-if="escuderiaStore.cargando" class="flex flex-col items-center justify-center h-screen gap-4">
    <p class="text-white text-lg">Cargando escudería...</p>
    <ProgressSpinner />
  </div>


  <main v-else class="p-4 mx-auto w-full gap-1 mt-2">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <WidgetGP />
    </div>

  </main>

  <Navbar />

</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEscuderiaStore } from '@/stores/storeEscuderia';

import Header from '@/components/Header.vue'
import Navbar from '@/components/Navbar.vue'
import WidgetGP from '@/components/WidgetGP.vue'
import { ProgressSpinner } from 'primevue';

const escuderiaStore = useEscuderiaStore()
const route = useRoute()
const router = useRouter()

/* Cargamos la escudería al montar el componente, obteniendo la liga actual de la query o del store */
onMounted(async () => {
  const ligaId = route.query.liga || null

  if (!ligaId) {
    router.push('/ligas')
    return
  }

  await escuderiaStore.cargarEscuderia(ligaId)
})

</script>
