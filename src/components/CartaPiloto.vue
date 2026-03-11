<script setup>
import { ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'

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

// Igual que CartaCoche: avisamos al padre
const emit = defineEmits(['fichar'])

const mostrarInfo = ref(false)
const confirm = useConfirm()

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
  <div class="flex flex-col gap-2 h-full w-full min-h-[400px]">
    <div class="flex flex-col border border-[#2e2e38] rounded-xl overflow-hidden relative flex-1 min-h-0 bg-[#15151e]">
      <div class="shrink-0 flex justify-between items-center p-3 bg-[#15151e] z-20 border-b border-[#2e2e38]">
        <span class="text-xs font-black text-white uppercase truncate pr-2">
          {{ props.piloto.nombre }}
        </span>
        <span class="text-xs font-black text-[#10b981]">{{ props.piloto.precio }}M</span>
      </div>

      <div class="relative flex-1 min-h-0 w-full cursor-pointer touch-manipulation select-none"
        @click="mostrarInfo = !mostrarInfo">
        <img :src="props.piloto.imagen || 'https://via.placeholder.com/150'"
          class="absolute inset-0 w-full h-full object-cover object-center"
          :class="mostrarInfo ? 'opacity-20' : 'opacity-90'" :alt="props.piloto.nombre" />

        <span v-show="props.piloto.tier && !mostrarInfo"
          class="absolute top-2 left-2 text-[10px] font-black px-2 py-1 rounded z-20 border bg-[#15151e]/80 backdrop-blur-sm"
          :class="{
            'text-[#8a8a9d] border-[#8a8a9d]/30': props.piloto.tier === 'Q1',
            'text-[#e10600] border-[#e10600]/30': props.piloto.tier === 'Q2',
            'text-purple-400 border-purple-400/30': props.piloto.tier === 'Q3',
          }">
          {{ props.piloto.tier }}
        </span>

        <div v-show="!mostrarInfo"
          class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#15151e] to-transparent p-4 flex justify-center">
          <span class="text-[10px] font-black text-white animate-pulse">
            TOCA PARA VER DETALLES
          </span>
        </div>

        <div v-show="mostrarInfo"
          class="absolute inset-0 p-4 flex flex-col justify-center text-center items-center h-full bg-[#15151e]/80 backdrop-blur-sm">
          <h4 class="text-xs font-black text-white border-b border-[#2e2e38] pb-1 mb-2">
            HABILIDADES
          </h4>
          <p class="text-xs text-[#8a8a9d] leading-relaxed">
            {{
              props.piloto.descripcion ||
              `Piloto de parrilla. Otorga puntos regulares y bonus (${props.piloto.tier}).`
            }}
          </p>
        </div>
      </div>

      <button v-if="modoMercado" @click="confirmarCompra"
        class="shrink-0 w-full bg-[#2e2e38] text-white py-3 flex items-center justify-center gap-2 touch-manipulation hover:bg-[#e10600] group transition-colors border-t border-[#2e2e38]">
        <i class="pi pi-cart-plus text-xs text-[#10b981] group-hover:text-white transition-colors"></i>
        <span class="text-xs font-black text-[#10b981] group-hover:text-white transition-colors">FICHAR</span>
      </button>
    </div>
  </div>
</template>