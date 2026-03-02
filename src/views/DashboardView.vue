<script setup>
import Card from 'primevue/card'
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
  <div
    class="min-h-screen flex flex-col justify-start bg-zinc-950 p-4 pb-24 items-center font-sans"
  >
    <header
      class="w-full max-w-4xl flex items-center justify-between mb-8 mt-4 border-b border-zinc-800 pb-4"
    >
      <div class="flex items-center gap-4">
        <div
          class="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white font-bold"
        >
          {{ usuario.iniciales }}
        </div>
        <div>
          <h2 class="text-xl font-bold text-white">{{ usuario.name }}</h2>
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
    // TODO
    <nav
      class="fixed bottom-0 left-0 w-full bg-black border-t border-zinc-700 p-4 flex justify-center gap-8"
    >
      <Button class="flex flex-col items-center w-16 h-16 rounded-full !bg-black !border-none">
        <i class="pi pi-home" style="font-size: 1.5rem; color: white"></i>
        <span class="text-xs text-white mt-1 font-bold tracking-wider">INICIO</span>
      </Button>
      <Button class="flex flex-col items-center w-16 h-16 rounded-full !bg-black !border-none">
        <i class="pi pi-chart-bar" style="font-size: 1.5rem; color: white"></i>
        <span class="text-xs text-white mt-1 font-bold tracking-wider">RANKING</span>
      </Button>
      <Button class="flex flex-col items-center w-16 h-16 rounded-full !bg-black !border-none">
        <i class="pi pi-warehouse" style="font-size: 1.5rem; color: white"></i>
        <span class="text-xs text-white mt-1 font-bold tracking-wider">GARAJE</span>
      </Button>
      <Button class="flex flex-col items-center w-16 h-16 rounded-full !bg-black !border-none">
        <i class="pi pi-bell" style="font-size: 1.5rem; color: white"></i>
        <span class="text-xs text-white mt-1 font-bold tracking-wider">AVISOS</span>
      </Button>
      <Button class="flex flex-col items-center w-16 h-16 rounded-full !bg-black !border-none">
        <i class="pi pi-cog" style="font-size: 1.5rem; color: white"></i>
        <span class="text-xs text-white mt-1 font-bold tracking-wider">AJUSTES</span>
      </Button>
    </nav>
  </div>
</template>
