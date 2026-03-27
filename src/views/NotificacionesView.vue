<script setup>
import Cabecera from '@/components/Cabecera.vue'
import BarraNavegacion from '@/components/BarraNavegacion.vue'
</script>

<!-------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE----------------------------------------------------------->

<!-------------------------------------------------------------------------------------------------------------------------->

<template>
  <Cabecera />

  <main class="p-4 max-w-md mx-auto w-full flex flex-col items-center justify-center gap-4 mt-24 mb-24">
    <i class="pi pi-bell text-5xl text-zinc-600"></i>
    <h2 class="text-lg font-black text-white uppercase tracking-widest">Notificaciones</h2>
    <p class="text-xs text-zinc-500 uppercase tracking-widest text-center">Próximamente</p>
  </main>

  <BarraNavegacion />
</template>
