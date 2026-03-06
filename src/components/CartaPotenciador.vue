<script setup>
defineProps({
  potenciador: {
    tipo: Object,
    requerido: true,
  },
  modoMercado: {
    tipo: Boolean,
    requerido: true,
  },
})
</script>

<template>
  <img :src="potenciador.imagen" :alt="potenciador.nombre" class="w-full h-auto object-cover" />
  <div class="flex flex-col mt-2">
    <div class="flex flex-col bg-zinc-700 p-3">
      <span class="text-sm font-bold text-yellow-400">
        <i class="pi pi-star mr-1"></i>
        {{ 'Puntos: ' + potenciador.puntos }}
      </span>
      <span class="text-lg font-bold text-white">{{ 'Precio: ' + potenciador.precio + 'M' }}</span>
    </div>
    <button v-if="modoMercado" class="w-full py-2 bg-green-900 text-white font-bold">FICHAR</button>
    <button v-else class="w-full py-2 bg-red-500 text-white font-bold">VENDER</button>
  </div>
</template>
