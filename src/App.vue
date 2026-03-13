<script setup>
import { onMounted } from 'vue';
import { RouterView } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

import { useFantasyStore } from '@/stores/storeFantasy'

const partida = useFantasyStore()

onMounted(() => {
  partida.inicializarDatos()
})
</script>

<template>
  <!-- Fondo de pantalla fijo con overlay oscuro para mejorar la legibilidad -->
  <div
    class="fixed inset-0 -z-10 h-full w-full bg-[url('/background.jpg')] bg-cover bg-center bg-no-repeat"
  >
    <div class="absolute inset-0 bg-zinc-900/70"></div>
  </div>

  <Toast position="top-center" />
  <ConfirmDialog />

  <!-- Sección de carga para cuando esté cargando -->
  <div v-if="!partida.datosCargados" class="flex h-screen w-full items-center justify-center">
    <div class="flex flex-col items-center gap-4 bg-zinc-900/80 p-8 rounded-2xl border border-zinc-800 shadow-2xl backdrop-blur-sm">
      <i class="pi pi-spin pi-spinner text-4xl text-red-600"></i>
      <span class="text-xs font-black text-white uppercase tracking-widest animate-pulse">
        Conectando con la pista...
      </span>
    </div>
  </div>

  <!-- v-else para mostrar el contenido principal cuando no se está cargando -->
  <RouterView v-else />

</template>

<style scoped></style>
