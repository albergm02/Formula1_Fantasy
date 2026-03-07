<script setup>
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
</script>

<template>
  <div
    class="flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden h-full min-h-0 shadow-md"
  >
    <div class="relative flex-1 min-h-0 bg-zinc-800">
      <img
        :src="potenciador.imagen || 'https://via.placeholder.com/150'"
        alt="Foto"
        class="absolute inset-0 w-full h-full object-cover opacity-80"
      />
      <span
        v-if="potenciador.tier"
        class="absolute top-1 left-1 bg-black/80 text-white text-[8px] md:text-[10px] font-black px-1.5 py-0.5 rounded"
      >
        {{ potenciador.tier }}
      </span>
    </div>

    <div class="shrink-0 p-1.5 flex flex-col gap-1.5 bg-zinc-950/50">
      <div class="flex justify-between items-center leading-none">
        <span class="text-[9px] md:text-xs font-black text-white uppercase truncate pr-1">
          {{ potenciador.nombre }}
        </span>
        <span class="text-[9px] md:text-xs font-black text-yellow-400 shrink-0">
          {{ potenciador.precio }}M
        </span>
      </div>

      <button
        v-if="modoMercado"
        class="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-[9px] md:text-xs font-black uppercase italic py-1 md:py-1.5 rounded transition"
      >
        Fichar
      </button>
    </div>
  </div>
</template>
