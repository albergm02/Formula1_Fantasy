<script setup>
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import { signOut } from '@/services/authService'

// 1. Importación purista: Carpeta 'estado', archivo 'partida', función 'usarEstadoPartida'
import { usarEstadoPartida } from '@/estado/partida'
import NavbarFlotante from '@/components/NavBarFlotante.vue'

const router = useRouter()

// 2. Instanciamos el estado
const partida = usarEstadoPartida()

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
  <div class="min-h-screen w-full font-sans pb-20">

    <header class="w-full bg-zinc-900 border-b border-red-600 p-3 flex justify-between items-center sticky top-0 z-40">

      <div class="flex items-center gap-2">
        <img src="/logo_final.png" alt="Logo F1" class="h-8 w-8 object-contain" />
        <span class="font-black italic text-red-600 text-lg">F1 FANTASY</span>
      </div>

      <div class="flex items-center gap-3">
        <div class="text-right">
          <p class="text-xs text-white font-bold uppercase">{{ partida.usuario.nombre }}</p>
          <p class="text-[10px] text-zinc-400">
            Pts: <strong class="text-yellow-500">{{ partida.usuario.puntos }}</strong>
            | <span class="text-emerald-500 font-bold">{{ partida.usuario.presupuesto }}M</span>
          </p>
        </div>

        <Button @click="cerrarSesion" icon="pi pi-sign-out" severity="danger" text rounded
          class="!text-zinc-400 hover:!text-red-500" />
      </div>

    </header>

    <main class="max-w-5xl mx-auto p-4 mt-8 flex flex-col items-center text-center gap-4">
      <h2 class="text-2xl font-bold text-white">¡Bienvenido al Paddock!</h2>
      <p class="text-zinc-400">Próximamente aquí verás tu resumen de jornada.</p>

      <Button @click="partida.resetearCuenta()" label="RESETEAR PARTIDA" class="!bg-red-600 !text-white !mt-8" />
    </main>

    <NavbarFlotante />

  </div>
</template>