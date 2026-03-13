<script setup>
import { ref, computed } from 'vue'
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

/* Emit: Se emite el evento 'fichar' con el piloto seleccionado cuando el usuario confirma la compra en modo mercado. */
const emit = defineEmits(['fichar'])

const mostrarInfo = ref(false)
const confirm = useConfirm()

/* PRINCIPIO VUE: Usamos una propiedad computada para determinar las clases dinámicas.
   Esto mantiene el template limpio y concentra la lógica de negocio en el script. */
const colorBordeDinamico = computed(() => {
  const nivel = props.piloto.tier

  if (nivel === 'Q3' || nivel === 'leyenda') {
    return 'border-amber-400'
  } else if (nivel === 'Q2' || nivel === 'avanzado') {
    return 'border-fuchsia-500'
  } else {
    return 'border-zinc-800'
  }
})

const confirmarCompra = () => {
  confirm.require({
    message: `¿Estás seguro de que quieres fichar a ${props.piloto.nombre} por ${props.piloto.precio}M?`,
    header: 'Confirmar Fichaje',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, fichar',
    rejectLabel: 'No, cancelar',
    /* Emitimos el evento 'fichar' con el objeto del piloto como payload para que 
    el componente padre pueda manejar la lógica de compra. */
    accept() {
      emit('fichar', props.piloto)
    },
  })
}
</script>

<template>
  <div class="flex flex-col h-full w-full overflow-hidden rounded-xl border bg-[#15151E] transition-colors aspect-[3/4]"
    :class="colorBordeDinamico">

    <header class="flex justify-between items-center p-3 bg-[#15151E] border-b z-20 shrink-0"
      :class="colorBordeDinamico">
      <span class="text-xs font-black text-white">
        {{ props.piloto.nombre.toUpperCase() }}
      </span>
      <span class="text-xs font-black text-emerald-500">{{ props.piloto.precio }}M</span>
    </header>

    <main
      class="relative flex-1 w-full cursor-pointer touch-manipulation select-none bg-gradient-to-t from-black via-zinc-900 to-zinc-800"
      @click="mostrarInfo = !mostrarInfo">

      <img :src="props.piloto.imagen"
        class="absolute w-full h-full object-cover object-top z-10 transition-transform hover:scale-105" />

      <div v-show="!mostrarInfo" class="absolute bottom-4 left-0 w-full text-center z-20">
        <span
          class="text-[10px] font-black text-white/80 bg-black/60 px-3 py-1 rounded-full animate-pulse tracking-widest backdrop-blur-sm">
          TOCA PARA VER DETALLES
        </span>
      </div>

      <div v-show="mostrarInfo"
        class="absolute inset-0 p-8 flex flex-col justify-center text-center bg-[#15151E]/95 z-30 backdrop-blur-sm">
        <h4 class="text-xs font-black border-b border-zinc-700 text-white pb-2 mb-3 tracking-widest">HABILIDADES</h4>
        <p class="text-xs text-zinc-300 leading-relaxed">
          {{ props.piloto.descripcion || `Piloto de parrilla. Otorga puntos regulares y bonus.` }}
        </p>
      </div>

    </main>

    <button v-if="modoMercado" @click="confirmarCompra"
      class="shrink-0 w-full bg-[#15151E] border-t border-zinc-800 text-white py-3 group transition-colors cursor-pointer hover:bg-zinc-900 z-20">
      <i class="pi pi-cart-plus text-xs text-emerald-500 group-hover:text-emerald-400 transition-colors mr-2"></i>
      <span class="text-xs font-black text-emerald-500 group-hover:text-emerald-400 transition-colors">FICHAR</span>
    </button>

  </div>
</template>