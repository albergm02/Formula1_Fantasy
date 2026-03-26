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
  <div class="w-full h-[180px]">
    <div class="w-full h-full overflow-hidden border border-sky-400 bg-black">
      <!-- La imagen ES la carta. Todo se superpone encima -->
      <div class="relative w-full h-full overflow-hidden">

        <!-- Imagen de fondo completa -->
        <img v-if="props.piloto.imagen" :src="props.piloto.imagen" :alt="props.piloto.nombre"
          class="w-full h-full object-cover block" />

        <span class="absolute top-2 right-2 z-20 px-2 py-1 text-[8px] font-black uppercase bg-black text-sky-200 border border-sky-300">
          PILOTO
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
                <span class="text-xs text-zinc-300 uppercase font-bold">
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
            class="w-full py-2.5 flex items-center justify-center bg-black border border-white cursor-pointer transition-all hover:bg-zinc-900 active:scale-[0.98]">
            <i class="mr-2 text-xs text-white pi pi-money-bill"></i>
            <span class="text-white text-[10px] font-black uppercase tracking-widest drop-shadow-sm">PUJAR</span>
          </button>
        </div>

        <!-- Botón de visibilidad (posición fija en la carta) -->
        <button @click="mostrarDetalles = true"
          class="absolute bottom-3 left-3 z-20 p-2 bg-black border border-white cursor-pointer transition-all hover:bg-zinc-900 active:scale-90">
          <i class="pi pi-eye text-white text-base"></i>
        </button>

      </div>
    </div>

    <!-- Modal de detalles (fuera de la carta) -->
    <Dialog v-model:visible="mostrarDetalles" :header="props.piloto.nombre" modal
      :pt="{ root: { class: 'bg-zinc-900 border border-zinc-700 max-w-sm w-full' }, header: { class: 'bg-zinc-900 text-white font-black uppercase p-4 pb-2' }, content: { class: 'bg-zinc-900 p-4 pt-2' }, closeButton: { class: 'text-white hover:text-zinc-200' } }">
      <div class="space-y-3">
        <div v-if="props.piloto.reglasUsuario?.length" class="px-3 py-2.5 bg-zinc-800 border border-zinc-700">
          <p class="text-sm font-black text-sky-400 uppercase leading-tight">
            Reglas de puntuacion
          </p>
          <ul class="mt-2 space-y-1.5">
            <li v-for="(regla, indice) in props.piloto.reglasUsuario" :key="`${props.piloto.id}-regla-${indice}`"
              class="text-xs text-zinc-300 leading-relaxed">
              • {{ regla }}
            </li>
          </ul>
        </div>

        <!-- Habilidad 1 -->
        <div v-if="props.piloto.habilidad_1" class="px-3 py-2.5 bg-zinc-800 border border-zinc-700">
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
          class="px-3 py-2.5 bg-zinc-800 border border-zinc-700">
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
          class="px-3 py-2.5 bg-zinc-800 border border-zinc-700">
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
