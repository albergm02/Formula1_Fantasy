<script setup>
import { ref, computed } from 'vue'
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
      emit('fichar', props.coche) /* Emito el evento -> fantasyStore.fichar() */
    },
  })
}
</script>

<template>
  <div class="flex flex-col h-full w-full min-h-[250px]">
    <header class="flex justify-between items-center p-3 border-b border-zinc-800 z-20 shrink-0">
      <span class="text-xs font-black text-white">
        {{ props.coche.nombre.toUpperCase() }}
      </span>
      <span class="text-xs font-black text-emerald-500">{{ props.coche.precio }}M</span>
    </header>

    <main class="relative flex-1 w-full" @click="mostrarInfo = !mostrarInfo">

      <img :src="props.coche.imagen" class="absolute w-full h-full object-contain object-center" />

      <div v-show="!mostrarInfo" class="absolute bottom-4 w-full text-center z-20">
        <span class="text-xs font-black text-white px-3 py-1 animate-pulse">
          TOCA PARA VER DETALLES
        </span>
      </div>

      <div v-show="mostrarInfo" class="absolute inset-0 p-8 justify-center text-center z-30 backdrop-blur-sm">
        <h4 class="text-xs font-black border-b border-white text-white pb-2 mb-3">ESPECIFICACIONES
        </h4>
        <p class="text-xs text-zinc-300">
          {{ props.coche.descripcion || `Chasis principal del equipo. Define la base aerodinámica de tu monoplaza.` }}
        </p>
        <span class="text-xs font-black text-white animate-pulse">TOCA PARA VOLVER</span>
      </div>

    </main>

    <button v-if="modoMercado" @click="confirmarCompra"
      class="w-full border-t border-zinc-800 text-white py-2 cursor-pointer hover:bg-zinc-900 z-20">
      <i class="pi pi-cart-plus text-xs text-emerald-500 mr-2"></i>
      <span class="text-xs font-black text-emerald-500">PUJAR</span>
    </button>

  </div>
</template>