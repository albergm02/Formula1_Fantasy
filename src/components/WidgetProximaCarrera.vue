<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const proximaCarrera = ref(null)
const cargando = ref(true)
const tiempoRestante = ref({ dias: 0, horas: 0, min: 0, seg: 0 })
let temporizador = null

const obtenerSiguienteCarrera = async () => {
    try {
        const añoActual = new Date().getFullYear()
        const respuesta = await fetch(`https://api.openf1.org/v1/sessions?year=${añoActual}&session_type=Race`)
        const carreras = await respuesta.json()

        const ahora = new Date()
        const carrerasFuturas = carreras.filter(c => new Date(c.date_start) > ahora)

        if (carrerasFuturas.length > 0) {
            carrerasFuturas.sort((a, b) => new Date(a.date_start) - new Date(b.date_start))
            proximaCarrera.value = carrerasFuturas[0]
            iniciarReloj(new Date(proximaCarrera.value.date_start))
        }
    } catch (error) {
        console.error("Error API OpenF1:", error)
    } finally {
        cargando.value = false
    }
}

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

onMounted(() => obtenerSiguienteCarrera())
onUnmounted(() => { if (temporizador) clearInterval(temporizador) })
</script>

<template>
    <div class="bg-[#15151E] border border-zinc-800 rounded-lg p-3 sm:p-4 flex flex-col gap-2 shadow-lg">

        <div class="flex justify-between items-center border-b border-zinc-800/80 pb-2">
            <div class="flex items-center gap-2">
                <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Siguiente Sesión
                    Oficial</span>
            </div>
            <span v-if="proximaCarrera" class="text-[10px] font-mono text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded">
                ID: {{ proximaCarrera.session_key }}
            </span>
        </div>

        <div v-if="cargando" class="flex justify-center items-center py-2 text-zinc-500">
            <i class="pi pi-spin pi-spinner text-sm mr-2"></i>
            <span class="text-[10px] tracking-widest font-bold">CARGANDO...</span>
        </div>

        <div v-else-if="proximaCarrera"
            class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mt-1">

            <div class="flex flex-col">
                <span class="text-sm font-black text-white italic uppercase truncate w-full sm:max-w-[250px]">
                    {{ proximaCarrera.meeting_name }}
                </span>
                <span class="text-[11px] text-zinc-500 font-medium tracking-wide">
                    {{ proximaCarrera.location }} — {{ proximaCarrera.country_name }}
                </span>
            </div>

            <div
                class="flex items-center gap-1 font-mono text-sm sm:text-base bg-black/30 px-3 py-1.5 rounded border border-zinc-800/50">
                <div class="flex items-baseline">
                    <span class="text-white font-bold tabular-nums">{{ tiempoRestante.dias }}</span>
                    <span class="text-zinc-600 text-[9px] ml-0.5 mr-1">D</span>
                </div>
                <span class="text-zinc-700 font-black mb-0.5">:</span>
                <div class="flex items-baseline">
                    <span class="text-white font-bold tabular-nums ml-1">{{ tiempoRestante.horas.toString().padStart(2,
                        '0') }}</span>
                    <span class="text-zinc-600 text-[9px] ml-0.5 mr-1">H</span>
                </div>
                <span class="text-zinc-700 font-black mb-0.5">:</span>
                <div class="flex items-baseline">
                    <span class="text-white font-bold tabular-nums ml-1">{{ tiempoRestante.min.toString().padStart(2,
                        '0') }}</span>
                    <span class="text-zinc-600 text-[9px] ml-0.5 mr-1">M</span>
                </div>
                <span class="text-zinc-700 font-black mb-0.5">:</span>
                <div class="flex items-baseline">
                    <span class="text-emerald-500 font-bold tabular-nums ml-1">{{
                        tiempoRestante.seg.toString().padStart(2, '0') }}</span>
                    <span class="text-emerald-700 text-[9px] ml-0.5">S</span>
                </div>
            </div>

        </div>

        <div v-else class="text-center py-2 text-zinc-500 text-xs tracking-widest font-bold">
            NO HAY SESIONES FUTURAS
        </div>

    </div>
</template>