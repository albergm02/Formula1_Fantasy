<script setup>
import { ref } from 'vue'

// Recibimos las propiedades del coche y el modo desde el componente padre
defineProps({
  coche: {
    type: Object,
    required: true,
  },
  modoMercado: {
    type: Boolean,
    default: false,
  },
})

// Controlamos si se ve la imagen o la información
const mostrarInfo = ref(false)
</script>

<template>
  <div class="flex flex-col gap-2 h-full w-full">
    <div
      class="flex flex-col bg-zinc-900 rounded-xl overflow-hidden relative shadow-md flex-1 min-h-0"
    >
      <div class="shrink-0 flex justify-between items-center p-2 bg-zinc-950 z-20">
        <span
          class="text-sm md:text-base font-black text-white uppercase truncate pr-2 tracking-wide"
        >
          {{ coche.nombre }}
        </span>
        <span class="text-sm md:text-base font-black text-emerald-400 shrink-0">
          {{ coche.precio }}M
        </span>
      </div>

      <div
        class="relative flex-1 min-h-0 w-full bg-zinc-950 cursor-pointer overflow-hidden"
        @click="mostrarInfo = !mostrarInfo"
      >
        <img
          :src="coche.imagen"
          alt="Coche"
          class="absolute inset-0 w-full h-full object-cover object-center transition-all duration-300"
          :class="mostrarInfo ? 'opacity-20 blur-md' : 'opacity-90'"
        />

        <div
          v-if="!mostrarInfo"
          class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex justify-center items-end h-1/2"
        >
          <span class="text-[9px] font-bold text-zinc-300 tracking-[0.2em] animate-pulse">
            TOCA PARA VER LOS DETALLES
          </span>
        </div>

        <div
          v-if="mostrarInfo"
          class="absolute inset-0 p-3 flex flex-col justify-center text-center z-10 overflow-y-auto"
        >
          <h4
            class="text-xs md:text-sm font-black text-zinc-300 border-b border-zinc-600/50 pb-1 mb-2 tracking-widest"
          >
            ESPECIFICACIONES
          </h4>
          <p class="text-[10px] md:text-xs text-zinc-200 leading-snug">
            {{
              coche.descripcion ||
              'Chasis principal del equipo. Define la base aerodinámica de tu monoplaza.'
            }}
          </p>
          <span class="mt-4 text-[8px] font-bold text-zinc-500 tracking-widest">
            TOCA PARA VOLVER
          </span>
        </div>
      </div>
    </div>

    <button
      v-if="modoMercado"
      class="shrink-0 w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-lg py-2 md:py-2.5 flex items-center justify-center gap-2 transition-colors shadow-sm active:scale-95"
    >
      <i class="pi pi-money-bill text-[12px] md:text-sm text-emerald-400"></i>
      <span class="text-[11px] md:text-xs font-black uppercase tracking-widest">Pujar</span>
    </button>
  </div>
</template>
