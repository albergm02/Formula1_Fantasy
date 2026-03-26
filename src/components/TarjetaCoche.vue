<script setup>
import { ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import Dialog from 'primevue/dialog'

const mostrarDetalles = ref(false)

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
const confirmar = useConfirm()

const confirmarCompra = () => {
  confirmar.require({
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
  <div class="w-full">
    <div class="w-full rounded-xl overflow-hidden border border-zinc-800">
      <div class="relative w-full overflow-hidden rounded-xl">

        <img v-if="props.coche.imagen" :src="props.coche.imagen" :alt="props.coche.nombre"
          class="w-full h-auto block" />

        <div class="absolute inset-y-0 right-0 w-[55%] flex flex-col justify-between p-3">

          <div>
            <div class="flex flex-col min-w-0">
              <span class="text-sm font-black text-white uppercase leading-tight truncate drop-shadow-md">
                {{ props.coche.nombre }}
              </span>
              <span class="text-xs text-white/60 uppercase font-bold drop-shadow-sm">
                CHASIS
              </span>
            </div>
          </div>

          <div class="flex-1"></div>

          <div v-if="modoMercado" class="flex justify-end mb-1">
            <span class="text-sm font-black text-[#D4A843] drop-shadow-md">
              {{ props.coche.precio }}M
            </span>
          </div>

          <button v-if="modoMercado" @click="confirmarCompra"
            class="w-full py-2.5 flex items-center justify-center rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 cursor-pointer transition-all hover:bg-black/70 hover:border-white/20 active:scale-[0.98]">
            <i class="mr-2 text-xs text-white pi pi-money-bill"></i>
            <span class="text-white text-[10px] font-black uppercase tracking-widest drop-shadow-sm">PUJAR</span>
          </button>
        </div>

        <button @click="mostrarDetalles = true"
          class="absolute bottom-3 left-3 z-20 p-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/15 cursor-pointer transition-all hover:bg-black/70 hover:border-white/30 active:scale-90">
          <i class="pi pi-eye text-white/90 text-base"></i>
        </button>

      </div>
    </div>

    <!-- Modal de detalles -->
    <Dialog v-model:visible="mostrarDetalles" :header="props.coche.nombre" modal
      :pt="{ root: { class: 'bg-zinc-900 border border-zinc-700 rounded-xl max-w-sm w-full' }, header: { class: 'bg-zinc-900 text-white font-black uppercase p-4 pb-2' }, content: { class: 'bg-zinc-900 p-4 pt-2' }, closeButton: { class: 'text-white/60 hover:text-white' } }">
      <div class="space-y-3">
        <div v-if="props.coche.habilidad" class="px-3 py-2.5 rounded-lg bg-white/5 border border-zinc-700">
          <p class="text-sm font-black text-emerald-400 uppercase leading-tight">
            {{ props.coche.habilidad.nombre }}
            <span class="text-white">+{{ props.coche.habilidad.puntos }}</span>
          </p>
          <p class="mt-1.5 text-xs text-zinc-300 leading-relaxed">
            {{ props.coche.habilidad.descripcion }}
          </p>
        </div>
      </div>
    </Dialog>
  </div>
</template>