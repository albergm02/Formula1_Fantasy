<script setup>
import { ref, onMounted } from 'vue'

const proximaCarrera = ref(null)
const countdown = ref('')

async function fetchGranPremio() {
  const response = await fetch('https://api.openf1.org/v1/meetings?year=2026')
  const meetings = await response.json()
  const hoy = new Date()

  /* Filtro las carreras siguientes y me quedo con la más próxima */
  const proximas = meetings.filter((m) => new Date(m.date_end) > hoy)
  const proxima = proximas.sort((a, b) => new Date(a.date_start) - new Date(b.date_start))[0]

  return {
    circuito: proxima.circuit_short_name,
    nombre_gran_premio: proxima.meeting_name,
    pais: proxima.country_name,
    fecha: new Date(proxima.date_start).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    hora: new Date(proxima.date_start).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    imagen: proxima.circuit_image,
    date_start: proxima.date_start,
  }
}

function actualizarContador() {
  const now = new Date()
  const carreraDate = new Date(proximaCarrera.value.date_start)
  const tiempoRes = carreraDate - now

  if (tiempoRes <= 0) {
    countdown.value = '¡El gran premio ha comenzado!'
    return
  }

  const days = Math.floor(tiempoRes / (1000 * 60 * 60 * 24))
  const hours = Math.floor((tiempoRes / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((tiempoRes / (1000 * 60)) % 60)
  const seconds = Math.floor((tiempoRes / 1000) % 60)
  countdown.value = `${days}d ${hours}h ${minutes}m ${seconds}s`
}

onMounted(async () => {
  proximaCarrera.value = await fetchGranPremio()
  actualizarContador()
  setInterval(actualizarContador, 1000)
})
</script>

<template>
  <div class="bg-[#15151E] border border-zinc-800 rounded p-4 text-zinc-600">
    <h3 class="text-sm font-bold uppercase tracking-widest mb-2">Próximo Gran Premio</h3>

    <div v-if="proximaCarrera" class="flex flex-row items-center gap-4">
      <div class="flex flex-col items-start flex-1">
        <span class="text-xs text-white">{{ proximaCarrera.nombre_gran_premio }}</span>
        <span class="text-xs text-zinc-500"
          >{{ proximaCarrera.circuito }} - {{ proximaCarrera.pais }}</span
        >
        <span class="text-xs text-zinc-400"
          >{{ proximaCarrera.fecha }} - {{ proximaCarrera.hora }}</span
        >
        <span class="text-xs text-green-400 mt-2">Faltan: {{ countdown }}</span>
      </div>
      <img :src="proximaCarrera.imagen" alt="Circuito" class="w-32 h-24 object-contain rounded" />
    </div>
    <div v-else class="flex flex-col items-center justify-center py-10 gap-3">
      <i class="pi pi-spinner text-4xl text-[#00E5E5] animate-spin"></i>
      <p class="text-[#00E5E5] text-sm font-bold uppercase tracking-widest animate-pulse">
        Cargando clasificación...
      </p>
    </div>
  </div>
</template>
