<script setup>
import { computed } from 'vue'
import { usarStoreEscuderia } from '@/stores/storeEquipo'
import Dialog from 'primevue/dialog'
import { ref } from 'vue'

const storeEscuderia = usarStoreEscuderia()
const mostrarDetalle = ref(false)

const jornada = computed(() => storeEscuderia.ultimaJornada)

const tieneSinergia = computed(() => {
  if (!jornada.value) return false
  return jornada.value.multiplicadorSinergia > 1.0
})

const porcentajeSinergia = computed(() => {
  if (!jornada.value) return 0
  return Math.round((jornada.value.multiplicadorSinergia - 1) * 100)
})

const puntosPilotosTotal = computed(() => {
  if (!jornada.value?.desglose?.pilotos) return 0
  return jornada.value.desglose.pilotos.reduce((acc, p) => acc + p.puntosJornada, 0)
})

const puntosCoche = computed(() => {
  return jornada.value?.desglose?.coche?.puntos || 0
})

const puntosBaseSinSinergia = computed(() => {
  return puntosPilotosTotal.value + puntosCoche.value
})

const condicionesTexto = computed(() => {
  if (!jornada.value?.condiciones) return []
  const c = jornada.value.condiciones
  const etiquetas = []
  if (c.llovio) etiquetas.push({ texto: 'Lluvia', icono: 'pi-cloud', color: 'text-blue-400' })
  if (c.numeroSafetyCarActivos > 0) etiquetas.push({ texto: `${c.numeroSafetyCarActivos} Safety Car`, icono: 'pi-exclamation-triangle', color: 'text-amber-400' })
  if (c.numeroVirtualSafetyCarActivos > 0) etiquetas.push({ texto: `${c.numeroVirtualSafetyCarActivos} VSC`, icono: 'pi-exclamation-circle', color: 'text-yellow-400' })
  if (c.numeroDNFs > 0) etiquetas.push({ texto: `${c.numeroDNFs} DNFs`, icono: 'pi-times-circle', color: 'text-red-400' })
  if (etiquetas.length === 0) etiquetas.push({ texto: 'Sin incidentes', icono: 'pi-check-circle', color: 'text-emerald-400' })
  return etiquetas
})

const NOMBRES_VARIANTE = {
  qualy: 'Qualy',
  carrera: 'Carrera',
  todo_terreno: 'Todo Terreno',
  base: 'Base',
}

/**
 * Genera las líneas de explicación del factor de jornada de un piloto.
 * @param {Object} piloto - Objeto del desglose con variante, actuacion, factorJornada.
 * @returns {Array<string>}
 */
function explicarFactor(piloto) {
  if (!piloto.variante || !piloto.factorJornada) return []

  const lineas = []
  const a = piloto.actuacion || {}
  const factor = piloto.factorJornada

  if (piloto.variante === 'qualy') {
    lineas.push(`P${a.posicionQualy} en Qualy → ×${factor}`)
  } else if (piloto.variante === 'carrera') {
    const ganadas = (a.posicionSalida || 20) - (a.posicionCarrera || 20)
    lineas.push(`P${a.posicionCarrera} en Carrera · ${ganadas >= 0 ? '+' : ''}${ganadas} pos → ×${factor}`)
  } else if (piloto.variante === 'todo_terreno') {
    const c = jornada.value?.condiciones || {}
    const clima = c.llovio ? 'Lluvia ×1.4' : 'Seco ×0.9'
    lineas.push(`${clima} + caos → ×${factor}`)
  } else if (piloto.variante === 'base') {
    lineas.push(`Promedio Q/C/TT → ×${factor}`)
  }

  if (piloto.puntuacionBase) {
    lineas.push(`Base: ${piloto.puntuacionBase} pts × ${factor} = ${Math.round(piloto.puntuacionBase * factor)} pts`)
  }

  return lineas
}
</script>

<template>
  <div v-if="jornada" class="flex flex-col bg-transparent border-b border-zinc-800">
    <!-- Resumen compacto -->
    <div class="flex items-center justify-between p-4 cursor-pointer" @click="mostrarDetalle = true">
      <div class="flex flex-col gap-1">
        <span class="text-[10px] font-black uppercase tracking-widest text-[#D4A843]">
          Última jornada
        </span>
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

    <!-- Dialog de desglose detallado -->
    <Dialog v-model:visible="mostrarDetalle" modal header="DESGLOSE DE PUNTOS"
      :headerStyle="{ backgroundColor: '#1A1A1F', color: '#D4A843', borderBottom: '1px solid #2A2A32', fontWeight: 'bold', letterSpacing: '0.1em' }"
      :contentStyle="{ backgroundColor: '#1A1A1F', padding: '1.25rem' }"
      :style="{ width: '92vw', maxWidth: '420px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }">

      <div class="flex flex-col gap-5">

        <!-- Nombre del GP -->
        <div class="flex items-center gap-2 pb-3 border-b border-zinc-800">
          <i class="pi pi-flag-fill text-[#E10600]"></i>
          <span class="text-sm font-black uppercase tracking-wide text-white">{{ jornada.nombreGranPremio }}</span>
        </div>

        <!-- Condiciones de carrera -->
        <div class="flex flex-col gap-2">
          <span class="text-[10px] font-black uppercase tracking-widest text-zinc-500">Condiciones</span>
          <div class="flex flex-wrap gap-2">
            <span v-for="(cond, idx) in condicionesTexto" :key="idx"
              class="flex items-center gap-1.5 px-2.5 py-1 bg-[#121218] border border-zinc-800 text-xs font-bold"
              :class="cond.color">
              <i class="pi text-[10px]" :class="cond.icono"></i>
              {{ cond.texto }}
            </span>
          </div>
        </div>

        <!-- Pilotos -->
        <div v-if="jornada.desglose?.pilotos?.length" class="flex flex-col gap-2">
          <span class="text-[10px] font-black uppercase tracking-widest text-zinc-500">Pilotos</span>
          <div v-for="(piloto, idx) in jornada.desglose.pilotos" :key="idx"
            class="flex flex-col p-3 bg-[#121218] border border-zinc-800 gap-2">
            <div class="flex items-center justify-between">
              <div class="flex flex-col gap-0.5">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-white">{{ piloto.nombre }}</span>
                  <span v-if="piloto.variante"
                    class="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider border border-zinc-700 text-zinc-400">
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
            <!-- Explicación del factor -->
            <div v-if="piloto.factorJornada" class="flex flex-col gap-0.5 pt-1 border-t border-zinc-800/50">
              <span v-for="(linea, i) in explicarFactor(piloto)" :key="i"
                class="text-[10px] text-zinc-400">
                {{ linea }}
              </span>
            </div>
          </div>
        </div>

        <!-- Coche -->
        <div v-if="jornada.desglose?.coche" class="flex flex-col gap-2">
          <span class="text-[10px] font-black uppercase tracking-widest text-zinc-500">Coche</span>
          <div class="flex items-center justify-between p-3 bg-[#121218] border border-zinc-800">
            <div class="flex items-center gap-2">
              <i class="pi pi-car text-zinc-400"></i>
              <span class="text-sm font-bold text-white">{{ jornada.desglose.coche.nombre }}</span>
            </div>
            <span class="text-lg font-black text-[#D4A843]">+{{ jornada.desglose.coche.puntos }}</span>
          </div>
        </div>

        <!-- Sinergias -->
        <div v-if="tieneSinergia" class="flex flex-col gap-2">
          <span class="text-[10px] font-black uppercase tracking-widest text-zinc-500">Bonificaciones</span>
          <div class="flex items-center justify-between p-3 bg-emerald-900/20 border border-emerald-500/30">
            <div class="flex items-center gap-2">
              <i class="pi pi-bolt text-emerald-400"></i>
              <span class="text-sm font-bold text-emerald-400">Sinergia activa</span>
            </div>
            <span class="text-lg font-black text-emerald-400">+{{ porcentajeSinergia }}%</span>
          </div>
        </div>

        <!-- Total -->
        <div class="flex items-center justify-between p-4 bg-[#D4A843]/10 border border-[#D4A843]/30">
          <div class="flex flex-col">
            <span class="text-[10px] font-black uppercase tracking-widest text-[#D4A843]">Total jornada</span>
            <span v-if="tieneSinergia" class="text-[10px] text-zinc-500">
              {{ puntosBaseSinSinergia }} pts × {{ jornada.multiplicadorSinergia }}
            </span>
          </div>
          <span class="text-3xl font-black text-[#D4A843]">+{{ jornada.puntosJornada }}</span>
        </div>

        <!-- Premio económico -->
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

  <!-- Sin jornada procesada -->
  <div v-else class="p-4 bg-transparent border-b border-zinc-800">
    <div class="flex items-center gap-2">
      <i class="pi pi-info-circle text-zinc-600"></i>
      <span class="text-xs text-zinc-500">Aún no hay resultados de jornada disponibles.</span>
    </div>
  </div>
</template>
