<script setup>
import { ref, computed } from 'vue'
import { useConfirm } from 'primevue/useconfirm'

const props = defineProps({
  piloto: {
    type: Object,
    required: true,
  },
  modoMercado: {
    type: Boolean,
    default: false,
  },
})

/* Emit: Se emite el evento 'fichar' con el piloto seleccionado cuando el usuario confirma la compra en modo mercado. */
const emit = defineEmits(['fichar'])

const mostrarInfo = ref(false)
const confirm = useConfirm()

const confirmarCompra = () => {
  confirm.require({
    message: `¿Estás seguro de que quieres fichar a ${props.piloto.nombre} por ${props.piloto.precio}M?`,
    header: 'Confirmar Fichaje',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, fichar',
    rejectLabel: 'No, cancelar',
    /* Emitimos el evento 'fichar' con el objeto del piloto como payload para que 
    el componente padre pueda manejar la lógica de compra. */
    accept() {
      emit('fichar', props.piloto)
    },
  })
}
</script>

<template>
  <div class="flex flex-col h-full w-full bg-transparent transition-colors min-h-[400px]">

    <header class="flex justify-between items-center p-3 border border-zinc-800 z-20 shrink-0">
      <span class="text-xs font-black text-white">
        {{ props.piloto.nombre.toUpperCase() }}
      </span>
      <span class="text-xs font-black text-emerald-500">{{ props.piloto.precio }}M</span>
    </header>

    <main class="relative flex-1 w-full cursor-pointer" @click="mostrarInfo = !mostrarInfo">

      <img :src="props.piloto.imagen"
        class="absolute w-full h-full object-cover object-top border-r border-l border-zinc-800" />

      <div v-show="!mostrarInfo" class="absolute bottom-4 w-full text-center z-20">
        <span class="text-xs font-black text-white px-3 py-1 animate-pulse">
          TOCA PARA VER DETALLES
        </span>
      </div>

      <div v-show="mostrarInfo"
        class="absolute inset-0 p-8 justify-center text-center z-30 backdrop-blur-sm border-r border-l border-zinc-800">
        <h4 class="text-xs font-black border-b border-white text-white pb-2 mb-3">ESPECIFICACIONES
        </h4>
        <p class="text-xs text-zinc-300">
          {{ props.piloto.descripcion || `Piloto principal del equipo. Define la base de tu estrategia en la pista.` }}
        </p>
        <span class="text-xs font-black text-white animate-pulse">TOCA PARA VOLVER</span>
      </div>

    </main>

    <button v-if="modoMercado" @click="confirmarCompra"
      class="w-full border border-zinc-800 text-white py-2 cursor-pointer z-20">
      <i class="pi pi-cart-plus text-xs text-emerald-500 mr-2"></i>
      <span class="text-xs font-black text-emerald-500">PUJAR</span>
    </button>

  </div>
</template>