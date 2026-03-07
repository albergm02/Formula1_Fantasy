<script setup>
import { ref } from 'vue'

defineProps({
  piloto: {
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
  <div
    class="flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden h-full min-h-0 shadow-md w-full relative"
  >
    <div class="shrink-0 bg-zinc-950 p-1.5 text-center border-b border-zinc-800 z-20">
      <span
        class="text-[10px] md:text-xs font-black text-white uppercase truncate block tracking-wide"
      >
        {{ piloto.nombre }}
      </span>
    </div>

    <div class="relative flex-1 min-h-0 bg-zinc-800 w-full">
      <img
        :src="piloto.imagen || 'https://via.placeholder.com/150'"
        alt="Foto"
        class="absolute inset-0 w-full h-full object-cover object-center opacity-90 transition-opacity duration-300"
        :class="{ 'opacity-10 blur-sm': mostrarInfo }"
      />

      <span
        v-if="piloto.tier && !mostrarInfo"
        class="absolute top-1 left-1 bg-black/80 text-white text-[8px] md:text-[10px] font-black px-1.5 py-0.5 rounded shadow"
      >
        {{ piloto.tier }}
      </span>

      <button
        @click="mostrarInfo = !mostrarInfo"
        class="absolute top-1 right-1 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 z-20"
        :class="mostrarInfo ? 'bg-zinc-700 text-white' : 'bg-[#e10600] text-white'"
      >
        <i
          class="pi font-black text-[10px] md:text-xs"
          :class="mostrarInfo ? 'pi-times' : 'pi-info'"
        ></i>
      </button>

      <div
        v-if="mostrarInfo"
        class="absolute inset-0 bg-black/70 p-2 flex flex-col justify-center text-center z-10 overflow-y-auto"
      >
        <h4
          class="text-[10px] md:text-xs font-black text-[#e10600] uppercase border-b border-[#e10600]/30 pb-1 mb-2"
        >
          Habilidades
        </h4>
        <p class="text-[9px] md:text-[10px] text-zinc-300 leading-snug">
          {{
            piloto.descripcion ||
            'Piloto de parrilla. Otorga puntos regulares y bonus de clasificación (' +
              piloto.tier +
              ').'
          }}
        </p>
      </div>
    </div>

    <div class="shrink-0 p-1.5 flex flex-col gap-1.5 bg-zinc-950/80 z-20">
      <div class="flex justify-center items-center leading-none">
        <span class="text-[10px] md:text-xs font-black text-yellow-400 shrink-0">
          {{ piloto.precio }}M
        </span>
      </div>

      <button
        v-if="modoMercado"
        class="w-full bg-[#e10600] hover:bg-red-600 text-white text-[9px] md:text-xs font-black uppercase italic py-1 md:py-1.5 rounded transition shadow-[0_0_8px_rgba(225,6,0,0.3)]"
      >
        Fichar
      </button>
    </div>
  </div>
</template>
