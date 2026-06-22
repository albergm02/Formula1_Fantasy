<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { usarStoreJornada } from '@/stores/storeJornada'
import { obtenerCuentaRegresiva } from '@/services/servicioJornada'

const storeJornada = usarStoreJornada()
const { siguienteGranPremio } = storeToRefs(storeJornada)

const cuentaRegresiva = ref('')
const cargaFallida = ref(false)
const imagenRota = ref(false)
let intervaloId = null

const granPremioEnCurso = computed(() => {
  if (!siguienteGranPremio.value?.fechaInicio) return false
  return new Date(siguienteGranPremio.value.fechaInicio) <= new Date()
})

function actualizarCuentaRegresiva() {
  if (!siguienteGranPremio.value?.fechaInicio) {
    cuentaRegresiva.value = ''
    return
  }
  cuentaRegresiva.value = obtenerCuentaRegresiva(siguienteGranPremio.value.fechaInicio)
}

onMounted(async () => {
  try {
    await storeJornada.cargarSiguienteGranPremio()
  } catch {
    cargaFallida.value = true
  }
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
      <img
        v-if="!imagenRota"
        :src="siguienteGranPremio.imagen"
        alt="Circuito"
        class="w-40 h-20 object-contain"
        @error="imagenRota = true"
      />
      <span v-else class="text-2xl text-zinc-500 font-bold">—</span>
      <div class="flex flex-col items-center gap-1 text-center">
        <span class="text-base font-bold text-white">{{ siguienteGranPremio.nombreGranPremio }}</span>
        <span class="text-sm text-zinc-400">{{ siguienteGranPremio.circuito }} - {{ siguienteGranPremio.pais }}</span>
        <span class="text-sm text-zinc-500">{{ siguienteGranPremio.fecha }} - {{ siguienteGranPremio.hora }}</span>
        <span
          v-if="granPremioEnCurso"
          class="mt-2 px-3 py-1 text-xs font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/50 bg-emerald-900/20 mb-4"
        >
          ¡El Gran Premio ha comenzado!
        </span>
        <span v-else class="mt-2 text-sm font-semibold text-white mb-4">Faltan: {{ cuentaRegresiva }}</span>
      </div>
    </div>
    <div v-else class="flex flex-col items-center justify-center py-10 gap-3">
      <p
        v-if="cargaFallida"
        class="px-3 py-1 text-xs font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/50 bg-emerald-900/20 text-center"
      >
        ¡El Gran Premio ha comenzado!
      </p>
      <p class="text-sm font-bold uppercase tracking-widest text-[#D4A843]">Cargando...</p>
    </div>
  </div>
</template>
