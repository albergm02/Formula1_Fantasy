<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { mercadoPilotos, mercadoPotenciadores, mercadoCoches } from '@/data/mercado'
import { useFantasyStore } from '@/estado/partida'

import Button from 'primevue/button'
import { signOut } from '@/services/authService'

import CartaPiloto from '@/components/CartaPiloto.vue'
import CartaPotenciador from '@/components/CartaPotenciador.vue'
import CartaCoche from '@/components/CartaCoche.vue'

const router = useRouter()
const fantasyStore = useFantasyStore()

/**
 * Función para cerrar sesión. 
 * Llama al servicio de autenticación para cerrar la sesión del usuario y luego redirige a la página de inicio de sesión.
 */
const cerrarSesion = async () => {
  try {
    await signOut()
    router.push('/')
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
  }
}

/**
 * Generamos la selección aleatoria de pilotos, coches y potenciadores para mostrar en el mercado.
 * Para los pilotos, agrupamos por tier y luego seleccionamos aleatoriamente de cada grupo
 */
const pilotos = computed(() => {
  const pilotosPorTier = {
    Q1: mercadoPilotos.filter((p) => p.tier === 'Q1'),
    Q2: mercadoPilotos.filter((p) => p.tier === 'Q2'),
    Q3: mercadoPilotos.filter((p) => p.tier === 'Q3'),
  }

  const seleccion = [
    pilotosPorTier.Q1[Math.floor(Math.random() * pilotosPorTier.Q1.length)],
    pilotosPorTier.Q1[Math.floor(Math.random() * pilotosPorTier.Q1.length)],
    pilotosPorTier.Q2[Math.floor(Math.random() * pilotosPorTier.Q2.length)],
    pilotosPorTier.Q2[Math.floor(Math.random() * pilotosPorTier.Q2.length)],
    pilotosPorTier.Q3[Math.floor(Math.random() * pilotosPorTier.Q3.length)],
    pilotosPorTier.Q3[Math.floor(Math.random() * pilotosPorTier.Q3.length)],
  ]

  return seleccion.map(p => ({ ...p, tipo: 'piloto' }))
})

const coches = computed(() => {
  const seleccion = mercadoCoches.sort(() => 0.5 - Math.random()).slice(0, 2)
  return seleccion.map(c => ({ ...c, tipo: 'coche' }))
})

const potenciadores = computed(() => {
  const seleccion = mercadoPotenciadores.sort(() => 0.5 - Math.random()).slice(0, 4)
  return seleccion.map(pot => ({ ...pot, tipo: 'potenciador' }))
})
</script>

<template>
  <div class="min-h-screen w-full p-4 pb-32 relative font-sans">
    <div class="mx-auto w-full max-w-5xl flex flex-col gap-8">

      <header
        class="fixed top-0 left-0 w-full bg-[#15151e] border-b border-[#2e2e38] p-4 z-40 flex items-center justify-between shadow-sm">
        <div class="mx-auto w-full max-w-5xl flex items-center justify-between">

          <div class="flex items-center gap-2">
            <div
              class="w-12 h-12 rounded bg-[#e10600] flex items-center justify-center text-white font-black shadow-lg shadow-red-900/20">
              {{ fantasyStore.usuario.iniciales }}
            </div>

            <div class="flex flex-col justify-center">
              <h2 class="text-xl font-black text-white uppercase">
                {{ fantasyStore.usuario.nombre }}
              </h2>

              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs text-[#8a8a9d] font-medium">
                  Puntos: <strong class="text-[#ffb800]">{{ fantasyStore.usuario.puntos }}</strong>
                </span>
                <span class="text-xs text-[#2e2e38]">|</span>
                <span class="text-xs text-[#10b981] font-bold tracking-wide">
                  {{ fantasyStore.usuario.presupuesto }}M
                </span>
              </div>
            </div>
          </div>

          <Button @click="cerrarSesion"
            class="w-10 h-10 rounded-lg !bg-[#2e2e38] !text-[#8a8a9d] !border-none flex items-center justify-center hover:!bg-[#e10600] hover:!text-white !transition-colors"
            title="Cerrar Sesión">
            <i class="pi pi-sign-out"></i>
          </Button>

        </div>
      </header>

      <div class="mt-20 flex items-end justify-center gap-4">
        <span class="text-xs text-[#10b981] font-bold uppercase tracking-wider mb-1">
          El mercado refresca en: 4d 12h
        </span>
      </div>

      <section>
        <div class="mb-4 border-l-4 border-[#8a8a9d] pl-2">
          <h2 class="text-lg font-black italic text-white uppercase tracking-wide">
            Coches de la semana
          </h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="coche in coches" :key="coche.id" class="aspect-[4/3]">
            <CartaCoche :coche="coche" :modoMercado="true" />
          </div>
        </div>
      </section>

      <section>
        <div class="mb-4 border-l-4 border-[#8a8a9d] pl-2">
          <h2 class="text-lg font-black italic text-white uppercase tracking-wide">
            Pilotos Disponibles
          </h2>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div v-for="piloto in pilotos" :key="piloto.id" class="aspect-[3/4]">
            <CartaPiloto :piloto="piloto" :modoMercado="true" />
          </div>
        </div>
      </section>

      <section class="mb-32">
        <div class="mb-4 border-l-4 border-[#8a8a9d] pl-2">
          <h2 class="text-lg font-black italic text-white uppercase tracking-wide">
            Piezas y Mejoras
          </h2>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="potenciador in potenciadores" :key="potenciador.id" class="aspect-square">
            <CartaPotenciador :potenciador="potenciador" :modoMercado="true" />
          </div>
        </div>
      </section>

    </div>

    <nav
      class="fixed bottom-0 left-0 w-full bg-[#15151e] border-t border-[#2e2e38] p-2 flex justify-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
      <div class="w-full max-w-4xl flex justify-around items-center gap-2">

        <Button @click="router.push('/inicio')"
          class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-[#2e2e38]/50 !transition-colors">
          <i class="pi pi-home" style="font-size: 1.3rem; color: #8a8a9d"></i>
          <span class="text-[9px] text-[#8a8a9d] mt-1 font-medium tracking-widest whitespace-nowrap">INICIO</span>
        </Button>

        <Button
          class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-[#2e2e38]/50 !transition-colors">
          <i class="pi pi-chart-bar" style="font-size: 1.3rem; color: #8a8a9d"></i>
          <span class="text-[9px] text-[#8a8a9d] mt-1 font-medium tracking-widest whitespace-nowrap">RANKING</span>
        </Button>

        <Button @click="router.push('/garaje')"
          class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-[#2e2e38]/50 !transition-colors">
          <i class="pi pi-warehouse" style="font-size: 1.3rem; color: #8a8a9d"></i>
          <span class="text-[9px] text-[#8a8a9d] mt-1 font-medium tracking-widest whitespace-nowrap">GARAJE</span>
        </Button>

        <Button
          class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-[#2e2e38]/50 !transition-colors">
          <i class="pi pi-shopping-cart" style="font-size: 1.3rem; color: #e10600"></i>
          <span class="text-[9px] text-[#e10600] mt-1 font-black tracking-widest whitespace-nowrap">MERCADO</span>
        </Button>

        <Button
          class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-[#2e2e38]/50 !transition-colors">
          <i class="pi pi-bell" style="font-size: 1.3rem; color: #8a8a9d"></i>
          <span class="text-[9px] text-[#8a8a9d] mt-1 font-medium tracking-widest whitespace-nowrap">AVISOS</span>
        </Button>

        <Button
          class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-[#2e2e38]/50 !transition-colors">
          <i class="pi pi-cog" style="font-size: 1.3rem; color: #8a8a9d"></i>
          <span class="text-[9px] text-[#8a8a9d] mt-1 font-medium tracking-widest whitespace-nowrap">AJUSTES</span>
        </Button>

      </div>
    </nav>
  </div>
</template>