<script setup>
import { ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'

const props = defineProps({
  potenciador: {
    type: Object,
    required: true,
  },
  modoMercado: {
    type: Boolean,
    default: false,
  },
})

/* Emit: Se emite el evento 'fichar' con el potenciador seleccionado cuando el usuario confirma la compra en modo mercado. */
const emit = defineEmits(['fichar'])

/* Referencia reactiva para controlar la visibilidad de la información detallada del potenciador. */
const mostrarInfo = ref(false)
const confirm = useConfirm()

const confirmarCompra = () => {
  confirm.require({
    message: `¿Estás seguro de que quieres pujar por ${props.potenciador.nombre} por ${props.potenciador.precio}M?`,
    header: 'Confirmar Puja',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, pujar',
    rejectLabel: 'No, cancelar',
    /* Al aceptar, se emite el evento 'fichar' 
    con el objeto del potenciador como payload para que el componente padre pueda manejar la lógica de compra. 
    (componente padre: fantasyStore)) */
    accept() {
      emit('fichar', props.potenciador)
    },
  })
}
</script>

<template>
  <div class="flex flex-col h-full w-full min-h-[250px] overflow-hidden">

    <header class="flex justify-between items-center p-3 bg-[#15151E] z-20 shrink-0">
      <span class="text-xs font-black text-white">
        {{ props.potenciador.nombre.toUpperCase() }}
      </span>
      <span class="text-xs font-black text-emerald-500">{{ props.potenciador.precio }}M</span>
    </header>

    <main class="relative flex-1 w-full cursor-pointer touch-manipulation select-none"
      @click="mostrarInfo = !mostrarInfo">

      <img :src="props.potenciador.imagen" class="absolute w-full h-full object-cover object-center" />

      <div v-show="!mostrarInfo" class="p-4 text-center">
        <span class="text-xs font-black text-white animate-pulse">TOCA PARA VER DETALLES</span>
      </div>

      <div v-show="mostrarInfo" class="absolute inset-0 p-10 flex flex-col justify-center text-center bg-[#15151E]/80">
        <h4 class="text-xs font-black border-b text-white pb-1 mb-2">MEJORA</h4>
        <p class="text-xs text-white leading-relaxed">
          {{ props.potenciador.descripcion || 'Pieza de rendimiento. Instálala en tu monoplaza.' }}
        </p>
      </div>

    </main>

    <button v-if="modoMercado" @click="confirmarCompra"
      class="shrink-0 w-full bg-[#15151E] text-white py-3 group transition-colors cursor-pointer">
      <i class="pi pi-cart-plus text-xs text-emerald-500 group-hover:text-emerald-200 transition-colors mr-2"></i>
      <span class="text-xs font-black text-emerald-500 group-hover:text-emerald-200 transition-colors">FICHAR</span>
    </button>

  </div>
</template>