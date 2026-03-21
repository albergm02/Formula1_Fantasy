<script setup>
import { ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'

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

// Emitimos el evento 'fichar' para que el componente padre (MercadoView) gestione la lógica
const emit = defineEmits(['fichar'])

const mostrarInfo = ref(false)
const confirm = useConfirm()

// Lógica de confirmación de compra encapsulada
const confirmarCompra = () => {
  confirm.require({
    message: `¿Estás seguro de que quieres fichar a ${props.piloto.nombre} por ${props.piloto.precio}M?`,
    header: 'Confirmar Fichaje',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, fichar',
    rejectLabel: 'No, cancelar',
    accept() {
      emit('fichar', props.piloto)
    },
  })
}
</script>

<template>
  <div class="px-6 py-2 w-full h-full min-h-[500px]">

    <div class="relative w-full h-full flex flex-col overflow-hidden"
      :class="props.piloto.tier === 2 ? 'p-[2px]' : 'border border-zinc-800'">

      <div v-if="props.piloto.tier === 2"
        class="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_70%,#00E5E5_100%)] animate-[spin_3s_linear_infinite]">
      </div>

      <div class="relative z-10 bg-[#15151E] flex flex-col flex-1 w-full h-full overflow-hidden">

        <header class="flex justify-between items-center p-3 z-20 bg-black shrink-0">
          <div class="flex flex-col">
            <span class="text-xs font-black text-white uppercase">
              {{ props.piloto.nombre }}
              <span v-if="props.piloto.tier === 2" class="text-[#00E5E5] ml-1">EN RACHA</span>
            </span>
            <span class="text-[10px] text-zinc-500 uppercase font-bold">{{ props.piloto.equipo }}</span>
          </div>
          <span class="text-xs font-black text-[#00E5E5]">{{ props.piloto.precio }}M</span>
        </header>

        <main class="relative flex-1 w-full cursor-pointer" @click="mostrarInfo = !mostrarInfo">

          <img v-if="props.piloto.imagen" :src="props.piloto.imagen"
            class="absolute inset-0 w-full h-full object-cover object-top" />

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
                {{ props.piloto.descripcion }}
              </p>
            </div>

            <h4 class="text-xs font-black border-b border-zinc-700 text-white pb-2 mb-3 text-center">
              HABILIDADES
            </h4>

            <div v-if="props.piloto.habilidad_1" class="mb-3">
              <p class="text-[10px] font-black text-emerald-400 uppercase mb-1 drop-shadow-sm">
                {{ props.piloto.habilidad_1.nombre }}
                <span class="text-white">+{{ props.piloto.habilidad_1.puntos }}</span>
              </p>
              <p class="text-[11px] text-zinc-300 leading-tight">
                {{ props.piloto.habilidad_1.descripcion }}
              </p>
            </div>

            <div v-if="props.piloto.tier === 2 && props.piloto.habilidad_2" class="mt-2 pt-3 border-t border-zinc-800">
              <p class="text-[10px] font-black text-[#00E5E5] uppercase mb-1 drop-shadow-sm">
                {{ props.piloto.habilidad_2.nombre }}
                <span class="text-white">+{{ props.piloto.habilidad_2.puntos }}</span>
              </p>
              <p class="text-[11px] text-zinc-300 leading-tight">
                {{ props.piloto.habilidad_2.descripcion }}
              </p>
            </div>

            <div v-if="props.piloto.tier === 2 && props.piloto.penalizacion" class="mt-2 pt-3 border-t border-zinc-800">
              <p class="text-[10px] font-black text-red-500 uppercase mb-1 drop-shadow-sm">
                {{ props.piloto.penalizacion.nombre }}
                <span class="text-white">{{ props.piloto.penalizacion.puntos }}</span>
              </p>
              <p class="text-[11px] text-zinc-300 leading-tight">
                {{ props.piloto.penalizacion.descripcion }}
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