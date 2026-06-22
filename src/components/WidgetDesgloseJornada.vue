<script setup>
import { computed } from 'vue'
import { usarStoreGaraje } from '@/stores/storeGaraje'
import Dialog from 'primevue/dialog'
import { ref } from 'vue'

const storeGaraje = usarStoreGaraje()
const mostrarDetalle = ref(false)
const jornada = computed(() => storeGaraje.ultimaJornada)

const puntosPilotosTotal = computed(() => {
  if (!jornada.value?.desglose?.pilotos) return 0
  return jornada.value.desglose.pilotos.reduce((acc, p) => acc + p.puntosJornada, 0)
})

const puntosCoche = computed(() => {
  return jornada.value?.desglose?.coche?.puntos || 0
})

const condicionesTexto = computed(() => {
  if (!jornada.value?.condiciones) return []
  const c = jornada.value.condiciones
  const etiquetas = []
  if (c.llovio) etiquetas.push({ texto: 'Lluvia', icono: 'pi-cloud', color: 'text-blue-400' })
  if (c.numeroSafetyCarActivos > 0)
    etiquetas.push({ texto: `${c.numeroSafetyCarActivos} Safety Car`, icono: 'pi-exclamation-triangle', color: 'text-[#D4A843]' })
  if (c.numeroVirtualSafetyCarActivos > 0)
    etiquetas.push({ texto: `${c.numeroVirtualSafetyCarActivos} VSC`, icono: 'pi-exclamation-circle', color: 'text-[#D4A843]' })
  if (c.numeroDNFs > 0) etiquetas.push({ texto: `${c.numeroDNFs} ABN`, icono: 'pi-times-circle', color: 'text-[#E10600]' })
  if (etiquetas.length === 0) etiquetas.push({ texto: 'Sin incidentes', icono: 'pi-check-circle', color: 'text-emerald-400' })
  return etiquetas
})

const NOMBRES_VARIANTE = {
  qualy: 'Qualy',
  carrera: 'Carrera',
  todo_terreno: 'Todoterreno',
  base: 'Base',
  remontador: 'Remontador',
  estratega: 'Estratega',
}

function explicarFactor(piloto) {
  if (!piloto.variante || !piloto.factorJornada) return []

  const lineas = []
  const actuacion = piloto.actuacion || {}
  const factor = piloto.factorJornada

  if (piloto.variante === 'qualy') {
    lineas.push(`Clasificó posición ${actuacion.posicionQualy}, factor aplicado: ${factor}`)
  } else if (piloto.variante === 'carrera') {
    const posicionesGanadas = (actuacion.posicionSalida || 20) - (actuacion.posicionCarrera || 20)
    const signo = posicionesGanadas >= 0 ? '+' : ''
    lineas.push(`Terminó P${actuacion.posicionCarrera}, ${signo}${posicionesGanadas} posiciones desde salida, factor: ${factor}`)
  } else if (piloto.variante === 'todo_terreno') {
    const condiciones = jornada.value?.condiciones || {}
    const clima = condiciones.llovio ? 'Con lluvia' : 'En seco'
    lineas.push(`${clima}, factor aplicado: ${factor}`)
  } else if (piloto.variante === 'base') {
    lineas.push(`Media de las tres variantes, factor: ${factor}`)
  } else if (piloto.variante === 'remontador') {
    const adelantamientos = actuacion.numeroAdelantos || 0
    const adelantado = actuacion.numeroVecesAdelantado || 0
    const diferencial = adelantamientos - adelantado
    const signo = diferencial >= 0 ? '+' : ''
    lineas.push(`${adelantamientos} adelantamientos, ${adelantado} recibidos (neto ${signo}${diferencial}), factor: ${factor}`)
  } else if (piloto.variante === 'estratega') {
    const paradas = actuacion.numeroPitStops ?? 'N/A'
    const stint = Math.round((actuacion.porcentajeStintMaximo || 0) * 100)
    lineas.push(`P${actuacion.posicionCarrera}, ${paradas} paradas, stint máximo ${stint}%, factor: ${factor}`)
  }

  if (piloto.puntuacionBase) {
    const puntosFinales = Math.round(piloto.puntuacionBase * factor)
    lineas.push(`${piloto.puntuacionBase} pts base x ${factor} = ${puntosFinales} pts`)
  }

  return lineas
}
</script>

<template>
  <div v-if="jornada" class="flex flex-col bg-transparent border-b border-zinc-800">
    <div class="flex items-center justify-between p-4" @click="mostrarDetalle = true">
      <div class="flex flex-col gap-1">
        <span class="text-[10px] font-black uppercase tracking-widest text-[#D4A843]"> Última jornada </span>
        <span class="text-sm font-bold text-white">{{ jornada.nombreGranPremio }}</span>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex flex-col items-end">
          <span class="text-2xl font-black text-[#D4A843]">+{{ jornada.puntosJornada }}</span>
          <span class="text-[10px] font-bold uppercase tracking-widest text-zinc-500">PTS</span>
        </div>
        <div v-if="jornada.premioJornada" class="flex flex-col items-end">
          <span class="text-2xl font-black text-emerald-400">+{{ jornada.premioJornada }}M</span>
          <span class="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Premio</span>
        </div>
        <i class="pi pi-chevron-right text-zinc-500 text-xs"></i>
      </div>
    </div>

    <Dialog
      v-model:visible="mostrarDetalle"
      modal
      header="DESGLOSE DE PUNTOS"
      :style="{ width: '92vw', maxWidth: '420px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }"
    >
      <div class="flex flex-col gap-5">
        <div class="pb-3 border-b border-zinc-800">
          <span class="text-sm font-black uppercase tracking-wide text-white">{{ jornada.nombreGranPremio }}</span>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-[10px] font-black uppercase tracking-widest text-zinc-500">Condiciones</span>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(cond, idx) in condicionesTexto"
              :key="idx"
              class="px-2.5 py-1 bg-[#121218] border border-zinc-800 text-xs font-bold"
              :class="cond.color"
            >
              {{ cond.texto }}
            </span>
          </div>
        </div>

        <div v-if="jornada.desglose?.pilotos?.length" class="flex flex-col gap-2">
          <span class="text-[10px] font-black uppercase tracking-widest text-zinc-500">Pilotos</span>
          <div
            v-for="(piloto, idx) in jornada.desglose.pilotos"
            :key="idx"
            class="flex flex-col p-3 bg-[#121218] border border-zinc-800 gap-2"
          >
            <div class="flex items-center justify-between">
              <div class="flex flex-col gap-0.5">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-white">{{ piloto.nombre }}</span>
                  <span
                    v-if="piloto.variante"
                    class="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider border border-zinc-700 text-zinc-400"
                  >
                    {{ NOMBRES_VARIANTE[piloto.variante] || piloto.variante }}
                  </span>
                </div>
                <div class="flex gap-2 text-[10px] text-zinc-500">
                  <span>RIT: {{ piloto.atributosModificados?.ritmo || '—' }}</span>
                  <span>CON: {{ piloto.atributosModificados?.consistencia || '—' }}</span>
                  <span>ADP: {{ piloto.atributosModificados?.adaptabilidad || '—' }}</span>
                </div>
              </div>
              <span class="text-lg font-black text-[#D4A843]">+{{ piloto.puntosJornada }}</span>
            </div>
            <div v-if="piloto.factorJornada" class="flex flex-col gap-0.5 pt-1 border-t border-zinc-800/50">
              <span v-for="(linea, i) in explicarFactor(piloto)" :key="i" class="text-[10px] text-zinc-400">
                {{ linea }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="jornada.desglose?.coche" class="flex flex-col gap-2">
          <span class="text-[10px] font-black uppercase tracking-widest text-zinc-500">Coche</span>
          <div class="flex items-center justify-between p-3 bg-[#121218] border border-zinc-800">
            <span class="text-sm font-bold text-white">{{ jornada.desglose.coche.nombre }}</span>
            <span class="text-lg font-black text-[#D4A843]">+{{ jornada.desglose.coche.puntos }}</span>
          </div>
        </div>

        <div class="flex items-center justify-between p-4 bg-[#D4A843]/10 border border-[#D4A843]/30">
          <span class="text-[10px] font-black uppercase tracking-widest text-[#D4A843]">Total jornada</span>
          <span class="text-3xl font-black text-[#D4A843]">+{{ jornada.puntosJornada }}</span>
        </div>

        <div v-if="jornada.premioJornada" class="flex items-center justify-between p-4 bg-emerald-900/20 border border-emerald-500/30">
          <div class="flex flex-col">
            <span class="text-[10px] font-black uppercase tracking-widest text-emerald-400">Premio al presupuesto</span>
            <span class="text-[10px] text-zinc-500">{{ jornada.puntosJornada }} pts ÷ 10</span>
          </div>
          <span class="text-3xl font-black text-emerald-400">+{{ jornada.premioJornada }}M</span>
        </div>
      </div>
    </Dialog>
  </div>

  <div v-else class="p-4 bg-transparent border-b border-zinc-800">
    <span class="text-xs text-zinc-500">Aún no hay resultados de jornada disponibles.</span>
  </div>
</template>
