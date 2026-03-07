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

      <div
        class="relative flex-1 min-h-0 w-full bg-zinc-950 cursor-pointer overflow-hidden"
        @click="mostrarInfo = !mostrarInfo"
      >
        <img
          :src="piloto.imagen || 'https://via.placeholder.com/150'"
          alt="Foto"
          class="absolute inset-0 w-full h-full object-cover object-center transition-all duration-300"
          :class="mostrarInfo ? 'opacity-20 blur-md scale-105' : 'opacity-90'"
        />

        <span
          v-if="piloto.tier && !mostrarInfo"
          class="absolute bottom-2 left-2 bg-black/80 text-white text-[8px] md:text-[10px] font-black px-1.5 py-0.5 rounded shadow"
        >
          {{ piloto.tier }}
        </span>

        <div
          class="absolute top-2 right-2 px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-colors z-20 border border-white/10 shadow-sm"
          :class="
            mostrarInfo ? 'bg-zinc-800/90 text-white' : 'bg-black/50 backdrop-blur-sm text-zinc-200'
          "
        >
          <i
            class="pi font-bold text-[8px] md:text-[9px]"
            :class="mostrarInfo ? 'pi-times' : 'pi-search'"
          ></i>
          <span class="text-[8px] md:text-[9px] font-bold uppercase tracking-widest">
            {{ mostrarInfo ? 'Cerrar' : 'Detalles' }}
          </span>
        </div>

        <div
          v-if="mostrarInfo"
          class="absolute inset-0 p-3 flex flex-col justify-center text-center z-10 overflow-y-auto"
        >
          <h4
            class="text-[10px] md:text-xs font-black text-zinc-300 uppercase border-b border-zinc-600/50 pb-1 mb-2 tracking-widest"
          >
            Habilidades
          </h4>
          <p class="text-[9px] md:text-[10px] text-zinc-200 leading-snug">
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
