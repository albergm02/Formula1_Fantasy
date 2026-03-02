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
  </div>
</template>
