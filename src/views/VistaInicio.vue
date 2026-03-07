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
  <div class="min-h-screen flex flex-col justify-start bg-zinc-900 p-4 pb-24 items-center font-sans">
    <header class="flex w-full max-w-4xl flex items-center justify-between mb-8 mt-4 border-b border-zinc-700 pb-4">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
          {{ usuario.iniciales }}
        </div>
        <div class="flex flex-col justify-center">
          <h2 class="text-xl font-bold text-white uppercase">{{ usuario.name }}</h2>
          <p class="text-sm text-zinc-400 font-medium tracking-wide">
            Puntos: {{ usuario.puntos }} | Presupuesto: {{ usuario.presupuesto }}
          </p>
        </div>
      </div>
      <Button
        icon="pi pi-sign-out"
        label="Cerrar Sesión"
        class="p-button-sm p-button-outlined p-button-secondary"
        @click="cerrarSesion"
      />
    </header>
    <!-- TODO -->
    <nav
      class="fixed bottom-0 left-0 w-full border-t border-zinc-700 p-4 flex justify-center gap-8"
    >
      <div class="w-full max-w-4xl flex justify-around items-center">
        <Button
          class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-zinc-800 !transition-colors"
        >
          <i class="pi pi-home" style="font-size: 1.5rem; color: white"></i>
          <span class="text-[10px] text-white mt-1 font-bold tracking-widest whitespace-nowrap"
            >INICIO</span
          >
        </Button>
        <Button
          class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-zinc-800 !transition-colors"
        >
          <i class="pi pi-chart-bar" style="font-size: 1.5rem; color: white"></i>
          <span class="text-[10px] text-white mt-1 font-medium tracking-widest whitespace-nowrap"
            >RANKING</span
          >
        </Button>
        <Button
          class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-zinc-800 !transition-colors"
        >
          <i class="pi pi-warehouse" style="font-size: 1.5rem; color: white"></i>
          <span class="text-[10px] text-white mt-1 font-medium tracking-widest whitespace-nowrap"
            >GARAJE</span
          >
        </Button>
        <Button
          class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-zinc-800 !transition-colors"
        >
          <i
            class="pi pi-shopping-cart"
            style="font-size: 1.5rem; color: white"
            @click="router.push('/mercado')"
          ></i>
          <span class="text-[10px] text-white mt-1 font-medium tracking-w idest whitespace-nowrap"
            >MERCADO</span
          >
        </Button>
        <Button
          class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-zinc-800 !transition-colors"
        >
          <i class="pi pi-bell" style="font-size: 1.5rem; color: white"></i>
          <span class="text-[10px] text-white mt-1 font-medium tracking-widest whitespace-nowrap"
            >AVISOS</span
          >
        </Button>
        <Button
          class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-zinc-800 !transition-colors"
        >
          <i class="pi pi-cog" style="font-size: 1.5rem; color: white"></i>
          <span class="text-[10px] text-white mt-1 font-medium tracking-widest whitespace-nowrap"
            >AJUSTES</span
          >
        </Button>
      </div>
    </nav>
  </div>
</template>
