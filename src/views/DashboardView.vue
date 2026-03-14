<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Card from 'primevue/card'
import Header from '@/components/Header.vue'
import Navbar from '@/components/Navbar.vue'

const proximaCarrera = ref(null)
const cargando = ref(true)

const tiempoRestante = ref({ dias: 0, horas: 0, min: 0, seg: 0 })
let temporizador = null

// 2. CONEXIÓN A LA API OPENF1 (CRUCE DE SESSIONS Y MEETINGS)
const obtenerSiguienteCarrera = async () => {
  try {
    const añoActual = new Date().getFullYear()

    // PASO A: Buscamos la próxima sesión de tipo Carrera para tener la fecha exacta
    const resSesiones = await fetch(`https://api.openf1.org/v1/sessions?year=${añoActual}&session_type=Race`)
    const sesiones = await resSesiones.json()

    const ahora = new Date()
    const carrerasFuturas = sesiones.filter(s => new Date(s.date_start) > ahora)

    if (carrerasFuturas.length > 0) {
      // Ordenamos y cogemos la más cercana
      carrerasFuturas.sort((a, b) => new Date(a.date_start) - new Date(b.date_start))
      const siguienteSesion = carrerasFuturas[0]

      // PASO B: Con el 'meeting_key' de la carrera, pedimos los detalles gráficos (circuito, bandera)
      const resMeeting = await fetch(`https://api.openf1.org/v1/meetings?meeting_key=${siguienteSesion.meeting_key}`)
      const meetings = await resMeeting.json()

      // Combinamos la información de ambos endpoints en un solo objeto para el HTML
      if (meetings.length > 0) {
        proximaCarrera.value = {
          ...siguienteSesion,
          ...meetings[0]
        }
      } else {
        proximaCarrera.value = siguienteSesion // Por si acaso falla el meeting, no rompemos la app
      }

      // Arrancamos el reloj con la fecha de la sesión (Domingo)
      iniciarReloj(new Date(siguienteSesion.date_start))
    }
  } catch (error) {
    console.error("Fallo al contactar con OpenF1:", error)
  } finally {
    cargando.value = false
  }
}

// 3. LÓGICA DEL TEMPORIZADOR MATEMÁTICO
const iniciarReloj = (fechaDestino) => {
  temporizador = setInterval(() => {
    const ahora = new Date().getTime()
    const distancia = fechaDestino.getTime() - ahora

    if (distancia > 0) {
      tiempoRestante.value = {
        dias: Math.floor(distancia / (1000 * 60 * 60 * 24)),
        horas: Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        min: Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60)),
        seg: Math.floor((distancia % (1000 * 60)) / 1000)
      }
    } else {
      clearInterval(temporizador)
    }
  }, 1000)
}

// 4. CICLO DE VIDA VUE
onMounted(() => {
  obtenerSiguienteCarrera()
})

onUnmounted(() => {
  if (temporizador) clearInterval(temporizador)
})
</script>

<template>
  <div class="min-h-screen w-full bg-[#0c0c12] pb-28 font-sans">
    <Header />

    <main class="mx-auto w-full max-w-3xl p-4 mt-8">

      <Card class="bg-[#15151E] border border-zinc-800 text-white shadow-2xl pt-4">

        <template #title>
          <div class="text-center border-b border-zinc-800 pb-4">
            <h2 class="text-xl font-black uppercase tracking-widest text-emerald-500">
              Próximo Gran Premio
            </h2>
          </div>
        </template>

        <template #content>
          <div v-if="cargando" class="text-center py-10 text-zinc-500">
            <i class="pi pi-spin pi-spinner text-4xl"></i>
            <p class="mt-4 text-sm font-bold tracking-widest">DESCARGANDO TELEMETRÍA...</p>
          </div>

          <div v-else-if="proximaCarrera" class="flex flex-col items-center gap-6 py-4">

            <div class="text-center flex flex-col items-center">
              <div class="flex items-center gap-3 mb-2">
                <img v-if="proximaCarrera.country_flag" :src="proximaCarrera.country_flag"
                  class="w-8 rounded-sm shadow-md" alt="Bandera">
                <p class="text-3xl font-black italic">{{ proximaCarrera.meeting_name }}</p>
              </div>
              <p class="text-zinc-400 font-bold tracking-widest uppercase">
                {{ proximaCarrera.circuit_short_name || 'Circuito por determinar' }}
              </p>
            </div>

            <div class="w-full h-48 sm:h-64 flex items-center justify-center p-4">
              <img v-if="proximaCarrera.circuit_image" :src="proximaCarrera.circuit_image"
                class="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                alt="Mapa del circuito">
              <span v-else class="text-zinc-600 border border-dashed border-zinc-700 p-8 rounded">
                Sin imagen del trazado
              </span>
            </div>

            <div class="flex gap-4 sm:gap-8 text-center mt-2 border-t border-zinc-800 pt-6 w-full justify-center">
              <div class="flex flex-col items-center w-16">
                <span class="block text-4xl sm:text-5xl font-black">{{ tiempoRestante.dias }}</span>
                <span class="text-xs text-zinc-500 tracking-widest mt-1">DÍAS</span>
              </div>
              <span class="text-4xl sm:text-5xl font-black text-zinc-700">:</span>

              <div class="flex flex-col items-center w-16">
                <span class="block text-4xl sm:text-5xl font-black">{{ tiempoRestante.horas.toString().padStart(2, '0')
                }}</span>
                <span class="text-xs text-zinc-500 tracking-widest mt-1">HRS</span>
              </div>
              <span class="text-4xl sm:text-5xl font-black text-zinc-700">:</span>

              <div class="flex flex-col items-center w-16">
                <span class="block text-4xl sm:text-5xl font-black">{{ tiempoRestante.min.toString().padStart(2, '0')
                }}</span>
                <span class="text-xs text-zinc-500 tracking-widest mt-1">MIN</span>
              </div>
              <span class="text-4xl sm:text-5xl font-black text-zinc-700">:</span>

              <div class="flex flex-col items-center w-16">
                <span class="block text-4xl sm:text-5xl font-black text-emerald-500">{{
                  tiempoRestante.seg.toString().padStart(2, '0') }}</span>
                <span class="text-xs text-emerald-500 tracking-widest mt-1">SEG</span>
              </div>
            </div>

          </div>

          <div v-else class="text-center py-10 text-zinc-500">
            <i class="pi pi-flag-fill text-4xl mb-4 text-zinc-700"></i>
            <p>Temporada finalizada. No hay carreras futuras programadas.</p>
          </div>
        </template>

      </Card>

    </main>

    <Navbar />
  </div>
</template>