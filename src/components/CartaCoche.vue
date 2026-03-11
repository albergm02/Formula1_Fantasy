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

/* Emit: Se emite el evento 'fichar' con el coche seleccionado cuando el usuario confirma la compra en modo mercado. */
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
  <!-- Overflow Hidden corta la imagen para que no sobrepase el cuadro -->
  <div class="flex flex-col h-full w-full min-h-[250px] overflow-hidden">

    <!-- Header con precio y nombre del coche -->
    <header class="flex justify-between items-center p-3 bg-[#15151E] z-20 shrink-0">
      <span class="text-xs font-black text-white">
        {{ coche.nombre.toUpperCase() }}
      </span>
      <span class="text-xs font-black text-emerald-500">{{ coche.precio }}M</span>
    </header>

    <!-- Main con imagen y detalles del coche -->
    <main class="relative flex-1 w-full" @click="mostrarInfo = !mostrarInfo">

      <!-- Imagen del coche, object-cover: mantiene la proporción y recorta el exceso -->
      <img :src="coche.imagen" class="absolute w-full h-full object-cover" />

      <!-- Overlay para mostrar el mensaje de tocar para ver detalles o las especificaciones del coche -->
      <div v-show="!mostrarInfo" class="p-4 text-center">
        <span class="text-xs font-black text-white animate-pulse">TOCA PARA VER DETALLES</span>
      </div>

      <!-- Overlay con fondo semitransparente para mostrar las especificaciones del coche -->
      <div v-show="mostrarInfo" class="absolute inset-0 p-10 flex flex-col justify-center text-center bg-[#15151E]/80">
        <h4 class="text-xs font-black border-b text-white pb-1 mb-2">ESPECIFICACIONES</h4>
        <p class="text-xs text-white">
          <!-- TODO: Reemplazar esta descripción genérica por una específica para cada coche en el backend -->
          {{ coche.descripcion || 'Chasis principal del equipo. Define la base aerodinámica de tu monoplaza.' }}
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