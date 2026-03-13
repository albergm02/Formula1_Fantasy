<script setup>
import { ref, onMounted } from 'vue'

import { mercadoPilotos, mercadoPotenciadores, mercadoCoches } from '@/data/mercado'
import { useFantasyStore } from '@/stores/storeFantasy.js'

import { useToast } from 'primevue/usetoast'
import Navbar from '@/components/Navbar.vue'
import Header from '@/components/Header.vue'

import CartaPiloto from '@/components/CartaPiloto.vue'
import CartaPotenciador from '@/components/CartaPotenciador.vue'
import CartaCoche from '@/components/CartaCoche.vue'
import StickTiempoMercado from '@/components/StickTiempoMercado.vue'

const partida = useFantasyStore()
const toast = useToast()

const pilotosSemanales = ref([])
const cochesSemanales = ref([])
const potenciadoresSemanales = ref([])

/* TODO: QUITAR ESTO Y AGREGAR UNA GENERACIÓN DIARIA DE CARTAS PERSISTENTES AL CAMBIO */
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

/* TODO: RESTAR ESTA CARTA DE LA BASE DE DATOS GLOBAL DE CARTAS Y AÑADIRLA A LA BASE DE DATOS DEL USUARIO */
const realizarFichaje = async (elemento) => {
  const resultado = await partida.fichar(elemento)

  if (resultado.exito) {
    toast.add({
      severity: 'success',
      summary: 'Fichaje exitoso',
      detail: `Has fichado a ${elemento.nombre} por ${elemento.precio}M`,
      life: 3000,
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Fichaje fallido',
      detail: resultado.mensaje,
      life: 3000,
    })
  }
  
}
</script>

<template>
  <div class="min-h-screen w-full font-sans pb-28">

    <Header />

    <main class="mx-auto w-full max-w-5xl p-4 flex flex-col gap-8 mt-4">

      <StickTiempoMercado />
      <section>
        <div class="mb-4 border-l-4 border-zinc-500 pl-2">
          <h2 class="text-lg font-black italic text-white uppercase tracking-wide">Coches de la semana</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="coche in cochesSemanales" :key="coche.id" class="aspect-[4/3]">
            <!-- evento @fichar: realiza el fichaje si escucha el evento "fichar" por parte de su componente -->
            <CartaCoche :coche="coche" :modoMercado="true" @fichar="realizarFichaje" />
          </div>
        </div>
      </section>

      <section>
        <div class="mb-4 border-l-4 border-zinc-500 pl-2">
          <h2 class="text-lg font-black italic text-white uppercase tracking-wide">Pilotos Disponibles</h2>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div v-for="piloto in pilotosSemanales" :key="piloto.id" class="aspect-[3/4]">
            <CartaPiloto :piloto="piloto" :modoMercado="true" @fichar="realizarFichaje" />
          </div>
        </div>
      </section>

      <section>
        <div class="mb-4 border-l-4 border-zinc-500 pl-2">
          <h2 class="text-lg font-black italic text-white uppercase tracking-wide">Piezas y Mejoras</h2>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="potenciador in potenciadoresSemanales" :key="potenciador.id" class="aspect-square">
            <CartaPotenciador :potenciador="potenciador" :modoMercado="true" @fichar="realizarFichaje" />
          </div>
        </div>
      </section>

    </main>

    <Navbar />

  </div>
</template>