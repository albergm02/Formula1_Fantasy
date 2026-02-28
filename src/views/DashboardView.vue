<script setup>
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import { signOut } from '@/services/authService'

const router = useRouter()

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
  <div class="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans">
    <div class="w-full max-w-md !bg-zinc-800 rounded !shadow-red-600/50 p-6">
      <h1 class="text-3xl font-black italic text-red-600 mb-6 text-center">DASHBOARD</h1>
      <p class="text-center text-gray-300 mb-6">¡Bienvenido al Dashboard de F1 Fantasy!</p>
      <div class="flex justify-center">
        <Button
          label="Cerrar Sesión"
          class="!bg-red-600 !border-red-600 font-bold !text-white hover:!bg-red-700 hover:!border-red-700 transition-colors"
          @click="cerrarSesion"
        />
      </div>
    </div>
  </div>
</template>
