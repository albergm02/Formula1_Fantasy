<script setup>
import { ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'

const props = defineProps({
  coche: {
    type: Object,
    required: true,
  },
  modoMercado: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['fichar'])

const mostrarInfo = ref(false)
const confirm = useConfirm()

const confirmarCompra = () => {
  confirm.require({
    message: `¿Estás seguro de que quieres fichar a ${props.coche.nombre} por ${props.coche.precio}M?`,
    header: 'Confirmar Fichaje',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, fichar',
    rejectLabel: 'No, cancelar',
    accept() {
      emit('fichar', props.coche)
    },
  })
}
</script>

<template>
  <div class="flex flex-col gap-2 h-full w-full min-h-[250px]">
    <div class="flex flex-col border border-zinc-800 rounded-xl overflow-hidden relative flex-1 min-h-0 bg-zinc-900">

      <div class="shrink-0 flex justify-between items-center p-3 bg-zinc-900 z-20 border-b border-zinc-800">
        <span class="text-xs font-black text-white uppercase truncate pr-2">
          {{ coche.nombre }}
        </span>
        <span class="text-xs font-black text-emerald-500">{{ coche.precio }}M</span>
      </div>

      <div class="relative flex-1 min-h-0 w-full cursor-pointer touch-manipulation select-none"
        @click="mostrarInfo = !mostrarInfo">
        <img :src="coche.imagen" class="absolute inset-0 w-full h-full object-cover object-center"
          :class="mostrarInfo ? 'opacity-20' : 'opacity-90'" />

        <div v-show="!mostrarInfo"
          class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-900 to-transparent p-4 flex justify-center">
          <span class="text-[10px] font-black text-white animate-pulse">
            TOCA PARA VER DETALLES
          </span>
        </div>

        <div v-show="mostrarInfo"
          class="absolute inset-0 p-4 flex flex-col justify-center text-center items-center h-full bg-zinc-900/80 backdrop-blur-sm">
          <h4 class="text-xs font-black text-white border-b border-zinc-800 pb-1 mb-2">
            ESPECIFICACIONES
          </h4>
          <p class="text-xs text-zinc-400 leading-relaxed">
            {{ coche.descripcion || 'Chasis principal del equipo. Define la base aerodinámica de tu monoplaza.' }}
          </p>
        </div>
      </div>

      <button v-if="modoMercado" @click="confirmarCompra"
        class="shrink-0 w-full bg-zinc-800 text-white py-3 flex items-center justify-center gap-2 touch-manipulation hover:bg-red-600 group transition-colors border-t border-zinc-800">
        <i class="pi pi-cart-plus text-xs text-emerald-500 group-hover:text-white transition-colors"></i>
        <span class="text-xs font-black text-emerald-500 group-hover:text-white transition-colors">FICHAR</span>
      </button>

    </div>
  </div>
</template>