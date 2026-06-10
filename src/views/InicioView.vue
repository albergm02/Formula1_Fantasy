<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { usarStoreGaraje } from '@/stores/storeGaraje'
import { usarStoreLigas } from '@/stores/storeLigas'

import Cabecera from '@/components/Cabecera.vue'
import BarraNavegacion from '@/components/BarraNavegacion.vue'
import WidgetGranPremio from '@/components/WidgetGranPremio.vue'
import WidgetEstadisticasUsuario from '@/components/WidgetEstadisticasUsuario.vue'
import WidgetDesgloseJornada from '@/components/WidgetDesgloseJornada.vue'

const storeGaraje = usarStoreGaraje()
const storeLigas = usarStoreLigas()
const ruta = useRoute()
const router = useRouter()

onMounted(async () => {
  const idLiga = ruta.query.liga || storeLigas.idLigaActiva

  if (!idLiga) {
    router.push('/ligas')
    return
  }

  storeLigas.idLigaActiva = idLiga
  await storeGaraje.cargarEquipo(idLiga)
})
</script>


<template>
  <div class="min-h-screen pb-24 font-sans">
    <Cabecera />
    <main class="flex flex-col w-full max-w-lg mx-auto mt-2 p-4 gap-6">
      <WidgetEstadisticasUsuario />
      <WidgetGranPremio />
      <WidgetDesgloseJornada />
    </main>
    <BarraNavegacion />
  </div>
</template>
