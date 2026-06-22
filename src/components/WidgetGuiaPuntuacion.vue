<script setup>
import { ref } from 'vue'

import { VARIANTES } from '@/utils/variantesPiloto'
import { perfilesPuntuacion } from '@/utils/perfilesPuntuacion'

const EJEMPLOS_VARIANTE = {
  qualy: {
    escenario: 'Piloto con base 72 que clasifica P2.',
    calculo: 'Factor P2 (P1–P3) = ×1.50 -> 72 × 1.50 = 108 pts.',
  },
  carrera: {
    escenario: 'Piloto con base 68 que termina P3.',
    calculo: 'Factor P3 = ×1.30 -> 68 × 1.30 = 88,4 pts.',
  },
  todo_terreno: {
    escenario: 'GP sin lluvia, 2 Coches de Seguridad y 3 abandonos. Base del piloto 65.',
    calculo:
      'Factor = 0.50 + 2 × 0.05 + 3 × 0.10 = 0.50 + 0.10 + 0.30 = 0.90 -> 65 × 0.90 = 58,5 pts. Si ese piloto no sale (N/S), abandona (ABN) o es descalificado (DESC), su factor sería 0.50 -> 65 × 0.50 = 33 pts.',
  },
  remontador: {
    escenario: 'Piloto con base 60 que realiza 8 adelantamientos y recibe 3 (diferencial +5).',
    calculo:
      'Factor = 1.0 + 5 × 0.1 = 1.50 -> 60 × 1.50 = 90 pts. Si no sale (N/S), abandona (ABN) o es descalificado (DESC), el factor cae a 0.50 -> 60 × 0.50 = 30 pts.',
  },
  estratega: {
    escenario: 'Piloto con base 70, 1 parada, mejor stint del 50%, termina P5.',
    calculo:
      'Factor = 0.70 + 0.30 + 0.15 + 0.05 = 1.20 -> 70 × 1.20 = 84 pts. Si no sale (N/S), abandona (ABN) o es descalificado (DESC), el factor cae a 0.50 -> 70 × 0.50 = 35 pts.',
  },
  base: {
    escenario: 'Piloto con base 66, sin importar cómo le vaya en la carrera.',
    calculo: 'Factor fijo = ×1.00 -> 66 × 1.00 = 66 pts. La carta base nunca amplifica ni penaliza la puntuación.',
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

    <div v-if="guiaAbierta" class="px-4 pb-4 pt-2 border-t border-zinc-800 flex flex-col gap-2">
      <p class="text-[11px] text-zinc-400">
        Cada carta tiene una <span class="text-white font-bold">puntuación base</span>
        (suma ponderada de los atributos del piloto que depende de su clase) y un
        <span class="text-white font-bold">factor de peso de jornada,</span> que depende de cómo le fue al piloto en este Gran Premio. Los
        puntos finales son <span class="text-white font-bold">puntuación base × factor de peso de jornada</span>.
      </p>

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
