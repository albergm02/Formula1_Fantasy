<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { signOut } from '@/services/authService'

import { mercadoPilotos, mercadoPotenciadores, mercadoCoches } from '@/data/mercado'
import { useFantasyStore } from '@/stores/storeFantasy.js'

import Button from 'primevue/button'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import Navbar from '@/components/Navbar.vue'

import CartaPiloto from '@/components/CartaPiloto.vue'
import CartaPotenciador from '@/components/CartaPotenciador.vue'
import CartaCoche from '@/components/CartaCoche.vue'

const router = useRouter()
const partida = useFantasyStore()
const toast = useToast()

const pilotosSemanales = ref([])
const cochesSemanales = ref([])
const potenciadoresSemanales = ref([])

const generarMercado = () => {
  const q1 = mercadoPilotos.filter(p => p.tier === 'Q1').sort(() => 0.5 - Math.random()).slice(0, 2)
  const q2 = mercadoPilotos.filter(p => p.tier === 'Q2').sort(() => 0.5 - Math.random()).slice(0, 2)
  const q3 = mercadoPilotos.filter(p => p.tier === 'Q3').sort(() => 0.5 - Math.random()).slice(0, 2)

  pilotosSemanales.value = [...q1, ...q2, ...q3].map(p => ({ ...p, tipo: 'piloto' }))
  cochesSemanales.value = mercadoCoches.sort(() => 0.5 - Math.random()).slice(0, 2).map(c => ({ ...c, tipo: 'coche' }))
  potenciadoresSemanales.value = mercadoPotenciadores.sort(() => 0.5 - Math.random()).slice(0, 4).map(p => ({ ...p, tipo: 'potenciador' }))
}

onMounted(() => {
  generarMercado()
})

// Función centralizada: Recibe el elemento que la carta nos envía al pulsar su botón
const realizarFichaje = (elemento) => {
  const resultado = partida.fichar(elemento)

  if (resultado.exito) {
    toast.add({ severity: 'success', summary: '¡Fichaje Confirmado!', detail: resultado.mensaje, life: 3000 })
  } else {
    toast.add({ severity: 'error', summary: 'Operación denegada', detail: resultado.mensaje, life: 3000 })
  }
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
  <div class="min-h-screen w-full font-sans pb-28">

    <header
      class="w-full bg-zinc-900 border-b border-red-600 p-3 flex justify-between items-center sticky top-0 z-40 shadow-lg">
      <div class="flex items-center gap-2">
        <img src="/logo.png" alt="Logo F1" class="h-8 w-8 object-contain" />
        <span class="font-black italic text-red-600 text-lg hidden sm:block">F1 FANTASY</span>
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

    <main class="mx-auto w-full max-w-5xl p-4 flex flex-col gap-8 mt-4">

      <div class="flex items-end justify-center">
        <span
          class="text-xs text-emerald-500 font-bold uppercase tracking-wider bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-900/50">
          <i class="pi pi-sync mr-1"></i> El mercado refresca en: 4d 12h
        </span>
      </div>

      <section>
        <div class="mb-4 border-l-4 border-zinc-500 pl-2">
          <h2 class="text-lg font-black italic text-white uppercase tracking-wide">Coches de la semana</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="coche in cochesSemanales" :key="coche.id"
            class="aspect-[4/3] cursor-pointer hover:scale-[1.02] transition-transform">
            <CartaCoche :coche="coche" :modoMercado="true" @fichar="realizarFichaje" />
          </div>
        </div>
      </section>

      <section>
        <div class="mb-4 border-l-4 border-zinc-500 pl-2">
          <h2 class="text-lg font-black italic text-white uppercase tracking-wide">Pilotos Disponibles</h2>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div v-for="piloto in pilotosSemanales" :key="piloto.id"
            class="aspect-[3/4] cursor-pointer hover:scale-[1.02] transition-transform">
            <CartaPiloto :piloto="piloto" :modoMercado="true" @fichar="realizarFichaje" />
          </div>
        </div>
      </section>

      <section>
        <div class="mb-4 border-l-4 border-zinc-500 pl-2">
          <h2 class="text-lg font-black italic text-white uppercase tracking-wide">Piezas y Mejoras</h2>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="potenciador in potenciadoresSemanales" :key="potenciador.id"
            class="aspect-square cursor-pointer hover:scale-[1.02] transition-transform">
            <CartaPotenciador :potenciador="potenciador" :modoMercado="true" @fichar="realizarFichaje" />
          </div>
        </div>
      </section>

    </main>

    <Navbar />

  </div>
</template>