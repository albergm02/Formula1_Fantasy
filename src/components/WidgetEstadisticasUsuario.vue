<script setup>
import { computed } from 'vue'
import { usarStoreGaraje } from '@/stores/storeGaraje'
import { usarStoreLigas } from '@/stores/storeLigas'

const storeGaraje = usarStoreGaraje()
const storeLigas = usarStoreLigas()
const nombreLigaActiva = computed(() => {
  const ligaActiva = storeLigas.detallesLigas.find(
    (liga) => liga.id === storeLigas.idLigaActiva,
  )
  return ligaActiva.nombre
})
</script>

<template>
  <div class="flex flex-col items-center gap-3 p-5 bg-transparent border-b border-zinc-800">
    <!-- Bienvenida y nombre de liga centrados -->
    <div class="flex flex-col items-center">
      <span class="text-[#D4A843] text-xs font-black uppercase tracking-widest">Bienvenido al Paddock</span>
      <h1 class="text-2xl font-black text-white uppercase text-center">{{ nombreLigaActiva }}</h1>
    </div>
    <!-- Estadísticas centradas -->
    <div class="flex gap-8">
      <div class="flex flex-col items-center">
        <span class="text-[#F0ECEC] text-[10px] font-black uppercase tracking-widest">Presupuesto</span>
        <span class="text-green-400 font-black text-xl">${{ (storeGaraje.presupuesto || 50).toFixed(2) }}M</span>
      </div>
      <div class="flex flex-col items-center">
        <span class="text-[#F0ECEC] text-[10px] font-black uppercase tracking-widest">Puntos</span>
        <span class="text-white font-black text-xl">{{ storeGaraje.puntos || 0 }}</span>
      </div>
    </div>
  </div>
</template>
