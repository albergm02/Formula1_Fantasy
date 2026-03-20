<script setup>
import { ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import ElectricBorder from '@/components/ElectricBorder.vue'
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

const emit = defineEmits(['fichar'])
const mostrarInfo = ref(false)
const confirm = useConfirm()

const confirmarCompra = () => {
  confirm.require({
    message: `¿Estás seguro de que quieres pujar por ${props.piloto.nombre} por ${props.piloto.precio}M?`,
    header: 'Confirmar Puja',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, pujar',
    rejectLabel: 'No, cancelar',
    accept() {
      emit('fichar', props.piloto)
    },
  })
}
</script>
<template>
  <div class="flex flex-col px-6 py-2">
    <!-- Aqui lo que hago es: o es un div o es un ElectricBorder dependiendo de su tier -->
    <component
      :is="props.piloto.tier === 2 ? ElectricBorder : 'div'"
      :color="'#00E5E5'"
      :speed="0.5"
      :chaos="0.3"
      :thickness="2"
      class="w-full p-2"
    >
      <div class="bg-[#15151E] h-full">
        <header class="flex justify-between items-center p-3 z-20 bg-black/40">
          <div class="flex flex-col">
            <span class="text-xs font-black text-white uppercase">
              {{ props.piloto.nombre }}
              <!-- Si está en racha, (tier 2), se añade -->
              <span v-if="props.piloto.tier === 2" class="text-[#00E5E5] ml-1">EN RACHA</span>
            </span>
            <span class="text-[10px] text-zinc-500 uppercase font-bold">{{
              props.piloto.equipo
            }}</span>
          </div>
          <span class="text-xs font-black text-[#00E5E5]">{{ props.piloto.precio }}M</span>
        </header>

        <main class="relative flex-1 w-full flex flex-col" @click="mostrarInfo = !mostrarInfo">
          <img
            v-if="props.piloto.imagen"
            :src="props.piloto.imagen"
            class="relative w-full flex-1 object-cover object-top"
          />

          <div
            v-show="!mostrarInfo"
            class="absolute inset-0 w-full text-center z-20 flex items-center justify-center"
          >
            <span class="text-3xl font-black text-white px-3 py-1 animate-pulse">
              TOCA PARA VER DETALLES
            </span>
          </div>

          <div
            v-show="mostrarInfo"
            class="absolute inset-0 p-5 flex flex-col justify-center text-left z-30 bg-[#15151E]/80 backdrop-blur-md overflow-y-auto"
          >
            <h4
              class="text-xs font-black border-b border-zinc-700 text-white pb-2 mb-3 text-center"
            >
              DESCRIPCION
            </h4>

            <div class="mb-3">
              <p class="text-[10px] text-zinc-300">
                {{ props.piloto.descripcion }}
              </p>
            </div>

            <h4
              class="text-xs font-black border-b border-zinc-700 text-white pb-2 mb-3 text-center"
            >
              HABILIDADES
            </h4>

            <div v-if="props.piloto.habilidad_1" class="mb-3">
              <p class="text-[10px] font-black text-emerald-400 uppercase mb-1">
                {{ props.piloto.habilidad_1.nombre }}
                <span class="text-white">+{{ props.piloto.habilidad_1.puntos }}</span>
              </p>
              <p class="text-[11px] text-zinc-300">
                {{ props.piloto.habilidad_1.descripcion }}
              </p>
            </div>

            <div
              v-if="props.piloto.tier === 2 && props.piloto.habilidad_2"
              class="mt-2 pt-3 border-t border-zinc-800"
            >
              <p class="text-[10px] font-black text-[#00E5E5] uppercase mb-1">
                {{ props.piloto.habilidad_2.nombre }}
                <span class="text-white">+{{ props.piloto.habilidad_2.puntos }}</span>
              </p>
              <p class="text-[11px] text-zinc-300">
                {{ props.piloto.habilidad_2.descripcion }}
              </p>
            </div>

            <div
              v-if="props.piloto.tier === 2 && props.piloto.penalizacion"
              class="mt-2 pt-3 border-t border-zinc-800"
            >
              <p class="text-[10px] font-black text-red-500 uppercase mb-1">
                {{ props.piloto.penalizacion.nombre }}
                <span class="text-white">{{ props.piloto.penalizacion.puntos }}</span>
              </p>
              <p class="text-[11px] text-zinc-300">
                {{ props.piloto.penalizacion.descripcion }}
              </p>
            </div>

            <div class="mt-auto pt-4 text-center">
              <span class="text-[10px] font-black text-white">TOCA PARA VOLVER</span>
            </div>
          </div>
        </main>

        <Button
          v-if="modoMercado"
          @click="confirmarCompra"
          unstyled
          class="w-full bg-[#00E5E5] text-[#15151E] border-none py-4 z-20 shrink-0 flex items-center justify-center"
        >
          <i class="pi pi-money-bill font-bold text-sm mr-2"></i>
          <span class="text font-black uppercase">PUJAR</span>
        </Button>
      </div>
    </component>
  </div>
</template>
