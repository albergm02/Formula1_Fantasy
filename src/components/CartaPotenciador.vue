<script setup>
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useFantasyStore } from '@/stores/storeFantasy'

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

const mostrarInfo = ref(false)
const toast = useToast()
const confirm = useConfirm()
const fantasyStore = useFantasyStore()

const confirmarCompra = () => {
  confirm.require({
    message: `¿Estás seguro de que quieres pujar por ${props.potenciador.nombre} por ${props.potenciador.precio}M?`,
    header: 'Confirmar Puja',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, pujar',
    rejectLabel: 'No, cancelar',
    accept() {
      const exito = fantasyStore.pujarPorElemento(props.potenciador)
      if (exito) {
        toast.add({
          severity: 'success',
          summary: 'Puja realizada',
          detail: `Has pujado por ${props.potenciador.nombre} por ${props.potenciador.precio}M`,
          life: 3000,
        })
      } else {
        toast.add({
          severity: 'error',
          summary: 'Puja fallida',
          detail: 'No tienes presupuesto suficiente',
          life: 3000,
        })
      }
    },
  })
}
</script>

<template>
  <div class="flex flex-col gap-3 h-full w-full min-h-[250px]">
    <div class="flex flex-col border border-zinc-800 rounded-xl relative flex-1">
      <div class="shrink-0 flex justify-between items-center p-2 bg-zinc-850 z-20">
        <span class="text-xs font-black text-white uppercase truncate pr-2">
          {{ potenciador.nombre }}
        </span>
        <span class="text-xs font-black text-[#10b981]"> {{ potenciador.precio }}M </span>
      </div>

      <!-- Touch manipulation permite ejecutar el click instantaneamente. 
       v-show carga la seccion detalles antes incluso de que sea tocada -->
      <div class="relative flex-1 min-h-0 w-full cursor-pointer touch-manipulation select-none" @click="mostrarInfo = !mostrarInfo">
        <img
          :src="potenciador.imagen"
          class="absolute inset-0 w-full h-full object-cover object-center"
          :class="mostrarInfo ? 'opacity-20' : 'opacity-90'"
        />

        <!-- Oculto el texto al tocar. -->
        <div v-show="!mostrarInfo" class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 flex">
          <span class="text-xs font-black text-zinc-200 animate-pulse">
            TOCA PARA VER LOS DETALLES
          </span>
        </div>

        <div v-show="mostrarInfo" class="p-4 flex flex-col justify-center text-center items-center h-full bg-zinc-950/60 absolute inset-0">
          <h4 class="text-xs md:text-xs font-black text-zinc-300 border-b border-zinc-200 pb-1 mb-2">
            MEJORA
          </h4>
          <p class="text-xs text-zinc-200">
            {{ potenciador.descripcion || 'Pieza de rendimiento. Instálala en tu garaje para aumentar los puntos base de tu monoplaza.' }}
          </p>
        </div>
      </div>
      
      <button
        v-if="modoMercado"
        @click="confirmarCompra"
        class="shrink-0 w-full bg-zinc-950 text-white py-3 flex items-center justify-center gap-2 rounded-b-xl hover:bg-zinc-900 touch-manipulation"
      >
        <i class="pi pi-money-bill text-xs text-[#10b981]"></i>
        <span class="text-xs font-black text-[#10b981]">PUJAR</span>
      </button>
    </div>
  </div>
</template>