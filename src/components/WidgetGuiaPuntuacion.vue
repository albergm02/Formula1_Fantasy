<script setup>
import { ref } from 'vue'

import { VARIANTES } from '@/utils/variantesPiloto'
import { perfilesPuntuacion } from '@/utils/perfilesPuntuacion'

const EJEMPLOS_VARIANTE = {
  qualy: {
    escenario: 'Piloto que clasifica en pole position.',
    calculo: 'P1 → 25 pts. P10 → 11 pts. P20 o peor → 1 pt. Siempre puntúa.',
  },
  carrera: {
    escenario: 'Piloto que gana la carrera.',
    calculo: 'P1 → 25 pts. P3 → 18 pts. P20 o peor → 1 pt. Si abandona (ABN / DESC / N/S) → 0 pts.',
  },
  todo_terreno: {
    escenario: 'P1 en carrera con lluvia, 2 Coches de Seguridad y 3 abandonos.',
    calculo:
      'Factor = 0.75 + 0.10 (lluvia) + 0.10 (2 SC × 0.05) + 0.15 (3 DNF × 0.05) = 1.10 → 25 × 1.10 = 27.5 pts. En seco y limpio: 25 × 0.75 = 18.75 pts.',
  },
  base: {
    escenario: 'Piloto con pole (P1 qualy) y victoria (P1 carrera).',
    calculo: '(25 + 25) / 2 = 25 pts. Si gana la qualy pero abandona en carrera: (25 + 0) / 2 = 12.5 pts.',
  },
  remontador: {
    escenario: 'Piloto que adelanta a 4 rivales y solo recibe 1 adelantamiento.',
    calculo:
      'Diferencial = 4 − 1 = 3 → 16 pts. Con diferencial 6 o más se alcanza el tope de 25 pts. Incluso con diferencial negativo hay puntos de consolación (−1: 5 pts, bajando hasta un suelo de 1 pt).',
  },
  estratega: {
    escenario: 'El piloto con el stint más largo de la carrera queda 1.º en el ranking.',
    calculo:
      'Se ordenan todos los pilotos por su stint más largo (descendente). Empates se desempatan por posición de carrera. La posición resultante usa la escala base: P1 = 25, P2 = 20, P3 = 18… igual que Qualy y Carrera.',
  },
}

const ESCALA_BASE =
  'P1: 25 / P2: 20 / P3: 18 / P4: 17 / P5: 16 / P6: 15 / P7: 14 / P8: 13 / P9: 12 / P10: 11 / P11: 10 / P12: 9 / P13: 8 / P14: 7 / P15: 6 / P16: 5 / P17: 4 / P18: 3 / P19: 2 / P20: 1 - a partir de P20 se mantiene 1 punto.'

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
    <button
      type="button"
      @click="alternarGuia"
      class="w-full flex items-center gap-3 p-3 bg-transparent border-none text-left transition-colors"
    >
      <div class="flex-1 flex flex-col">
        <span class="text-[10px] font-black uppercase tracking-widest text-zinc-500"> Guía rápida </span>
        <span class="text-sm font-bold text-white"> ¿Cómo puntúan mis pilotos? </span>
      </div>
      <i class="pi text-zinc-500 text-xs" :class="guiaAbierta ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
    </button>

    <div v-if="guiaAbierta" class="px-4 pb-4 pt-2 border-t border-zinc-800 flex flex-col gap-3">
      <p class="text-[11px] text-zinc-400">
        Los puntos salen del rendimiento real del piloto en cada Gran Premio (datos de OpenF1). Los potenciadores actúan después como
        multiplicador global de la jornada.
      </p>

      <div class="bg-[#121218] border border-zinc-800 p-2.5 flex flex-col gap-1">
        <span class="text-[9px] font-black uppercase tracking-widest text-zinc-500"> Escala base de puntos </span>
        <span class="text-[11px] text-zinc-300">{{ ESCALA_BASE }}</span>
      </div>

      <div v-for="variante in VARIANTES" :key="variante.id" class="bg-[#121218] border border-zinc-800 overflow-hidden">
        <button
          type="button"
          @click="alternarVariante(variante.id)"
          class="w-full flex items-center gap-3 p-2.5 border-none text-left transition-colors"
        >
          <i class="pi text-base" :class="variante.icono" :style="{ color: variante.color }"></i>
          <span :style="{ color: variante.color }" class="flex-1 text-xs font-bold text-white">{{ variante.etiqueta }}</span>
          <i class="pi text-zinc-500 text-[10px]" :class="varianteExpandida === variante.id ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
        </button>

        <div v-if="varianteExpandida === variante.id" class="px-3 pb-3 pt-1 border-t border-zinc-800 flex flex-col gap-2">
          <ul class="flex flex-col gap-0.5 list-none p-0 m-0">
            <li v-for="(regla, idx) in perfilesPuntuacion[variante.id]?.reglasUsuario || []" :key="idx" class="text-[11px] text-zinc-300">
              {{ regla }}
            </li>
          </ul>
          <div v-if="EJEMPLOS_VARIANTE[variante.id]" class="flex flex-col gap-1 p-2 bg-[#1A1A1F]" :style="{ borderColor: variante.color }">
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
