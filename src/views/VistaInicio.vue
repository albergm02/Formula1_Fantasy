<script setup>
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import { signOut } from '@/services/authService'

const router = useRouter()

const usuario = {
  name: 'Alberto',
  iniciales: 'AF',
  puntos: '1200',
  presupuesto: '50M',
}

const cerrarSesion = async () => {
  try {
    await signOut()
    router.push('/')
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
  }
}
</script>

<template>
  <div class="min-h-screen w-full bg-zinc-950 p-4 md:p-6 font-sans pb-32 relative">
    <div class="mx-auto w-full max-w-5xl flex flex-col gap-10">
      <header
        class="fixed top-0 left-0 w-full bg-zinc-950 border-b border-zinc-800 p-4 md:p-6 z-40 flex items-center justify-between"
      >
        <div class="mx-auto w-full max-w-5xl flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-full bg-[#e10600] flex items-center justify-center text-white font-bold shadow-lg"
            >
              {{ usuario.iniciales }}
            </div>

            <div class="flex flex-col justify-center">
              <h2 class="text-xl font-black text-white uppercase italic tracking-wide">
                {{ usuario.name }}
              </h2>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs text-zinc-400 font-medium">
                  Puntos: <strong class="text-white">{{ usuario.puntos }}</strong>
                </span>
                <span class="text-xs text-zinc-600">|</span>
                <span class="text-xs text-emerald-400 font-bold">
                  {{ usuario.presupuesto }}
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

      <main class="mt-24 flex-1 w-full text-center py-20 text-zinc-500">
        <i class="pi pi-flag text-4xl mb-4 opacity-50"></i>
        <p class="font-bold tracking-widest uppercase">Bienvenido al Paddock</p>
      </main>
    </div>

    <nav
      class="fixed bottom-0 left-0 w-full bg-zinc-950 border-t border-zinc-800 p-2 md:p-4 flex justify-center z-50"
    >
      <div class="w-full max-w-4xl flex justify-around items-center gap-2">
        <Button
          @click="router.push('/inicio')"
          class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-zinc-800 !transition-colors"
        >
          <i class="pi pi-home" style="font-size: 1.3rem; color: #e10600"></i>
          <span
            class="text-[9px] md:text-[10px] text-[#e10600] mt-1 font-black tracking-widest whitespace-nowrap"
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
          <i
            class="pi pi-shopping-cart"
            style="font-size: 1.3rem; color: #a1a1aa"
            @click="router.push('/mercado')"
          ></i>
          <span
            class="text-[9px] md:text-[10px] text-zinc-400 mt-1 font-medium tracking-widest whitespace-nowrap"
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
body {
  background-color: #09090b !important;
}
</style>
