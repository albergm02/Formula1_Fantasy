<script setup>
import { computed, ref } from 'vue'
import { pilotsMarket } from '@/data/market.js'
import PilotCard from '@/components/PilotCard.vue'

const weekPilots = computed(() => pilotsMarket.slice(0, 3))
</script>

<template>
  <div class="min-h-screen bg-zinc-900 p-4 pb-24 font-sans flex flex-col items-center">
    <div class="w-full max-w-md">
      <header class="mb-6 mt-4 border-b border-zinc-700 pb-4 text-center">
        <h1 class="text-2xl font-black italic text-white">MERCADO DE PILOTOS SEMANAL</h1>
        <p class="text-sm text-zinc-400 font-medium tracking-wide">
          Explora y adquiere pilotos para tu equipo
        </p>
      </header>
      <div class="grid grid-cols-3 gap-2">
        <PilotCard v-for="pilot in weekPilots" :key="pilot.id" :pilot="pilot" :marketMode="true" />
      </div>
      <p class="text-sm text-zinc-400 font-medium tracking-wide mt-4">
        * Los pilotos disponibles en el mercado se actualizan semanalmente. ¡No pierdas la
        oportunidad de fichar a tus favoritos!
      </p>
    </div>
  </div>
</template>
