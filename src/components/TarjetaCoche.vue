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
  <div class="w-full h-[180px]">
    <div class="w-full h-full overflow-hidden border border-zinc-700 bg-black">
      <div class="relative w-full h-full overflow-hidden">

        <img v-if="props.coche.imagen" :src="props.coche.imagen" :alt="props.coche.nombre"
          class="w-full h-full object-cover block" />

        <div class="absolute inset-y-0 right-0 w-[55%] flex flex-col justify-between p-3">

          <div>
            <div class="flex flex-col min-w-0">
              <span class="text-sm font-black text-white uppercase leading-tight truncate drop-shadow-md">
                {{ props.coche.nombre }}
              </span>
              <span class="text-xs text-zinc-300 uppercase font-bold">
                CHASIS
              </span>
            </div>
          </div>

          <div class="flex-1"></div>

          <!-- Precio -->
          <div v-if="modoMercado" class="flex justify-end mb-1">
            <span class="px-2 py-1 text-sm font-black text-[#D4A843] bg-black border border-white">
              {{ props.coche.precio }}M
            </span>
          </div>

          <!-- Botones: Detalles + Pujar -->
          <div v-if="modoMercado" class="flex gap-2">
            <button @click="mostrarDetalles = true"
              class="py-2.5 px-3 flex items-center justify-center bg-black border border-white cursor-pointer transition-all hover:bg-zinc-900 active:scale-[0.98]">
              <i class="pi pi-eye text-white text-xs"></i>
            </button>
            <button @click="confirmarCompra"
              class="flex-1 py-2.5 flex items-center justify-center bg-black border border-white cursor-pointer transition-all hover:bg-zinc-900 active:scale-[0.98]">
              <i class="mr-2 text-xs text-white pi pi-money-bill"></i>
              <span class="text-white text-[10px] font-black uppercase tracking-widest drop-shadow-sm">PUJAR</span>
            </button>
          </div>

          <!-- Botón detalles fuera de mercado -->
          <button v-else @click="mostrarDetalles = true"
            class="w-full py-2.5 flex items-center justify-center bg-black border border-white cursor-pointer transition-all hover:bg-zinc-900 active:scale-[0.98]">
            <i class="pi pi-eye text-white text-xs mr-2"></i>
            <span class="text-white text-[10px] font-black uppercase tracking-widest">DETALLES</span>
          </button>
        </div>

      </div>
    </div>

    <!-- Modal de detalles -->
    <Dialog v-model:visible="mostrarDetalles" :header="props.coche.nombre" modal
      :headerStyle="{ backgroundColor: '#1A1A1F', color: 'white', borderBottom: '1px solid #2A2A32' }"
      :contentStyle="{ backgroundColor: '#1A1A1F', padding: '1.5rem' }"
      :style="{ width: '90vw', maxWidth: '400px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }">
      <div class="space-y-3">
        <div v-if="props.coche.reglasUsuario?.length" class="px-3 py-2.5 bg-zinc-800 border border-zinc-700">
          <p class="text-sm font-black text-sky-400 uppercase leading-tight">
            Reglas de puntuacion
          </p>
          <ul class="mt-2 space-y-1.5">
            <li v-for="(regla, indice) in props.coche.reglasUsuario" :key="`${props.coche.id}-regla-${indice}`"
              class="text-xs text-zinc-300 leading-relaxed">
              • {{ regla }}
            </li>
          </ul>
        </div>

        <div v-if="props.coche.habilidad" class="px-3 py-2.5 bg-zinc-800 border border-zinc-700">
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