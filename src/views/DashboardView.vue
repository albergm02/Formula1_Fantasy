<script setup>
import Button from 'primevue/button'

import { useFantasyStore } from '@/stores/storeFantasy.js'
import Navbar from '@/components/Navbar.vue'
import Header from '@/components/Header.vue'

const fantasyStore = useFantasyStore()

</script>

<template>
  <div class="min-h-screen w-full font-sans pb-20">

    <Header />

    <main class="max-w-5xl mx-auto p-4 mt-8 flex flex-col items-center text-center gap-4">
      <h2 class="text-2xl font-bold text-white">¡Bienvenido al Paddock!</h2>
      <p class="text-zinc-400">Próximamente aquí verás tu resumen de jornada.</p>

      <Button @click="fantasyStore.resetearCuenta()" label="RESETEAR PARTIDA" class="!bg-red-600 !text-white !mt-8" />
    </main>

    <Navbar />

  </div>
</template>