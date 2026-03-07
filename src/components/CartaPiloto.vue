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
  <div class="flex flex-col gap-2 h-full w-full">
    <div
      class="flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden relative shadow-md flex-1 min-h-0"
    >
      <div
        class="shrink-0 flex justify-between items-center p-2 bg-zinc-950 border-b border-zinc-800 z-20"
      >
        <span
          class="text-[10px] md:text-xs font-black text-white uppercase truncate pr-2 tracking-wide"
        >
          {{ piloto.nombre }}
        </span>
        <span class="text-[10px] md:text-xs font-black text-emerald-400 shrink-0">
          {{ piloto.precio }}M
        </span>
      </div>

      <div class="relative flex-1 min-h-0 w-full bg-zinc-800">
        <img
          :src="piloto.imagen || 'https://via.placeholder.com/150'"
          alt="Foto"
          class="absolute inset-0 w-full h-full object-cover object-center opacity-90 transition-opacity duration-300"
          :class="{ 'opacity-10 blur-sm': mostrarInfo }"
        />

        <span
          v-if="piloto.tier && !mostrarInfo"
          class="absolute bottom-2 left-2 bg-black/80 text-white text-[8px] md:text-[10px] font-black px-1.5 py-0.5 rounded shadow"
        >
          {{ piloto.tier }}
        </span>

        <button
          @click="mostrarInfo = !mostrarInfo"
          class="absolute bottom-2 right-2 w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md text-white/80 hover:bg-black/70 hover:text-white transition-colors z-20"
        >
          <i
            class="pi font-bold text-[10px] md:text-xs"
            :class="mostrarInfo ? 'pi-times' : 'pi-info'"
          ></i>
        </button>

        <div
          v-if="mostrarInfo"
          class="absolute inset-0 bg-black/80 p-2 flex flex-col justify-center text-center z-10 overflow-y-auto"
        >
          <h4
            class="text-[10px] md:text-xs font-black text-zinc-400 uppercase border-b border-zinc-600/50 pb-1 mb-2"
          >
            Habilidades
          </h4>
          <p class="text-[9px] md:text-[10px] text-zinc-300 leading-snug">
            {{
              piloto.descripcion ||
              'Piloto de parrilla. Otorga puntos regulares y bonus (' + piloto.tier + ').'
            }}
          </p>
        </div>
      </div>
    </div>

    <button
      v-if="modoMercado"
      class="shrink-0 w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-lg py-2 md:py-2.5 flex items-center justify-center gap-2 transition-colors shadow-sm"
    >
      <i class="pi pi-money-bill text-[11px] md:text-sm text-emerald-400"></i>
      <span class="text-[10px] md:text-xs font-black uppercase tracking-widest">Pujar</span>
    </button>
  </div>
</template>
