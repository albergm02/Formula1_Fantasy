<script setup>
import { ref, computed } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import Dialog from 'primevue/dialog'

const mostrarDetalles = ref(false)

const props = defineProps({
  potenciador: {
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

const etiquetasMejora = computed(() => {
  const mejoras = props.potenciador.mejoras
  if (!mejoras) return []
  return Object.entries(mejoras)
    .filter(([, valor]) => valor !== 0)
    .map(([atributo, valor]) => ({
      atributo,
      valor,
      signo: valor > 0 ? '+' : '',
      color: valor > 0 ? 'text-emerald-400' : 'text-red-400',
    }))
})

const confirmarCompra = () => {
  confirmar.require({
    message: `Pujar por ${props.potenciador.nombre} por ${props.potenciador.precio}M?`,
    header: 'Confirmar Puja',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, pujar',
    rejectLabel: 'No, cancelar',
    accept() {
      emit('fichar', props.potenciador)
    },
  })
}
</script>

<template>
  <div class="w-full h-[120px]">
    <div class="w-full h-full overflow-hidden border border-zinc-700 bg-black">
      <div class="relative w-full h-full overflow-hidden">

        <!-- Imagen de fondo completa, desplazada a la derecha -->
        <img v-if="props.potenciador.imagen" :src="props.potenciador.imagen" :alt="props.potenciador.nombre"
          class="absolute inset-0 w-full h-full object-cover" style="object-position: 65% center;" />

        <!-- Overlay de info (lado derecho) -->
        <div class="absolute inset-y-0 right-0 w-[70%] flex flex-col justify-between p-3">
          <!-- Header: nombre + precio -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex flex-col min-w-0">
              <span class="text-sm font-black text-white uppercase leading-tight truncate drop-shadow-md">
                {{ props.potenciador.nombre }}
              </span>
              <span class="text-xs text-zinc-300 uppercase font-bold">POTENCIADOR</span>
            </div>
            <span v-if="modoMercado"
              class="shrink-0 px-2 py-1 text-sm font-black text-[#D4A843] bg-black/50 border border-white/50">
              {{ Number(props.potenciador.precio).toFixed(2) }}M
            </span>
          </div>

          <!-- Etiquetas de mejora -->
          <div class="flex flex-wrap gap-1 my-1">
            <span v-for="m in etiquetasMejora" :key="m.atributo"
              class="px-1.5 py-0.5 text-[8px] font-black uppercase bg-black/80 border border-zinc-700" :class="m.color">
              {{ m.signo }}{{ m.valor }} {{ m.atributo.slice(0, 3) }}
            </span>
          </div>

          <!-- Botones: Detalles + Pujar -->
          <div v-if="modoMercado" class="flex gap-2">
            <button @click="mostrarDetalles = true"
              class="py-2.5 px-3 flex items-center justify-center bg-black/50 border border-white/50 cursor-pointer transition-all hover:bg-black/80 active:scale-[0.98]">
              <i class="pi pi-eye text-white text-xs"></i>
            </button>
            <button @click="confirmarCompra"
              class="flex-1 py-2.5 flex items-center justify-center bg-black/50 border border-white/50 cursor-pointer transition-all hover:bg-black/80 active:scale-[0.98]">
              <i class="mr-2 text-xs text-white pi pi-money-bill"></i>
              <span class="text-white text-[10px] font-black uppercase tracking-widest drop-shadow-sm">PUJAR</span>
            </button>
          </div>

          <!-- Boton detalles fuera de mercado -->
          <button v-else @click="mostrarDetalles = true"
            class="w-full py-2.5 flex items-center justify-center bg-black/50 border border-white/50 cursor-pointer transition-all hover:bg-black/80 active:scale-[0.98]">
            <i class="pi pi-eye text-white text-xs mr-2"></i>
            <span class="text-white text-[10px] font-black uppercase tracking-widest">DETALLES</span>
          </button>
        </div>

      </div>
    </div>

    <!-- Modal de detalles -->
    <Dialog v-model:visible="mostrarDetalles" :header="props.potenciador.nombre" modal
      :headerStyle="{ backgroundColor: '#1A1A1F', color: 'white', borderBottom: '1px solid #2A2A32' }"
      :contentStyle="{ backgroundColor: '#1A1A1F', padding: '1.5rem' }"
      :style="{ width: '90vw', maxWidth: '400px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }">
      <div class="space-y-3">

        <!-- Descripcion -->
        <div class="px-3 py-2.5 bg-zinc-800 border border-zinc-700">
          <p class="mt-1.5 text-xs text-zinc-300">
            {{ props.potenciador.descripcion }}
          </p>
        </div>

        <!-- Mejoras detalladas -->
        <div v-if="etiquetasMejora.length" class="px-3 py-2.5 bg-zinc-800 border border-zinc-700">
          <p class="text-sm font-black text-sky-400 uppercase leading-tight mb-2">Mejoras de Atributos</p>
          <div class="space-y-2">
            <div v-for="m in etiquetasMejora" :key="m.atributo" class="flex justify-between items-center">
              <span class="text-xs text-zinc-300 uppercase">{{ m.atributo }}</span>
              <span class="text-sm font-black" :class="m.color">{{ m.signo }}{{ m.valor }}</span>
            </div>
          </div>
        </div>

      </div>
    </Dialog>
  </div>
</template>
