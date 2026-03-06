<script setup>
defineProps({
  pilot: {
    type: Object,
    required: true,
  },
  marketMode: {
    type: Boolean,
    required: true,
  },
})
</script>

<template>
  <div class="relative flex flex-col group">
    <img :src="pilot.image" :alt="pilot.name" class="w-full h-auto rounded-lg shadow-md" />
    <div class="mt-2 flex flex-col gap-1">
      <div class="flex justify-between items-center px-1">
        <span class="text-[10px] font-bold text-zinc-400">
          <i class="pi pi-star-fill text-yellow-400 text-[10px] mr-1"></i>
          {{ pilot.points }}
        </span>
        <span class="text-sm font-semibold text-gray-800">{{ pilot.price }}M</span>
      </div>
      <button
        v-if="marketMode"
        class="px-3 py-1 bg-green-500 text-white text-[10px] font-bold uppercase rounded hover:bg-green-600 transition-colors"
      >
        Fichar
      </button>
      <button
        v-else
        class="px-3 py-1 bg-red-500 text-white text-[10px] font-bold uppercase rounded hover:bg-red-600 transition-colors"
      >
        Vender
      </button>
    </div>
  </div>
</template>
