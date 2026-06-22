<script setup>
import { ref } from 'vue'

import { VARIANTES } from '@/utils/variantesPiloto'
import { perfilesPuntuacion } from '@/utils/perfilesPuntuacion'

const EJEMPLOS_VARIANTE = {
  qualy: {
    escenario: 'Piloto que clasifica en pole position.',
    calculo: 'P1 → 25 pts directos. Si clasifica P10 → 1 pt. Fuera del top 10 → 0 pts.',
  },
  carrera: {
    escenario: 'Piloto que gana la carrera.',
    calculo: 'P1 → 25 pts. Si termina P3 → 15 pts. Si abandona (ABN / DESC / N/S) → 0 pts.',
  },
  todo_terreno: {
    escenario: 'P1 en una carrera con lluvia y 2 Coches de Seguridad.',
    calculo: 'Factor caos = 0.50 + 0.40 (lluvia) + 0.10 (2 SC) = 1.00 → 25 × 1.00 = 25 pts. En seco sin incidentes el mismo P1 da 25 × 0.50 = 12.5 pts.',
  },
  base: {
    escenario: 'Piloto con pole (P1 qualy) y victoria (P1 carrera).',
    calculo: '(25 + 25) / 2 = 25 pts. Si gana la qualy pero abandona en carrera: (25 + 0) / 2 = 12.5 pts.',
  },
  remontador: {
    escenario: 'Piloto que adelanta a 4 rivales y solo recibe 1 adelantamiento.',
    calculo: 'Diferencial = 4 − 1 = 3 → 12 pts. Con diferencial 5 o más alcanzaría el tope de 25 pts. Si pierde más adelantamientos de los que hace, 0 pts.',
  },
  estratega: {
    escenario: 'P1 con 1 parada en boxes y stint más largo del 55%.',
    calculo: '10 (1 parada) + 6 (stint 0.55 × 10) + 10 (P1) = 26 pts. Con 0 paradas → 0 pts totales.',
  },
}

const guiaAbierta = ref(false)
const varianteExpandida = ref(null)

function alternarGuia() {
  guiaAbierta.value = !guiaAbierta.value
}

function alternarVariante(id) {
  varianteExpandida.value = varianteExpandida.value === id ? null : id
}
</script>

<template>
  <div class="bg-[#1A1A1F] border border-zinc-800 overflow-hidden">
    <button type="button" @click="alternarGuia"
      class="w-full flex items-center gap-3 p-3 bg-transparent border-none text-left transition-colors">
      <div class="flex-1 flex flex-col">
        <span class="text-[10px] font-black uppercase tracking-widest text-zinc-500"> Guía rápida </span>
        <span class="text-sm font-bold text-white"> ¿Cómo puntúan mis pilotos? </span>
      </div>
      <i class="pi text-zinc-500 text-xs" :class="guiaAbierta ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
    </button>

    <div v-if="guiaAbierta" class="px-4 pb-4 pt-2 border-t border-zinc-800 flex flex-col gap-2">
      <p class="text-[11px] text-zinc-400">
        Cada variante calcula sus puntos directamente del rendimiento real
        del piloto en este Gran Premio (datos de OpenF1). La posición de qualy, la posición de
        carrera, las paradas y las posiciones ganadas son las únicas variables. Los potenciadores
        actúan después como multiplicador global de la jornada.
      </p>

      <div v-for="variante in VARIANTES" :key="variante.id" class="bg-[#121218] border border-zinc-800 overflow-hidden">
        <button type="button" @click="alternarVariante(variante.id)"
          class="w-full flex items-center gap-3 p-2.5 border-none text-left transition-colors">
          <i class="pi text-base" :class="variante.icono" :style="{ color: variante.color }"></i>
          <span :style="{ color: variante.color }" class="flex-1 text-xs font-bold text-white">{{ variante.etiqueta
          }}</span>
          <i class="pi text-zinc-500 text-[10px]"
            :class="varianteExpandida === variante.id ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
        </button>

        <div v-if="varianteExpandida === variante.id"
          class="px-3 pb-3 pt-1 border-t border-zinc-800 flex flex-col gap-2">
          <ul class="flex flex-col gap-0.5 list-none p-0 m-0">
            <li v-for="(regla, idx) in perfilesPuntuacion[variante.id]?.reglasUsuario || []" :key="idx"
              class="text-[11px] text-zinc-300">
              {{ regla }}
            </li>
          </ul>
          <div v-if="EJEMPLOS_VARIANTE[variante.id]" class="flex flex-col gap-1 p-2 bg-[#1A1A1F]"
            :style="{ borderColor: variante.color }">
            <span class="text-[9px] font-black uppercase tracking-widest text-zinc-500"> Ejemplo: </span>
            <span class="text-[11px] text-zinc-300">
              {{ EJEMPLOS_VARIANTE[variante.id].escenario }}
            </span>
            <span class="text-[11px] font-bold" :style="{ color: variante.color }">
              {{ EJEMPLOS_VARIANTE[variante.id].calculo }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
