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
const confirmar = useConfirm()

const confirmarCompra = () => {
  confirmar.require({
    message: `Â¿EstÃ¡s seguro de que quieres pujar por ${props.potenciador.nombre} por ${props.potenciador.precio}M?`,
    header: 'Confirmar Puja',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'SÃ­, pujar',
    rejectLabel: 'No, cancelar',
    accept() {
      emit('fichar', props.potenciador)
    },
  })
}
</script>

<template>
  <div class="w-full h-full min-h-[180px]">

    <div class="relative w-full h-full flex flex-col overflow-hidden border border-zinc-700 bg-black">

      <div class="relative z-10 flex flex-col flex-1 w-full h-full overflow-hidden bg-[#1A1A1F]">

        <header class="flex justify-between items-center p-2 z-20 shrink-0 bg-black">
          <div class="flex flex-col w-2/3">
            <span class="text-[10px] font-black text-white uppercase truncate">
              {{ props.potenciador.nombre }}
            </span>
            <span class="text-[9px] text-zinc-300 uppercase font-bold">MEJORA</span>
          </div>
          <span class="text-[10px] font-black text-[#D4A843]">{{ props.potenciador.precio }}M</span>
        </header>

        <main class="relative flex-1 w-full bg-transparent cursor-pointer" @click="mostrarInfo = !mostrarInfo">

          <img v-if="props.potenciador.imagen" :src="props.potenciador.imagen"
            class="absolute inset-0 w-full h-full object-cover object-center" />

          <div v-show="!mostrarInfo"
            class="absolute inset-0 w-full flex items-center justify-center z-20 pointer-events-none">
            <span
              class="px-2 py-1 bg-black text-[9px] font-black text-white text-center animate-pulse border border-white">
              VER DETALLES
            </span>
          </div>

          <div v-show="mostrarInfo"
            class="absolute inset-0 p-4 flex flex-col z-30 overflow-y-auto bg-[#1A1A1F] text-center">
            <h4 class="pb-1 mb-2 text-[10px] font-black text-white border-b border-zinc-700">
              DESCRIPCIÃ“N
            </h4>

            <ul v-if="props.potenciador.reglasUsuario?.length" class="mb-2 space-y-1 text-left">
              <li v-for="(regla, indice) in props.potenciador.reglasUsuario"
                :key="`${props.potenciador.id}-regla-${indice}`" class="text-[9px] text-zinc-300 leading-relaxed">
                • {{ regla }}
              </li>
            </ul>

            <p class="mb-2 text-[9px] text-zinc-300 leading-relaxed">
              {{ props.potenciador.descripcion || 'Pieza de rendimiento. InstÃ¡lala en tu monoplaza.' }}
            </p>

            <div class="mt-auto pt-2">
              <span class="text-[9px] font-black text-white animate-pulse">VOLVER</span>
            </div>
          </div>
        </main>

        <Button v-if="modoMercado" @click="confirmarCompra" unstyled
          class="w-full py-3 z-20 shrink-0 flex items-center justify-center bg-black border-none cursor-pointer">
          <i class="mr-1 font-bold text-[10px] text-white pi pi-money-bill"></i>
          <span class="text-white text-[10px] font-black uppercase tracking-widest">PUJAR</span>
        </Button>

      </div>
    </div>
  </div>
</template>
