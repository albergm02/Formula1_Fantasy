<script setup>
import { computed } from 'vue'
import { usarStoreEscuderia } from '@/stores/storeEquipo'
import { usarStoreLigas } from '@/stores/storeLigas'

const escuderiaStore = usarStoreEscuderia()
const ligasStore = usarStoreLigas()
/**
 * Calcula el nombre de la liga activa. 
 */
const activeLeagueName = computed(() => {
  const activeLeague = ligasStore.detallesLigas.find(
    (league) => league.id === ligasStore.idLigaActiva,
  )
  return activeLeague ? activeLeague.nombre : 'Mi Campeonato'
})
</script>

<template>
  <!-- Bienvenida -->
  <div class="flex items-center justify-between bg-transparent border-b border-zinc-800 p-5">
    <div class="flex flex-col">
      <span class="text-[#D4A843] text-[10px] font-black uppercase mb-1">Bienvenido al Paddock</span>
      <h1 class="text-xl font-black text-white italic uppercase w-32">
        {{ activeLeagueName }}
      </h1>
    </div>
    <!-- EstadÃ­sticas del usuario -->
    <div class="flex flex-col items-end gap-1 pl-4">
      <div class="flex items-center gap-2">
        <span class="text-[#F0ECEC] text-xs font-medium uppercase">Puntos:</span>
        <span class="text-white font-black text-lg bg-[#D4A843] px-2">{{ escuderiaStore.puntos || 0 }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-[#F0ECEC] text-xs font-medium uppercase">Presupuesto:</span>
        <span class="text-[#E10600] font-black text-lg">${{ escuderiaStore.presupuesto || 50 }}M</span>
      </div>
    </div>
  </div>
</template>


