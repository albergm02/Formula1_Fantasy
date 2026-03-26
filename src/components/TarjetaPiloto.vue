<script setup>
import { ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import Dialog from 'primevue/dialog'

const mostrarDetalles = ref(false)

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
const confirmar = useConfirm()

const confirmarCompra = () => {
  confirmar.require({
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
  <div class="w-full">
    <div :class="[
      'w-full rounded-xl overflow-hidden border',
      props.piloto.tier === 2 ? 'border-[#D4A843]/60' : 'border-zinc-800'
    ]">
      <!-- La imagen ES la carta. Todo se superpone encima -->
      <div class="relative w-full overflow-hidden rounded-xl">

        <!-- Imagen de fondo completa -->
        <img v-if="props.piloto.imagen" :src="props.piloto.imagen" :alt="props.piloto.nombre"
          class="w-full h-auto block" />

        <!-- Badge EN RACHA (esquina superior izquierda) -->
        <span v-if="props.piloto.tier === 2"
          class="absolute top-2 left-2 z-20 px-2 py-1 text-[8px] font-black text-[#D4A843] uppercase bg-black/50 rounded backdrop-blur-sm border border-[#D4A843]/40">
          EN RACHA
        </span>

        <!-- Overlay de info (lado derecho, siempre visible) -->
        <div class="absolute inset-y-0 right-0 w-[55%] flex flex-col justify-between p-3">

          <!-- Header: nombre + equipo + precio -->
          <div>
            <div class="flex justify-between items-start">
              <div class="flex flex-col min-w-0">
                <span class="text-sm font-black text-white uppercase leading-tight truncate drop-shadow-md">
                  {{ props.piloto.nombre }}
                </span>
                <span class="text-xs text-white/60 uppercase font-bold drop-shadow-sm">
                  {{ props.piloto.equipo }}
                </span>
              </div>

            </div>
          </div>

          <div class="flex-1"></div>

          <!-- Precio justo encima del botón -->
          <div v-if="modoMercado" class="flex justify-end mb-1">
            <span class="text-sm font-black text-[#D4A843] drop-shadow-md">
              {{ props.piloto.precio }}M
            </span>
          </div>

          <!-- Boton PUJAR (pegado abajo) -->
          <button v-if="modoMercado" @click="confirmarCompra"
            class="w-full py-2.5 flex items-center justify-center rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 cursor-pointer transition-all hover:bg-black/70 hover:border-white/20 active:scale-[0.98]">
            <i class="mr-2 text-xs text-white pi pi-money-bill"></i>
            <span class="text-white text-[10px] font-black uppercase tracking-widest drop-shadow-sm">PUJAR</span>
          </button>
        </div>

        <!-- Botón de visibilidad (posición fija en la carta) -->
        <button @click="mostrarDetalles = true"
          class="absolute bottom-3 left-3 z-20 p-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/15 cursor-pointer transition-all hover:bg-black/70 hover:border-white/30 active:scale-90">
          <i class="pi pi-eye text-white/90 text-base"></i>
        </button>

      </div>
    </div>

    <!-- Modal de detalles (fuera de la carta) -->
    <Dialog v-model:visible="mostrarDetalles" :header="props.piloto.nombre" modal
      :pt="{ root: { class: 'bg-zinc-900 border border-zinc-700 rounded-xl max-w-sm w-full' }, header: { class: 'bg-zinc-900 text-white font-black uppercase p-4 pb-2' }, content: { class: 'bg-zinc-900 p-4 pt-2' }, closeButton: { class: 'text-white/60 hover:text-white' } }">
      <div class="space-y-3">
        <!-- Habilidad 1 -->
        <div v-if="props.piloto.habilidad_1" class="px-3 py-2.5 rounded-lg bg-white/5 border border-zinc-700">
          <p class="text-sm font-black text-emerald-400 uppercase leading-tight">
            {{ props.piloto.habilidad_1.nombre }}
            <span class="text-white">+{{ props.piloto.habilidad_1.puntos }}</span>
          </p>
          <p class="mt-1.5 text-xs text-zinc-300 leading-relaxed">
            {{ props.piloto.habilidad_1.descripcion }}
          </p>
        </div>

        <!-- Habilidad 2 (solo Tier 2) -->
        <div v-if="props.piloto.tier === 2 && props.piloto.habilidad_2"
          class="px-3 py-2.5 rounded-lg bg-white/5 border border-zinc-700">
          <p class="text-sm font-black text-[#D4A843] uppercase leading-tight">
            {{ props.piloto.habilidad_2.nombre }}
            <span class="text-white">+{{ props.piloto.habilidad_2.puntos }}</span>
          </p>
          <p class="mt-1.5 text-xs text-zinc-300 leading-relaxed">
            {{ props.piloto.habilidad_2.descripcion }}
          </p>
        </div>

        <!-- Penalizacion (solo Tier 2) -->
        <div v-if="props.piloto.tier === 2 && props.piloto.penalizacion"
          class="px-3 py-2.5 rounded-lg bg-white/5 border border-zinc-700">
          <p class="text-sm font-black text-red-500 uppercase leading-tight">
            {{ props.piloto.penalizacion.nombre }}
            <span class="text-white">{{ props.piloto.penalizacion.puntos }}</span>
          </p>
          <p class="mt-1.5 text-xs text-zinc-300 leading-relaxed">
            {{ props.piloto.penalizacion.descripcion }}
          </p>
        </div>
      </div>
    </Dialog>
  </div>
</template>
