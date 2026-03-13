<script setup>
import { ref } from 'vue'
import Navbar from '@/components/Navbar.vue'
import Header from '@/components/Header.vue'

const clasificacion = ref([
  { id: 1, posicion: 1, nombre: 'Scuderia Los Pepes', puntos: 1250, valor: 105, soyYo: false },
  { id: 2, posicion: 2, nombre: 'Frenando Alonsou', puntos: 1180, valor: 98, soyYo: false },
  { id: 3, posicion: 3, nombre: 'Beetogm', puntos: 1120, valor: 102, soyYo: true }, 
  { id: 4, posicion: 4, nombre: 'Coches Chocones', puntos: 1050, valor: 95, soyYo: false },
  { id: 5, posicion: 5, nombre: 'Aston Martineta', puntos: 980, valor: 90, soyYo: false },
  { id: 6, posicion: 6, nombre: 'Red Bull Te Da Alas', puntos: 850, valor: 85, soyYo: false },
  { id: 7, posicion: 7, nombre: 'Haaster Plan', puntos: 720, valor: 70, soyYo: false },
])
</script>

<template>
  <div class="min-h-screen w-full font-sans pb-20">
    <Header />

    <main class="max-w-5xl mx-auto p-4 mt-8 mb-20 flex flex-col items-center text-center gap-4">
      <h2 class="text-2xl font-bold text-white">CLASIFICACIÓN GENERAL</h2>
      <p class="text-[#808080]">Aquí puedes ver tu posición en la clasificación general.</p>

      <div class="w-full bg-[#15151E] rounded-lg overflow-hidden mt-6">
        <div
          v-for="equipo in clasificacion"
          :key="equipo.id"
          :class="['flex items-center justify-between p-4', equipo.soyYo ? 'bg-[#FF1E00] ' : '']"
        >
          <div class="flex items-center gap-4">
            <span class="text-lg font-bold text-white">{{ equipo.posicion }}</span>
            <span class="text-lg text-white">{{ equipo.nombre }}</span>
          </div>
          <div class="flex items-center gap-4">
            <span class="text-lg text-white mr-4">{{ equipo.puntos }} pts</span>
            <span class="text-lg text-white">Valor: {{ equipo.valor }}</span>
          </div>
        </div>
      </div>
    </main>
    
    <Navbar />
  </div>
</template>
