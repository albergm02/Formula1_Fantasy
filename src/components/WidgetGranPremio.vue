<script setup>
import { ref, onMounted } from 'vue'
import { obtenerCuentaRegresiva, obtenerSiguienteGranPremio } from '@/utils/granPremio'

const siguienteGranPremio = ref(null)
const cuentaRegresiva = ref('')

/**
 * Obtiene los datos del prÃ³ximo gran premio de la temporada actual.
 * Filtra los eventos futuros, ordena por fecha y devuelve el prÃ³ximo evento con su informaciÃ³n relevante.
 */
async function cargarSiguienteGranPremio() {
  return obtenerSiguienteGranPremio()
}

/**
 * Calcula el tiempo restante para el prÃ³ximo gran premio y actualiza el contador cada segundo.
 * Si el gran premio ya ha comenzado, muestra un mensaje indicando que ha comenzado.
 */
function actualizarCuentaRegresiva() {
  if (!siguienteGranPremio.value?.fechaInicio) {
    cuentaRegresiva.value = ''
    return
  }

  cuentaRegresiva.value = obtenerCuentaRegresiva(siguienteGranPremio.value.fechaInicio)
}

onMounted(async () => {
  siguienteGranPremio.value = await cargarSiguienteGranPremio()
  actualizarCuentaRegresiva()
  setInterval(actualizarCuentaRegresiva, 1000)
})
</script>

<template>
  <div class="p-4 bg-transparent text-zinc-600 border-b border-zinc-800">
    <h3 class="mb-2 text-sm font-bold uppercase tracking-widest">PrÃ³ximo Gran Premio</h3>

    <div v-if="siguienteGranPremio" class="flex flex-row items-center gap-4">
      <div class="flex flex-col items-start flex-1">
        <span class="text-xs text-white">{{ siguienteGranPremio.nombreGranPremio }}</span>
        <span class="text-xs text-zinc-500">{{ siguienteGranPremio.circuito }} - {{ siguienteGranPremio.pais }}</span>
        <span class="text-xs text-zinc-400">{{ siguienteGranPremio.fecha }} - {{ siguienteGranPremio.hora }}</span>
        <span class="mt-2 text-xs text-green-400">Faltan: {{ cuentaRegresiva }}</span>
      </div>
      <img :src="siguienteGranPremio.imagen" alt="Circuito" class="w-32 h-24 object-contain" />
    </div>
    <div v-else class="flex flex-col items-center justify-center py-10 gap-3">
      <i class="text-4xl text-[#D4A843] pi pi-spinner animate-spin"></i>
      <p class="text-[#D4A843] text-sm font-bold uppercase tracking-widest animate-pulse">
        Cargando prÃ³ximo gran premio...
      </p>
    </div>
  </div>
</template>



