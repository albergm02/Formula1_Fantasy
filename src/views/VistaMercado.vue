<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { mercadoPilotos, mercadoPotenciadores, mercadoCoches } from '@/data/mercado'
import { useFantasyStore } from '@/stores/tiendaFantasy'

import Button from 'primevue/button'

import { signOut } from '@/services/authService'

import CartaPiloto from '@/components/CartaPiloto.vue'
import CartaPotenciador from '@/components/CartaPotenciador.vue'
import CartaCoche from '@/components/CartaCoche.vue'

const router = useRouter()
const fantasyStore = useFantasyStore()

const cerrarSesion = async () => {
  try {
    await signOut()
    router.push('/')
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
  }
}

const pilotos = computed(() => {
  const pilotosPorTier = {
    Q1: mercadoPilotos.filter((p) => p.tier === 'Q1'),
    Q2: mercadoPilotos.filter((p) => p.tier === 'Q2'),
    Q3: mercadoPilotos.filter((p) => p.tier === 'Q3'),
  }

  return [
    pilotosPorTier.Q1[Math.floor(Math.random() * pilotosPorTier.Q1.length)],
    pilotosPorTier.Q1[Math.floor(Math.random() * pilotosPorTier.Q1.length)],
    pilotosPorTier.Q2[Math.floor(Math.random() * pilotosPorTier.Q2.length)],
    pilotosPorTier.Q2[Math.floor(Math.random() * pilotosPorTier.Q2.length)],
    pilotosPorTier.Q3[Math.floor(Math.random() * pilotosPorTier.Q3.length)],
    pilotosPorTier.Q3[Math.floor(Math.random() * pilotosPorTier.Q3.length)],
  ]
})

const coche = computed(() => {
  return mercadoCoches.sort(() => 0.5 - Math.random()).slice(0, 2)
})

const potenciadores = computed(() => {
  return mercadoPotenciadores.sort(() => 0.5 - Math.random()).slice(0, 4)
})
</script>

<template>
  <div class="min-h-screen w-full bg-zinc-950 p-4 md:p-6 font-sans pb-32 relative">
    <div class="mx-auto w-full max-w-5xl flex flex-col gap-8">
      <header
        class="fixed top-0 left-0 w-full bg-zinc-950 border-b border-zinc-800 p-4 md:p-6 z-40 flex items-center justify-between"
      >
        <div class="mx-auto w-full max-w-5xl flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-full bg-[#e10600] flex items-center justify-center text-white font-bold shadow-lg"
            >
              {{ fantasyStore.usuario.name.charAt(0) }}
            </div>

            <div class="flex flex-col justify-center">
              <h2 class="text-xl font-black text-white uppercase italic tracking-wide">
                {{ fantasyStore.usuario.name }}
              </h2>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs text-zinc-400 font-medium">
                  Puntos: <strong class="text-white">{{ fantasyStore.usuario.puntos }}</strong>
                </span>
                <span class="text-xs text-zinc-600">|</span>
                <span class="text-xs text-emerald-400 font-bold">
                  {{ fantasyStore.usuario.presupuesto }}
                </span>
              </div>
            </div>
          </div>

          <button
            @click="cerrarSesion"
            class="w-10 h-10 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-zinc-700 hover:text-white transition"
            title="Cerrar Sesión"
          >
            <i class="pi pi-sign-out text-sm"></i>
          </button>
        </div>
      </header>

      <div class="mt-24 flex items-end justify-between">
        <span class="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">
          El mercado refresca en: 4d 12h
        </span>
      </div>

      <section>
        <div class="mb-4 border-l-4 border-zinc-500 pl-2">
          <h2 class="text-base md:text-lg font-black italic text-zinc-200 uppercase tracking-wide">
            Coches de la semana
          </h2>
        </div>
        <div
          class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5 auto-rows-[300px] md:auto-rows-[360px]"
        >
          <CartaCoche v-for="coche in coche" :key="coche.id" :coche="coche" :modoMercado="true" />
        </div>
      </section>

      <section>
        <div class="mb-4 border-l-4 border-zinc-500 pl-2">
          <h2 class="text-base md:text-lg font-black italic text-zinc-200 uppercase tracking-wide">
            Pilotos Disponibles
          </h2>
        </div>
        <div
          class="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5 auto-rows-[300px] md:auto-rows-[360px]"
        >
          <CartaPiloto
            v-for="piloto in pilotos"
            :key="piloto.id"
            :piloto="piloto"
            :modoMercado="true"
          />
        </div>
      </section>

      <section class="mb-32">
        <div class="mb-4 border-l-4 border-zinc-500 pl-2">
          <h2 class="text-base md:text-lg font-black italic text-zinc-200 uppercase tracking-wide">
            Piezas y Mejoras
          </h2>
        </div>
        <div
          class="grid grid-cols-2 md:grid-cols-4 gap-3 object-fill auto-rows-[250px] md:auto-rows-[300px]"
        >
          <CartaPotenciador
            v-for="potenciador in potenciadores"
            :key="potenciador.id"
            :potenciador="potenciador"
            :modoMercado="true"
          />
        </div>
      </section>
    </div>

    <nav
      class="fixed bottom-0 left-0 w-full bg-zinc-950 border-t border-zinc-800 p-2 md:p-4 flex justify-center z-50"
    >
      <div class="w-full max-w-4xl flex justify-around items-center gap-2">
        <Button
          @click="router.push('/inicio')"
          class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-zinc-800 !transition-colors"
        >
          <i class="pi pi-home" style="font-size: 1.3rem; color: #a1a1aa"></i>
          <span
            class="text-[9px] md:text-[10px] text-zinc-400 mt-1 font-medium tracking-widest whitespace-nowrap"
            >INICIO</span
          >
        </Button>

        <Button
          class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-zinc-800 !transition-colors"
        >
          <i class="pi pi-chart-bar" style="font-size: 1.3rem; color: #a1a1aa"></i>
          <span
            class="text-[9px] md:text-[10px] text-zinc-400 mt-1 font-medium tracking-widest whitespace-nowrap"
            >RANKING</span
          >
        </Button>

        <Button
          class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-zinc-800 !transition-colors"
        >
          <i class="pi pi-warehouse" style="font-size: 1.3rem; color: #a1a1aa"></i>
          <span
            class="text-[9px] md:text-[10px] text-zinc-400 mt-1 font-medium tracking-widest whitespace-nowrap"
            >GARAJE</span
          >
        </Button>

        <Button
          class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-zinc-800 !transition-colors"
        >
          <i class="pi pi-shopping-cart" style="font-size: 1.3rem; color: #e10600"></i>
          <span
            class="text-[9px] md:text-[10px] text-[#e10600] mt-1 font-black tracking-widest whitespace-nowrap"
            >MERCADO</span
          >
        </Button>

        <Button
          class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-zinc-800 !transition-colors"
        >
          <i class="pi pi-bell" style="font-size: 1.3rem; color: #a1a1aa"></i>
          <span
            class="text-[9px] md:text-[10px] text-zinc-400 mt-1 font-medium tracking-widest whitespace-nowrap"
            >AVISOS</span
          >
        </Button>

        <Button
          class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-zinc-800 !transition-colors"
        >
          <i class="pi pi-cog" style="font-size: 1.3rem; color: #a1a1aa"></i>
          <span
            class="text-[9px] md:text-[10px] text-zinc-400 mt-1 font-medium tracking-widest whitespace-nowrap"
            >AJUSTES</span
          >
        </Button>
      </div>
    </nav>
  </div>
</template>

<style>
/* Forzamos el fondo negro en toda la app para evitar bordes blancos al hacer scroll en móviles */
body {
  background-color: #09090b !important;
}
</style>
