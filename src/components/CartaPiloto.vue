<script setup>
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

// Props del componente
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

// Estado local
const mostrarInfo = ref(false)
const toast = useToast()
const confirm = useConfirm()

// Maneja la puja del piloto
const realizarPuja = () => {
  toast.add({
    severity: 'success',
    summary: 'Puja realizada',
    detail: `Has pujado por ${props.piloto.nombre} por ${props.piloto.precio}M`,
    life: 3000,
  })
}

// Función para confirmar la compra (puede ser llamada desde realizarPuja o un botón específico)
const confirmarCompra = () => {
  confirm.require({
    message: `¿Estás seguro de que quieres pujar por ${props.piloto.nombre} por ${props.piloto.precio}M?`,
    header: 'Confirmar Puja',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, pujar',
    rejectLabel: 'No, cancelar',
    accept() {
      realizarPuja()
    },
  })
}

// Alterna la visibilidad de información
const toggleInfo = () => {
  mostrarInfo.value = !mostrarInfo.value
}
</script>

<template>
  <div class="flex flex-col gap-2 h-full w-full">
    <!-- Tarjeta principal -->
    <div
      class="flex flex-col border border-zinc-800 rounded-xl overflow-hidden relative flex-1 min-h-0"
    >
      <!-- Header con nombre y precio -->
      <div class="shrink-0 flex justify-between items-center p-2 bg-red-800 z-20">
        <span class="text-xs font-black text-white uppercase truncate pr-2">
          {{ props.piloto.nombre }}
        </span>
        <span class="text-xs font-black">{{ props.piloto.precio }}M</span>
      </div>

      <!-- Imagen y contenido principal -->
      <div class="relative flex-1 min-h-0 w-full cursor-pointer" @click="toggleInfo">
        <img
          :src="props.piloto.imagen || 'https://via.placeholder.com/150'"
          class="absolute inset-0 w-full h-full object-cover object-center transition-all duration-300"
          :class="mostrarInfo ? 'opacity-20' : 'opacity-90'"
          :alt="props.piloto.nombre"
        />

        <!-- Badge del tier -->
        <span
          v-if="props.piloto.tier && !mostrarInfo"
          class="absolute top-2 left-2 text-white text-[10px] font-black px-2 py-1 rounded z-20"
          :class="{
            'bg-gray-500': props.piloto.tier === 'Q1',
            'bg-red-500': props.piloto.tier === 'Q2',
            'bg-purple-700': props.piloto.tier === 'Q3',
            'bg-black/80': true,
          }"
        >
          {{ props.piloto.tier }}
        </span>

        <!-- CTA para ver detalles -->
        <div
          v-if="!mostrarInfo"
          class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4"
        >
          <span class="text-xs font-black text-zinc-200 animate-pulse">
            TOCA PARA VER LOS DETALLES
          </span>
        </div>

        <!-- Panel de información -->
        <div
          v-if="mostrarInfo"
          class="p-4 flex flex-col justify-center text-center items-center h-full bg-zinc-950/60"
        >
          <h4 class="text-xs font-black text-zinc-300 border-b border-zinc-200 pb-1 mb-2">
            HABILIDADES
          </h4>
          <p class="text-xs text-zinc-200">
            {{
              props.piloto.descripcion ||
              `Piloto de parrilla. Otorga puntos regulares y bonus (${props.piloto.tier}).`
            }}
          </p>
        </div>
      </div>

      <!-- Botón de puja (solo en modo mercado) -->
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
