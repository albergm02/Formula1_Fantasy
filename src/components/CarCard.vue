<script setup>
import { ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'

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
  <div class="px-6 py-2 w-full h-full min-h-[400px]">

    <div class="relative w-full h-full flex flex-col overflow-hidden border border-zinc-800">

      <div class="relative z-10 bg-[#15151E] flex flex-col flex-1 w-full h-full overflow-hidden">

        <header class="flex justify-between items-center p-3 z-20 bg-black shrink-0">
          <div class="flex flex-col">
            <span class="text-xs font-black text-white uppercase">
              {{ props.coche.nombre }}
            </span>
            <span class="text-[10px] text-zinc-500 uppercase font-bold">CHASIS</span>
          </div>
          <span class="text-xs font-black text-[#00E5E5]">{{ props.coche.precio }}M</span>
        </header>

        <main class="relative flex-1 w-full cursor-pointer bg-transparent" @click="mostrarInfo = !mostrarInfo">

          <img v-if="props.coche.imagen" :src="props.coche.imagen"
            class="absolute inset-0 w-full h-full object-contain object-center p-2" />

          <div v-show="!mostrarInfo"
            class="absolute inset-0 w-full flex items-center justify-center pointer-events-none z-20">
            <span class="text-xs font-black text-white px-3 py-1 bg-black/60 rounded animate-pulse">
              TOCA PARA VER DETALLES
            </span>
          </div>

          <div v-show="mostrarInfo"
            class="absolute inset-0 p-5 flex flex-col text-left z-30 bg-[#15151E]/90 backdrop-blur-md overflow-y-auto">

            <h4 class="text-xs font-black border-b border-zinc-700 text-white pb-2 mb-3 text-center">
              DESCRIPCIÓN
            </h4>
            <div class="mb-3">
              <p class="text-[10px] text-zinc-300 leading-tight">
                {{ props.coche.descripcion }}
              </p>
            </div>

            <h4 class="text-xs font-black border-b border-zinc-700 text-white pb-2 mb-3 text-center">
              MEJORA
            </h4>
            <div v-if="props.coche.habilidad" class="mb-3">
              <p class="text-[10px] font-black text-emerald-400 uppercase mb-1 drop-shadow-sm">
                {{ props.coche.habilidad.nombre }}
                <span class="text-white">+{{ props.coche.habilidad.puntos }}</span>
              </p>
              <p class="text-[11px] text-zinc-300 leading-tight">
                {{ props.coche.habilidad.descripcion }}
              </p>
            </div>

            <div class="mt-auto pt-4 text-center">
              <span class="text-[10px] font-black text-white animate-pulse">TOCA PARA VOLVER</span>
            </div>
          </div>
        </main>

        <Button v-if="modoMercado" @click="confirmarCompra" unstyled
          class="w-full bg-black border-none py-4 z-20 shrink-0 flex items-center justify-center cursor-pointer">
          <i class="pi pi-money-bill font-bold text-sm text-white mr-2"></i>
          <span class="text-white font-black uppercase tracking-widest">PUJAR</span>
        </Button>

      </div>
    </div>
  </div>
</template>