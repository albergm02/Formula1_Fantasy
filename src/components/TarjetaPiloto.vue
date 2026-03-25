<script setup>
import { ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import ElectricBorder from '@/components/ElectricBorder.vue'

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

// Emitimos el evento 'fichar' para que el componente padre (MercadoView) gestione la lÃ³gica
const emit = defineEmits(['fichar'])

const mostrarInfo = ref(false)
const confirm = useConfirm()

// LÃ³gica de confirmaciÃ³n de compra encapsulada
const confirmarCompra = () => {
  confirm.require({
    message: `Â¿EstÃ¡s seguro de que quieres fichar a ${props.piloto.nombre} por ${props.piloto.precio}M?`,
    header: 'Confirmar Fichaje',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'SÃ­, fichar',
    rejectLabel: 'No, cancelar',
    accept() {
      emit('fichar', props.piloto)
    },
  })
}
</script>

<template>
  <div class="px-6 py-2 w-full h-full min-h-[500px]">

    <!-- Tier 2: envuelto con ElectricBorder | Tier 1: div con borde simple -->
    <component :is="props.piloto.tier === 2 ? ElectricBorder : 'div'" v-bind="props.piloto.tier === 2
      ? { color: '#D4A843', speed: 0.3, chaos: 0.2, thickness: 3 }
      : {}"
      :class="props.piloto.tier === 2 ? 'w-full h-full' : 'w-full h-full overflow-hidden border border-zinc-800'">
      <div class="flex flex-col w-full h-full overflow-hidden bg-[#1A1A1F]">

        <header class="flex justify-between items-center p-3 z-20 shrink-0 bg-black">
          <div class="flex flex-col">
            <span class="text-xs font-black text-white uppercase">
              {{ props.piloto.nombre }}
              <span v-if="props.piloto.tier === 2" class="ml-1 text-[#D4A843]">EN RACHA</span>
            </span>
            <span class="text-[10px] text-zinc-500 uppercase font-bold">{{ props.piloto.equipo }}</span>
          </div>
          <span class="text-xs font-black text-[#D4A843]">{{ props.piloto.precio }}M</span>
        </header>

        <main class="relative flex-1 w-full cursor-pointer" @click="mostrarInfo = !mostrarInfo">

          <img v-if="props.piloto.imagen" :src="props.piloto.imagen"
            class="absolute inset-0 w-full h-full object-cover object-top" />

          <div v-show="!mostrarInfo"
            class="absolute inset-0 w-full flex items-center justify-center z-20 pointer-events-none">
            <span class="px-3 py-1 bg-black/60 text-xs font-black text-white rounded animate-pulse">
              TOCA PARA VER DETALLES
            </span>
          </div>

          <div v-show="mostrarInfo"
            class="absolute inset-0 p-5 flex flex-col z-20 bg-[#1A1A1F]/90 text-left backdrop-blur-md">
            <h4 class="pb-2 mb-3 text-xs font-black text-white text-center border-b border-zinc-700">
              DESCRIPCIÃ“N
            </h4>
            <div class="mb-3">
              <p class="text-[10px] text-zinc-300 leading-tight">
                {{ props.piloto.descripcion }}
              </p>
            </div>

            <h4 class="pb-2 mb-3 text-xs font-black text-white text-center border-b border-zinc-700">
              HABILIDADES
            </h4>

            <div v-if="props.piloto.habilidad_1" class="mb-3">
              <p class="mb-1 text-[10px] font-black text-emerald-400 uppercase drop-shadow-sm">
                {{ props.piloto.habilidad_1.nombre }}
                <span class="text-white">+{{ props.piloto.habilidad_1.puntos }}</span>
              </p>
              <p class="text-[11px] text-zinc-300 leading-tight">
                {{ props.piloto.habilidad_1.descripcion }}
              </p>
            </div>

            <div v-if="props.piloto.tier === 2 && props.piloto.habilidad_2" class="mt-2 pt-3 border-t border-zinc-800">
              <p class="mb-1 text-[10px] font-black text-[#D4A843] uppercase drop-shadow-sm">
                {{ props.piloto.habilidad_2.nombre }}
                <span class="text-white">+{{ props.piloto.habilidad_2.puntos }}</span>
              </p>
              <p class="text-[11px] text-zinc-300 leading-tight">
                {{ props.piloto.habilidad_2.descripcion }}
              </p>
            </div>

            <div v-if="props.piloto.tier === 2 && props.piloto.penalizacion" class="mt-2 pt-3 border-t border-zinc-800">
              <p class="mb-1 text-[10px] font-black text-red-500 uppercase drop-shadow-sm">
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
          class="w-full py-4 z-20 shrink-0 flex items-center justify-center bg-black border-none cursor-pointer">
          <i class="mr-2 font-bold text-sm text-white pi pi-money-bill"></i>
          <span class="text-white font-black uppercase tracking-widest">PUJAR</span>
        </Button>

      </div>
    </component>
  </div>
</template>

