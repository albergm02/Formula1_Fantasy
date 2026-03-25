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
    message: `Â¿EstÃ¡s seguro de que quieres fichar a ${props.coche.nombre} por ${props.coche.precio}M?`,
    header: 'Confirmar Fichaje',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'SÃ­, fichar',
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

      <div class="relative z-10 flex flex-col flex-1 w-full h-full overflow-hidden bg-[#1A1A1F]">

        <header class="flex justify-between items-center p-3 z-20 shrink-0 bg-black">
          <div class="flex flex-col">
            <span class="text-xs font-black text-white uppercase">
              {{ props.coche.nombre }}
            </span>
            <span class="text-[10px] text-zinc-500 uppercase font-bold">CHASIS</span>
          </div>
          <span class="text-xs font-black text-[#D4A843]">{{ props.coche.precio }}M</span>
        </header>

        <main class="relative flex-1 w-full bg-transparent cursor-pointer" @click="mostrarInfo = !mostrarInfo">

          <img v-if="props.coche.imagen" :src="props.coche.imagen"
            class="absolute inset-0 w-full h-full object-contain object-center p-2" />

          <div v-show="!mostrarInfo"
            class="absolute inset-0 w-full flex items-center justify-center z-20 pointer-events-none">
            <span class="px-3 py-1 bg-black/60 text-xs font-black text-white rounded animate-pulse">
              TOCA PARA VER DETALLES
            </span>
          </div>

          <div v-show="mostrarInfo"
            class="absolute inset-0 p-5 flex flex-col z-30 overflow-y-auto bg-[#1A1A1F]/90 text-left backdrop-blur-md">

            <h4 class="pb-2 mb-3 text-xs font-black text-white text-center border-b border-zinc-700">
              DESCRIPCIÃ“N
            </h4>
            <div class="mb-3">
              <p class="text-[10px] text-zinc-300 leading-tight">
                {{ props.coche.descripcion }}
              </p>
            </div>

            <h4 class="pb-2 mb-3 text-xs font-black text-white text-center border-b border-zinc-700">
              MEJORA
            </h4>
            <div v-if="props.coche.habilidad" class="mb-3">
              <p class="mb-1 text-[10px] font-black text-emerald-400 uppercase drop-shadow-sm">
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
          class="w-full py-4 z-20 shrink-0 flex items-center justify-center bg-black border-none cursor-pointer">
          <i class="mr-2 font-bold text-sm text-white pi pi-money-bill"></i>
          <span class="text-white font-black uppercase tracking-widest">PUJAR</span>
        </Button>

      </div>
    </div>
  </div>
</template>
