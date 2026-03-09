<script setup>
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useFantasyStore } from '@/stores/tiendaFantasy'

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

const mostrarInfo = ref(false)
const toast = useToast()
const confirm = useConfirm()
const fantasyStore = useFantasyStore()

const confirmarCompra = () => {
  confirm.require({
    message: `¿Estás seguro de que quieres pujar por el coche de ${props.coche.nombre} por ${props.coche.precio}M?`,
    header: 'Confirmar Puja',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, pujar',
    rejectLabel: 'No, cancelar',
    accept() {
      const exito = fantasyStore.pujarPorElemento(props.coche)
      if (exito) {
        toast.add({
          severity: 'success',
          summary: 'Puja realizada',
          detail: `Has pujado por el coche de ${props.coche.nombre} por ${props.coche.precio}M`,
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
  <div class="flex flex-col gap-2 h-full w-full">
    <div
      class="flex flex-col border border-zinc-800 rounded-xl overflow-hidden relative flex-1 min-h-0"
    >
      <div class="shrink-0 flex justify-between items-center p-2 bg-red-800 z-20">
        <span class="text-xs font-black text-white uppercase truncate pr-2">
          {{ coche.nombre }}
        </span>
        <span class="text-xs font-black">{{ coche.precio }}M</span>
      </div>

      <div
        class="relative flex-1 min-h-0 w-full cursor-pointer"
        @click="mostrarInfo = !mostrarInfo"
      >
        <img
          :src="coche.imagen"
          class="absolute inset-0 w-full h-full object-cover object-center transition-all duration-300"
          :class="mostrarInfo ? 'opacity-20' : 'opacity-90'"
        />

        <div
          v-if="!mostrarInfo"
          class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 flex"
        >
          <span class="text-xs font-black text-zinc-200 animate-pulse">
            TOCA PARA VER LOS DETALLES
          </span>
        </div>

        <div
          v-if="mostrarInfo"
          class="p-4 flex flex-col justify-center text-center items-center h-full bg-zinc-950/60"
        >
          <h4
            class="text-xs md:text-xs font-black text-zinc-300 border-b border-zinc-200 pb-1 mb-2"
          >
            ESPECIFICACIONES
          </h4>
          <p class="text-xs text-zinc-200">
            {{
              coche.descripcion ||
              'Chasis principal del equipo. Define la base aerodinámica de tu monoplaza.'
            }}
          </p>
        </div>
      </div>
      <button
        v-if="modoMercado"
        @click="confirmarCompra"
        class="shrink-0 w-full bg-zinc-950 text-white py-3 flex items-center justify-center gap-2 transition-all active:scale-90 hover:bg-zinc-900"
      >
        <i class="pi pi-money-bill text-xs"></i>
        <span class="text-xs font-black">PUJAR</span>
      </button>
    </div>
  </div>
</template>
