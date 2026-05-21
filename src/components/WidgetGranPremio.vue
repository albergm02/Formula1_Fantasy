<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { obtenerCuentaRegresiva, obtenerSiguienteGranPremio } from '@/services/servicioOpenF1'

const siguienteGranPremio = ref(null)
const cuentaRegresiva = ref('')
let intervaloId = null

async function cargarSiguienteGranPremio() {
  return obtenerSiguienteGranPremio()
}

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
  intervaloId = setInterval(actualizarCuentaRegresiva, 1000)
})

onUnmounted(() => {
  if (intervaloId) {
    clearInterval(intervaloId)
    intervaloId = null
  }
})
</script>

<template>
  <div class="p-2 bg-transparent text-zinc-600 border-b border-zinc-800">
    <h3 class="mb-4 text-sm font-bold uppercase tracking-widest text-center">Próximo Gran Premio</h3>

    <div v-if="siguienteGranPremio" class="flex flex-col items-center gap-4">
      <img :src="siguienteGranPremio.imagen" alt="Circuito" class="w-40 h-20 object-contain" />
      <div class="flex flex-col items-center gap-1 text-center">
        <span class="text-base font-bold text-white">{{ siguienteGranPremio.nombreGranPremio }}</span>
        <span class="text-sm text-zinc-400">{{ siguienteGranPremio.circuito }} · {{ siguienteGranPremio.pais }}</span>
        <span class="text-sm text-zinc-500">{{ siguienteGranPremio.fecha }} · {{ siguienteGranPremio.hora }}</span>
        <span class="mt-2 text-sm font-semibold text-green-400">Faltan: {{ cuentaRegresiva }}</span>
      </div>
    </div>
    <div v-else class="flex flex-col items-center justify-center py-10 gap-3">
      <p class="text-[#D4A843] text-sm font-bold uppercase tracking-widest">
        Cargando...
      </p>
    </div>
  </div>
</template>
