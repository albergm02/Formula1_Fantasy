<script setup>
import { ref } from 'vue'
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
  <!-- Overflow Hidden corta la imagen para no sobrepasar el cuadro -->
  <div class="flex flex-col h-full w-full min-h-[400px] overflow-hidden">

    <!-- Header con precio y nombre del coche -->
    <header class="flex justify-between items-center p-3 bg-[#15151E] z-20 shrink-0">
      <span class="text-xs font-black text-white">
        {{ props.piloto.nombre.toUpperCase() }}
      </span>
      <span class="text-xs font-black text-emerald-500">{{ props.piloto.precio }}M</span>
    </header>

    <!-- Main con imagen y detalles del piloto -->
    <main class="relative flex-1 w-full cursor-pointer touch-manipulation select-none"
      @click="mostrarInfo = !mostrarInfo">

      <!-- Imagen del coche -->
      <img :src="props.piloto.imagen" class="absolute w-full h-full object-cover object-center" />

      <!-- Overlay para mostrar el mensaje para ver detalles -->
      <div v-show="!mostrarInfo" class="p-4 text-center">
        <span class="text-xs font-black text-white animate-pulse">TOCA PARA VER DETALLES</span>
      </div>

      <!-- Overlay con fondo semitransparente para mostrar las habilidades del piloto -->
      <div v-show="mostrarInfo" class="absolute inset-0 p-10 flex flex-col justify-center text-center bg-[#15151E]/80">
        <h4 class="text-xs font-black border-b text-white pb-1 mb-2">HABILIDADES</h4>
        <p class="text-xs text-white leading-relaxed">
          {{ props.piloto.descripcion || `Piloto de parrilla. Otorga puntos regulares y bonus.` }}
        </p>
      </div>

    </main>

    <!-- Footer con botón de fichar, solo visible en modo mercado -->
    <button v-if="modoMercado" @click="confirmarCompra"
      class="shrink-0 w-full bg-[#15151E] text-white py-3 group transition-colors cursor-pointer">
      <i class="pi pi-cart-plus text-xs text-emerald-500 group-hover:text-emerald-200 transition-colors mr-2"></i>
      <span class="text-xs font-black text-emerald-500 group-hover:text-emerald-200 transition-colors">FICHAR</span>
    </button>

  </div>
</template>