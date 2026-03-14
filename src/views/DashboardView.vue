<script setup>
import Header from '@/components/Header.vue'
import Navbar from '@/components/Navbar.vue'

// Importamos los widgets (de momento solo el de la carrera, luego añadimos los demás)
import WidgetGP from '@/components/WidgetGP.vue'
</script>

<template>

  <Header />

  <main class="p-4 mx-auto w-full gap-1 mt-2">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <WidgetGP />
    </div>

  </main>

  <Navbar />

</template>