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

const coche = computed(() => {
  return mercadoCoches[Math.floor(Math.random() * mercadoCoches.length)]
})

const potenciadores = computed(() => {
  return mercadoPotenciadores.sort(() => 0.5 - Math.random()).slice(0, 4)
})
</script>

<template>
  <div class="h-[100dvh] w-full overflow-hidden bg-zinc-950 p-2 md:p-3 font-sans flex flex-col">
    <header class="shrink-0 flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
      <button
        @click="router.push('/dashboard')"
        class="w-8 h-8 rounded bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 transition"
      >
        <i class="pi pi-arrow-left text-xs"></i>
      </button>

      <div class="flex flex-col items-end">
        <h1 class="text-xl md:text-2xl font-black italic text-white tracking-tight leading-none">
          MERCADO
        </h1>
        <span class="text-[10px] text-emerald-400 font-bold uppercase tracking-wider"
          >Refresca: 4d 12h</span
        >
      </div>
    </header>

    <main class="flex-1 flex flex-col gap-3 min-h-0 w-full max-w-4xl mx-auto">
      <section class="flex flex-col flex-[0.20] min-h-0">
        <h2
          class="text-[10px] md:text-xs font-black italic text-zinc-400 uppercase mb-1 ml-1 shrink-0"
        >
          🏎️ Chasis
        </h2>
        <div class="flex-1 min-h-0">
          <CartaPotenciador :potenciador="coche" :modoMercado="true" class="h-full w-full" />
        </div>
      </section>

      <section class="flex flex-col flex-[0.40] min-h-0">
        <h2
          class="text-[10px] md:text-xs font-black italic text-zinc-400 uppercase mb-1 ml-1 shrink-0"
        >
          👤 Pilotos
        </h2>
        <div class="grid grid-cols-3 gap-2 flex-1 min-h-0">
          <CartaPiloto
            v-for="piloto in pilotos"
            :key="piloto.id"
            :piloto="piloto"
            :modoMercado="true"
            class="h-full"
          />
        </div>
      </section>

      <section class="flex flex-col flex-[0.40] min-h-0">
        <h2
          class="text-[10px] md:text-xs font-black italic text-zinc-400 uppercase mb-1 ml-1 shrink-0"
        >
          ⚙️ Piezas y Mejoras
        </h2>
        <div class="grid grid-cols-2 gap-2 flex-1 min-h-0">
          <CartaPotenciador
            v-for="potenciador in potenciadores"
            :key="potenciador.id"
            :potenciador="potenciador"
            :modoMercado="true"
            class="h-full w-full"
          />
        </div>
      </section>
    </main>
  </div>
</template>
