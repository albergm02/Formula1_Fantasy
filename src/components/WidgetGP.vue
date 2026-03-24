<script setup>
import { ref, onMounted } from 'vue'
import { getCountdown, getNextGrandPrix } from '@/utils/grandPrix'

const nextGrandPrix = ref(null)
const countdown = ref('')

/**
 * Obtiene los datos del próximo gran premio de la temporada actual.
 * Filtra los eventos futuros, ordena por fecha y devuelve el próximo evento con su información relevante.
 */
async function fetchNextGrandPrix() {
  return getNextGrandPrix()
}

/**
 * Calcula el tiempo restante para el próximo gran premio y actualiza el contador cada segundo.
 * Si el gran premio ya ha comenzado, muestra un mensaje indicando que ha comenzado.
 */
function updateCountdown() {
  if (!nextGrandPrix.value?.startDate) {
    countdown.value = ''
    return
  }

  countdown.value = getCountdown(nextGrandPrix.value.startDate)
}

onMounted(async () => {
  nextGrandPrix.value = await fetchNextGrandPrix()
  updateCountdown()
  setInterval(updateCountdown, 1000)
})
</script>

<template>
  <div class="bg-transparent border-b border-zinc-800 p-4 text-zinc-600">
    <h3 class="text-sm font-bold uppercase tracking-widest mb-2">Próximo Gran Premio</h3>

    <div v-if="nextGrandPrix" class="flex flex-row items-center gap-4">
      <div class="flex flex-col items-start flex-1">
        <span class="text-xs text-white">{{ nextGrandPrix.grandPrixName }}</span>
        <span class="text-xs text-zinc-500">{{ nextGrandPrix.circuit }} - {{ nextGrandPrix.country }}</span>
        <span class="text-xs text-zinc-400">{{ nextGrandPrix.date }} - {{ nextGrandPrix.time }}</span>
        <span class="text-xs text-green-400 mt-2">Faltan: {{ countdown }}</span>
      </div>
      <img :src="nextGrandPrix.image" alt="Circuito" class="w-32 h-24 object-contain" />
    </div>
    <div v-else class="flex flex-col items-center justify-center py-10 gap-3">
      <i class="pi pi-spinner text-4xl text-[#00E5E5] animate-spin"></i>
      <p class="text-[#00E5E5] text-sm font-bold uppercase tracking-widest animate-pulse">
        Cargando próximo gran premio...
      </p>
    </div>
  </div>
</template>
