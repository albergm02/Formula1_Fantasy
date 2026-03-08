<script setup>
import { ref } from 'vue'

defineProps({
  potenciador: {
    type: Object,
    required: true,
  },
  modoMercado: {
    type: Boolean,
    default: false,
  },
})

const mostrarInfo = ref(false)
</script>

<template>
  <div class="flex flex-col gap-2 h-full w-full">
    <div
      class="flex flex-col border border-zinc-800 rounded-xl overflow-hidden relative flex-1 min-h-0"
    >
      <div class="shrink-0 flex justify-between items-center p-2 bg-red-800 z-20">
        <span class="text-xs font-black text-white uppercase truncate pr-2">
          {{ potenciador.nombre }}
        </span>
        <span class="text-xs font-black"> {{ potenciador.precio }}M </span>
      </div>

      <div class="relative flex-1 min-h-0 w-full" @click="mostrarInfo = !mostrarInfo">
        <img
          :src="potenciador.imagen"
          class="absolute inset-0 w-full h-full object-cover object-center transition-all duration-300"
          :class="mostrarInfo ? 'opacity-20' : 'opacity-90'"
        />

        <div
          v-if="!mostrarInfo"
          class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 flex"
        >
          <span class="text-xs font-black text-zinc-200 animate-pulse">
            TOCA PARA VER LOS DETALLES
          </span>
        </div>

        <div
          v-if="mostrarInfo"
          class="p-4 flex flex-col justify-center text-center items-center h-full bg-zinc-950/60"
        >
          <h4
            class="text-xs md:text-xs font-black text-zinc-300 border-b border-zinc-200 pb-1 mb-2"
          >
            MEJORA
          </h4>
          <p class="text-xs text-zinc-200">
            {{
              potenciador.descripcion ||
              'Pieza de rendimiento. Instálala en tu garaje para aumentar los puntos base de tu monoplaza.'
            }}
          </p>
        </div>
      </div>
      <button
        v-if="modoMercado"
        class="shrink-0 w-full bg-zinc-950 text-white py-3 flex items-center justify-center gap-2 transition-all active:scale-90"
      >
        <i class="pi pi-money-bill text-xs"></i>
        <span class="text-xs font-black">PUJAR</span>
      </button>
    </div>
  </div>
</template>
