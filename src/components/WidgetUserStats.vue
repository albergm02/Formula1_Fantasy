<script setup>
import { computed } from 'vue'
import { useEscuderiaStore } from '@/stores/storeEscuderia'
import { useLigasStore } from '@/stores/storeLigas'

const escuderiaStore = useEscuderiaStore()
const ligasStore = useLigasStore()
/**
 * Calcula el nombre de la liga activa. 
 */
const nombreLigaActual = computed(() => {
  const liga = ligasStore.ligasDetalles.find(l => l.id === ligasStore.ligaActiva)
  return liga ? liga.nombre : 'Mi Campeonato'
})
</script>

<template>
  <!-- Bienvenida -->
  <div class="flex items-center justify-between bg-transparent border-b border-zinc-800 p-5">
    <div class="flex flex-col">
      <span class="text-[#00E5E5] text-[10px] font-black uppercase mb-1">Bienvenido al Paddock</span>
      <h1 class="text-xl font-black text-white italic uppercase w-32">
        {{ nombreLigaActual }}
      </h1>
    </div>
    <!-- Estadísticas del usuario -->
    <div class="flex flex-col items-end gap-1 pl-4">
      <div class="flex items-center gap-2">
        <span class="text-[#D9D9D9] text-xs font-medium uppercase">Puntos:</span>
        <span class="text-white font-black text-lg bg-[#00E5E5] px-2">{{ escuderiaStore.puntos || 0 }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-[#D9D9D9] text-xs font-medium uppercase">Presupuesto:</span>
        <span class="text-[#FF1E00] font-black text-lg">${{ escuderiaStore.presupuesto || 50 }}M</span>
      </div>
    </div>
  </div>
</template>