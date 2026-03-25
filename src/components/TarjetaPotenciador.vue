<script setup>
import { ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'

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

const emit = defineEmits(['fichar'])
const mostrarInfo = ref(false)
const confirm = useConfirm()

const confirmarCompra = () => {
  confirm.require({
    message: `¿Estás seguro de que quieres pujar por ${props.potenciador.nombre} por ${props.potenciador.precio}M?`,
    header: 'Confirmar Puja',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, pujar',
    rejectLabel: 'No, cancelar',
    accept() {
      emit('fichar', props.potenciador)
    },
  })
}
</script>

<template>
  <div class="w-full h-full min-h-[250px]">

    <div class="relative w-full h-full flex flex-col overflow-hidden border border-zinc-800">

      <div class="relative z-10 bg-[#1A1A1F] flex flex-col flex-1 w-full h-full overflow-hidden">

        <header class="flex justify-between items-center p-2 z-20 bg-black shrink-0">
          <div class="flex flex-col w-2/3">
            <span class="text-[10px] font-black text-white uppercase truncate">
              {{ props.potenciador.nombre }}
            </span>
            <span class="text-[9px] text-zinc-500 uppercase font-bold">MEJORA</span>
          </div>
          <span class="text-[10px] font-black text-[#D4A843]">{{ props.potenciador.precio }}M</span>
        </header>

        <main class="relative flex-1 w-full cursor-pointer bg-transparent" @click="mostrarInfo = !mostrarInfo">

          <img v-if="props.potenciador.imagen" :src="props.potenciador.imagen"
            class="absolute inset-0 w-full h-full object-cover object-center" />

          <div v-show="!mostrarInfo"
            class="absolute inset-0 w-full flex items-center justify-center pointer-events-none z-20">
            <span class="text-[9px] font-black text-white px-2 py-1 bg-black/60 rounded animate-pulse text-center">
              VER DETALLES
            </span>
          </div>

          <div v-show="mostrarInfo"
            class="absolute inset-0 p-4 flex flex-col text-center z-30 bg-[#1A1A1F]/90 backdrop-blur-md overflow-y-auto">
            <h4 class="text-[10px] font-black border-b border-zinc-700 text-white pb-1 mb-2">
              DESCRIPCIÓN
            </h4>

            <p class="text-[9px] text-zinc-300 leading-relaxed mb-2">
              {{ props.potenciador.descripcion || 'Pieza de rendimiento. Instálala en tu monoplaza.' }}
            </p>

            <div class="mt-auto pt-2">
              <span class="text-[9px] font-black text-white animate-pulse">VOLVER</span>
            </div>
          </div>
        </main>

        <Button v-if="modoMercado" @click="confirmarCompra" unstyled
          class="w-full bg-black border-none py-3 z-20 shrink-0 flex items-center justify-center cursor-pointer">
          <i class="pi pi-money-bill font-bold text-[10px] text-white mr-1"></i>
          <span class="text-white text-[10px] font-black uppercase tracking-widest">PUJAR</span>
        </Button>

      </div>
    </div>
  </div>
</template>