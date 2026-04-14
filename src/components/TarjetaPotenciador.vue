<script setup>
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'

const mostrarDetalles = ref(false)
const mostrarPuja = ref(false)
const cantidadPuja = ref(null)

const props = defineProps({
  potenciador: {
    type: Object,
    required: true,
  },
  modoMercado: {
    type: Boolean,
    default: false,
  },
  miPuja: {
    type: Number,
    default: null,
  },
  mejorPuja: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['pujar'])

const etiquetasMejora = computed(() => {
  const mejoras = props.potenciador.mejoras
  if (!mejoras) return []
  const coloresAtributo = {
    ritmo: '#38bdf8',
    consistencia: '#22c55e',
    adaptabilidad: '#a78bfa',
    agresividad: '#ef4444',
    gestion: '#f59e0b',
  }
  return Object.entries(mejoras)
    .filter(([, valor]) => valor !== 0)
    .map(([atributo, valor]) => ({
      atributo,
      valor,
      signo: valor > 0 ? '+' : '',
      color: valor > 0 ? 'text-emerald-400' : 'text-red-400',
      colorAtributo: coloresAtributo[atributo] || '#a1a1aa',
    }))
})

const abrirPuja = () => {
  cantidadPuja.value = props.potenciador.precio
  mostrarPuja.value = true
}

const confirmarPuja = () => {
  emit('pujar', { carta: props.potenciador, cantidad: cantidadPuja.value })
  mostrarPuja.value = false
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
          <!-- Header: nombre + precio + puja máxima -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex flex-col min-w-0">
              <span class="text-sm font-black text-white uppercase leading-tight truncate drop-shadow-md">
                {{ props.potenciador.nombre }}
              </span>
              <span class="text-xs text-zinc-300 uppercase font-bold">POTENCIADOR</span>
            </div>
            <div v-if="modoMercado" class="flex items-center gap-1.5 shrink-0">
              <span v-if="mejorPuja > 0" class="px-1.5 py-0.5 text-[9px] font-bold text-amber-300 bg-black/60 border border-amber-500/40">
                <i class="pi pi-arrow-up text-[8px]"></i> {{ mejorPuja.toFixed(2) }}M
              </span>
              <span class="px-2 py-1 text-sm font-black text-[#D4A843] bg-black/50 border border-white/50">
                {{ Number(props.potenciador.precio).toFixed(2) }}M
              </span>
            </div>
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
            <button @click="abrirPuja"
              :class="miPuja ? 'border-amber-500 bg-amber-500/20' : 'border-white/50 bg-black/50'"
              class="flex-1 py-2.5 flex items-center justify-center cursor-pointer transition-all hover:bg-black/80 active:scale-[0.98] border">
              <i class="mr-2 text-xs text-white pi pi-money-bill"></i>
              <span v-if="miPuja" class="text-amber-300 text-[10px] font-black uppercase tracking-widest drop-shadow-sm">MI PUJA: {{ miPuja.toFixed(2) }}M</span>
              <span v-else class="text-white text-[10px] font-black uppercase tracking-widest drop-shadow-sm">PUJAR</span>
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
              <span class="text-xs font-bold uppercase" :style="{ color: m.colorAtributo }">{{ m.atributo }}</span>
              <span class="text-sm font-black" :class="m.color">{{ m.signo }}{{ m.valor }}</span>
            </div>
          </div>
        </div>

      </div>
    </Dialog>

    <!-- Dialog de puja -->
    <Dialog v-model:visible="mostrarPuja" header="Realizar Puja" modal
      :headerStyle="{ backgroundColor: '#1A1A1F', color: 'white', borderBottom: '1px solid #2A2A32' }"
      :contentStyle="{ backgroundColor: '#1A1A1F', padding: '1.5rem' }"
      :style="{ width: '90vw', maxWidth: '360px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }">
      <div class="space-y-4">
        <div class="text-center">
          <p class="text-white font-bold text-sm">{{ props.potenciador.nombre }}</p>
          <p class="text-zinc-400 text-xs mt-1">Precio base: <span class="text-[#D4A843] font-bold">{{ Number(props.potenciador.precio).toFixed(2) }}M</span></p>
          <p v-if="mejorPuja > 0" class="text-amber-400 text-xs mt-1">Puja más alta actual: <span class="font-bold">{{ mejorPuja.toFixed(2) }}M</span></p>
        </div>
        <div class="flex flex-col items-center gap-2">
          <label class="text-zinc-300 text-xs font-bold uppercase">Tu puja (M)</label>
          <InputNumber v-model="cantidadPuja" :min="Number(props.potenciador.precio)" :step="0.1" :minFractionDigits="2" :maxFractionDigits="2"
            inputClass="text-center text-white bg-zinc-800 border-zinc-600 w-32" />
        </div>
        <button @click="confirmarPuja"
          class="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-black uppercase text-xs tracking-widest cursor-pointer transition-all active:scale-[0.98]">
          CONFIRMAR PUJA
        </button>
      </div>
    </Dialog>
  </div>
</template>
