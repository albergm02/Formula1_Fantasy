<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'

import { usarStoreGaraje } from '@/stores/storeGaraje'
import { usarStoreLigas } from '@/stores/storeLigas'

import Cabecera from '@/components/Cabecera.vue'
import BarraNavegacion from '@/components/BarraNavegacion.vue'
import VistaGaraje from '@/components/VistaGaraje.vue'

const storeGaraje = usarStoreGaraje()
const storeLigas = usarStoreLigas()
const ruta = useRoute()

onMounted(async () => {
  const idLiga = storeGaraje.idLigaActiva || ruta.query.liga
  if (idLiga && !storeLigas.idLigaActiva) {
    storeLigas.idLigaActiva = idLiga
  }
  if (!storeGaraje.idLigaActiva && ruta.query.liga) {
    await storeGaraje.cargarEquipo(ruta.query.liga)
  }
})
</script>

<template>
  <Cabecera />
  <main>
    <VistaGaraje />
  </main>
  <BarraNavegacion />
</template>
