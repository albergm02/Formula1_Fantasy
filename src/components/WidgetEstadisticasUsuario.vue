<script setup>
import { computed } from 'vue'
import { usarStoreEscuderia } from '@/stores/storeEquipo'
import { usarStoreLigas } from '@/stores/storeLigas'

const storeEscuderia = usarStoreEscuderia()
const storeLigas = usarStoreLigas()
/**
 * Calcula el nombre de la liga activa.
 */
const nombreLigaActiva = computed(() => {
  const ligaActiva = storeLigas.detallesLigas.find(
    (liga) => liga.id === storeLigas.idLigaActiva,
  )
  return ligaActiva ? ligaActiva.nombre : 'Mi Campeonato'
})
</script>

<template>
  <!-- Bienvenida -->
  <div class="flex items-center justify-between p-5 bg-transparent border-b border-zinc-800">
    <div class="flex flex-col">
      <span class="mb-1 text-[#D4A843] text-[10px] font-black uppercase">Bienvenido al Paddock</span>
      <h1 class="w-32 text-xl font-black text-white italic uppercase">
        {{ nombreLigaActiva }}
      </h1>
    </div>
    <!-- Estadísticas del usuario -->
    <div class="flex flex-col items-end gap-1 pl-4">
      <div class="flex items-center gap-2">
        <span class="text-[#F0ECEC] text-xs font-medium uppercase">Puntos:</span>
        <span class="px-2 bg-[#D4A843] text-white font-black text-lg">{{ storeEscuderia.puntos || 0 }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-[#F0ECEC] text-xs font-medium uppercase">Presupuesto:</span>
        <span class="text-[#E10600] font-black text-lg">${{ (storeEscuderia.presupuesto || 50).toFixed(2) }}M</span>
      </div>
    </div>
  </div>
</template>
