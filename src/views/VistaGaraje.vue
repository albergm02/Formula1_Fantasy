<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFantasyStore } from '@/stores/tiendaFantasy'
import Button from 'primevue/button'
import Message from 'primevue/message'

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

const misCoches = computed(() => fantasyStore.garaje.filter((item) => item.tipo === 'coche'))
const misPilotos = computed(() => fantasyStore.garaje.filter((item) => item.tipo === 'piloto'))
const misPotenciadores = computed(() =>
  fantasyStore.garaje.filter((item) => item.tipo === 'potenciador'),
)
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
              <h2 class="text-lg font-black text-white uppercase italic">
                {{ fantasyStore.usuario.name }}
              </h2>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs text-zinc-400 font-medium">
                  Puntos: <strong class="text-white">{{ fantasyStore.usuario.puntos }}</strong>
                </span>
                <span class="text-xs text-zinc-600">|</span>
                <span class="text-xs text-emerald-400 font-bold">
                  {{ fantasyStore.usuario.presupuesto }}M
                </span>
              </div>
            </div>
          </div>

          <button
            @click="cerrarSesion"
            class="w-10 h-10 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-zinc-700 hover:text-white"
            title="Cerrar Sesión"
          >
            <i class="pi pi-sign-out text-sm"></i>
          </button>
        </div>
      </header>

      <div class="mt-24 flex items-end justify-between">
        <span class="text-xs text-emerald-400 font-bold uppercase mb-1">
          Valor de tu equipo:
          {{ fantasyStore.garaje.reduce((total, item) => total + item.precio, 0).toFixed(1) }}M
        </span>
      </div>

      <section>
        <div class="mb-4 border-l-4 border-zinc-500 pl-2">
          <h2 class="text-lg font-black italic text-zinc-200">MI COCHE</h2>
        </div>

        <div
          v-if="misCoches.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5 auto-rows-[300px] md:auto-rows-[360px]"
        >
          <CartaCoche v-for="coche in misCoches" :key="coche.id" :coche="coche" />
        </div>

        <Message v-else severity="secondary" icon="pi pi-car" :closable="false" class="w-full">
          No tienes chasis. Adquiere uno en el mercado.
        </Message>
      </section>

      <section>
        <div class="mb-4 border-l-4 border-zinc-500 pl-2">
          <h2 class="text-lg font-black italic text-zinc-200 uppercase">Mis Pilotos</h2>
        </div>

        <div
          v-if="misPilotos.length > 0"
          class="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5 auto-rows-[300px] md:auto-rows-[360px]"
        >
          <CartaPiloto v-for="piloto in misPilotos" :key="piloto.id" :piloto="piloto" />
        </div>

        <Message v-else severity="secondary" icon="pi pi-users" :closable="false" class="w-full">
          Tus asientos están vacíos. Ve al mercado a fichar.
        </Message>
      </section>

      <section class="mb-32">
        <div class="mb-4 border-l-4 border-zinc-500 pl-2">
          <h2 class="text-lg font-black italic text-zinc-200 uppercase">Piezas Instaladas</h2>
        </div>

        <div
          v-if="misPotenciadores.length > 0"
          class="grid grid-cols-2 md:grid-cols-4 gap-3 object-fill auto-rows-[250px] md:auto-rows-[300px]"
        >
          <CartaPotenciador
            v-for="potenciador in misPotenciadores"
            :key="potenciador.id"
            :potenciador="potenciador"
          />
        </div>

        <Message v-else severity="secondary" icon="pi pi-wrench" :closable="false" class="w-full">
          No tienes mejoras instaladas en tu monoplaza.
        </Message>
      </section>
    </div>

    <nav
      class="fixed bottom-0 left-0 w-full bg-zinc-950 border-t border-zinc-800 p-2 md:p-4 flex justify-center z-50"
    >
      <div class="w-full max-w-4xl flex justify-around items-center gap-2">
        <Button
          @click="router.push('/inicio')"
          class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-zinc-800"
        >
          <i class="pi pi-home" style="font-size: 1.3rem; color: #a1a1aa"></i>
          <span class="text-xs text-zinc-400 mt-1 font-medium">INICIO</span>
        </Button>

        <Button
          class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-zinc-800"
        >
          <i class="pi pi-chart-bar" style="font-size: 1.3rem; color: #a1a1aa"></i>
          <span class="text-xs text-zinc-400 mt-1 font-medium">RANKING</span>
        </Button>

        <Button
          class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-zinc-800"
        >
          <i class="pi pi-warehouse" style="font-size: 1.3rem; color: #e10600"></i>
          <span class="text-xs text-[#e10600] mt-1 font-black">GARAJE</span>
        </Button>

        <Button
          @click="router.push('/mercado')"
          class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-zinc-800"
        >
          <i class="pi pi-shopping-cart" style="font-size: 1.3rem; color: #a1a1aa"></i>
          <span class="text-xs text-zinc-400 mt-1 font-medium">MERCADO</span>
        </Button>

        <Button
          class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-zinc-800"
        >
          <i class="pi pi-bell" style="font-size: 1.3rem; color: #a1a1aa"></i>
          <span class="text-xs text-zinc-400 mt-1 font-medium">AVISOS</span>
        </Button>

        <Button
          class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-zinc-800"
        >
          <i class="pi pi-cog" style="font-size: 1.3rem; color: #a1a1aa"></i>
          <span class="text-xs text-zinc-400 mt-1 font-medium">AJUSTES</span>
        </Button>
      </div>
    </nav>
  </div>
</template>
