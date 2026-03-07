<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { mercadoPilotos, mercadoPotenciadores, mercadoCoches } from '@/data/mercado'

import CartaPiloto from '@/components/CartaPiloto.vue'
import CartaPotenciador from '@/components/CartaPotenciador.vue'

const router = useRouter()

const pilotos = computed(() => {
  const pilotosPorTier = {
    Q1: mercadoPilotos.filter((p) => p.tier === 'Q1'),
    Q2: mercadoPilotos.filter((p) => p.tier === 'Q2'),
    Q3: mercadoPilotos.filter((p) => p.tier === 'Q3'),
  }

  return [
    pilotosPorTier.Q1[Math.floor(Math.random() * pilotosPorTier.Q1.length)],
    pilotosPorTier.Q2[Math.floor(Math.random() * pilotosPorTier.Q2.length)],
    pilotosPorTier.Q3[Math.floor(Math.random() * pilotosPorTier.Q3.length)],
  ]
})

// 1 Solo coche
const coche = computed(() => {
  return mercadoCoches[Math.floor(Math.random() * mercadoCoches.length)]
})

// Aquí puedes cambiar el slice(0, 4) por (0, 2) o (0, 3) y la rejilla aguantará
const potenciadores = computed(() => {
  return mercadoPotenciadores.sort(() => 0.5 - Math.random()).slice(0, 4)
})
</script>

<template>
  <div
    class="h-[100dvh] w-full flex flex-col bg-zinc-950 p-2 pb-16 items-center font-sans overflow-hidden"
  >
    <div class="w-full max-w-3xl h-full flex flex-col gap-2 min-h-0">
      <header class="shrink-0 flex items-center justify-between pb-1 border-b border-zinc-800">
        <button
          @click="router.push('/dashboard')"
          class="w-8 h-8 rounded bg-zinc-800 text-white flex items-center justify-center"
        >
          <i class="pi pi-arrow-left text-xs"></i>
        </button>
        <div class="flex flex-col items-end">
          <h1 class="text-xl md:text-2xl font-black italic text-white tracking-tight leading-none">
            MERCADO
          </h1>
          <span class="text-[9px] text-emerald-400 font-bold">Refresca: 4d 12h</span>
        </div>
      </header>

      <section class="flex flex-col flex-[0.15] min-h-0 bg-zinc-900/40 rounded-lg p-1">
        <h2
          class="text-[10px] md:text-xs font-black italic text-zinc-400 uppercase shrink-0 mb-1 ml-1"
        >
          🏎️ Chasis
        </h2>
        <div class="flex-1 min-h-0">
          <CartaPotenciador :potenciador="coche" :modoMercado="true" class="w-full" />
        </div>
      </section>

      <section class="flex flex-col flex-[0.40] min-h-0 bg-zinc-900/40 rounded-lg p-1">
        <h2
          class="text-[10px] md:text-xs font-black italic text-zinc-400 uppercase shrink-0 mb-1 ml-1"
        >
          👤 Pilotos
        </h2>
        <div class="grid grid-cols-3 gap-1.5 flex-1 min-h-0">
          <CartaPiloto
            v-for="piloto in pilotos"
            :key="piloto.id"
            :piloto="piloto"
            :modoMercado="true"
          />
        </div>
      </section>

      <section class="flex flex-col flex-[0.45] min-h-0 bg-zinc-900/40 rounded-lg p-1">
        <h2
          class="text-[10px] md:text-xs font-black italic text-zinc-400 uppercase shrink-0 mb-1 ml-1"
        >
          ⚙️ Piezas y Mejoras
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-1.5 flex-1 min-h-0">
          <CartaPotenciador
            v-for="potenciador in potenciadores"
            :key="potenciador.id"
            :potenciador="potenciador"
            :modoMercado="true"
          />
        </div>
      </section>
    </div>
  </div>
</template>
