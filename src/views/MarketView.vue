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
  <div
    class="min-h-screen flex flex-col justify-start bg-zinc-900 p-4 pb-24 items-center font-sans"
  >
    <div class="w-full max-w-5xl">
      <header
        class="flex w-full items-center justify-between mb-2 mt-6 border-b border-zinc-700 pb-6"
      >
        <button
          class="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-800 text-white"
          @click="router.push('/dashboard')"
        >
          <i class="pi pi-arrow-left text-lg"></i>
        </button>
        <h1 class="text-2xl md:text-4xl font-black italic text-white text-right flex-1">
          MERCADO DE FICHAJES
        </h1>
      </header>

      <div class="text-left p-2 mb-4">
        <span class="text text-zinc-200 uppercase font-bold block mb-1">Se refresca en</span>
        <span class="text-lg md:text-xl text-emerald-400 font-black">4d 12h</span>
      </div>

      <section class="space-y-8">
        <div class="bg-zinc-800/40 p-6 md:p-8 rounded-2xl">
          <div class="flex items-center justify-between mb-1">
            <div>
              <h2 class="text-2xl font-black italic text-zinc-400 uppercase">
                Coche de la Semana:
              </h2>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-3 md:gap-4 lg:gap-6 mb-8">
            <p class="text font-bold text-zinc-300 uppercase tracking-wide">
              {{ coche.nombre }}
            </p>
            <CartaPotenciador :potenciador="coche" :modoMercado="true" class="w-full" />
          </div>
        </div>

        <div class="bg-zinc-800/40 p-6 md:p-8 rounded-2xl">
          <div class="flex items-center justify-between mb-8">
            <div>
              <h2 class="text-2xl font-black italic text-zinc-400 uppercase">Pilotos</h2>
            </div>
          </div>

          <div class="space-y-10">
            <div v-for="piloto in pilotos" :key="piloto.id">
              <p class="text font-bold text-zinc-300 uppercase tracking-wide mb-4">
                {{ piloto.nombre }} - {{ piloto.equipo }}
              </p>
              <CartaPiloto :piloto="piloto" :modoMercado="true" />
            </div>
          </div>
        </div>

        <div class="bg-zinc-800/40 p-6 md:p-8 rounded-2xl">
          <div class="flex items-center justify-between mb-8">
            <div>
              <h2 class="text-2xl font-black italic text-zinc-400 uppercase">Piezas y Mejoras</h2>
            </div>
          </div>

          <div class="grid gap-10 md:gap-4 lg:gap-6">
            <div v-for="potenciador in potenciadores" :key="potenciador.id">
              <p class="text font-bold text-zinc-300 uppercase tracking-wide mb-4">
                {{ potenciador.nombre }}
              </p>
              <CartaPotenciador :potenciador="potenciador" :modoMercado="true" />
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
