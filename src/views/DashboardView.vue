<script setup>
import Header from '@/components/Header.vue'
import Navbar from '@/components/Navbar.vue'

// Importamos los widgets (de momento solo el de la carrera, luego añadimos los demás)
import WidgetProximaCarrera from '@/components/WidgetProximaCarrera.vue'
</script>

<template>

  <Header />

  <main class="p-4 mx-auto w-full gap-1 mt-2">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <WidgetProximaCarrera />

      <div class="flex flex-col gap-6">
        <div class="bg-[#15151E] border border-zinc-800 rounded p-6 text-center text-zinc-600 border-dashed">
          <i class="pi pi-cloud text-2xl mb-2"></i>
          <p class="text-xs uppercase tracking-widest font-bold">Hueco para Widget Clima</p>
        </div>
      </div>

    </div>

  </main>

  <Navbar />

</template>