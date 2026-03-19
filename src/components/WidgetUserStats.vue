<template>
  <div class="flex items-center justify-between bg-[#111111] p-5 rounded-2xl border-l-4 border-[#00E5E5] shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
    <div class="flex flex-col">
      <span class="text-[#00E5E5] text-[10px] font-black tracking-widest uppercase mb-1">Paddock Global</span>
      <h1 class="text-xl md:text-2xl font-black text-white italic uppercase truncate w-32 md:w-auto">
        {{ nombreLigaActual }}
      </h1>
    </div>
    
    <div class="flex flex-col items-end gap-1 border-l border-white/10 pl-4">
      <div class="flex items-center gap-2">
        <span class="text-[#D9D9D9] text-xs font-medium uppercase">Puntos:</span>
        <span class="text-white font-black text-lg bg-[#00E5E5]/20 px-2 rounded">{{ escuderiaStore.puntos || 0 }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-[#D9D9D9] text-xs font-medium uppercase">Presupuesto:</span>
        <span class="text-[#FF1E00] font-black text-lg">${{ escuderiaStore.presupuesto || 50 }}M</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useEscuderiaStore } from '@/stores/storeEscuderia'
import { useLigasStore } from '@/stores/storeLigas'

const escuderiaStore = useEscuderiaStore()
const ligasStore = useLigasStore()

const nombreLigaActual = computed(() => {
  const liga = ligasStore.ligasDetalles.find(l => l.id === ligasStore.ligaActiva)
  return liga ? liga.nombre : 'Mi Campeonato'
})
</script>