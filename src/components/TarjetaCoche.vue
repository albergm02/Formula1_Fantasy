<script setup>
import { ref } from 'vue'
import Dialog from 'primevue/dialog'

const mostrarDetalles = ref(false)
const mostrarPuja = ref(false)
const cantidadPuja = ref(null)

const props = defineProps({
  coche: {
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

const abrirPuja = () => {
  cantidadPuja.value = props.coche.precio
  mostrarPuja.value = true
}

const confirmarPuja = () => {
  emit('pujar', { carta: props.coche, cantidad: cantidadPuja.value })
  mostrarPuja.value = false
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

          <!-- Precio + puja máxima -->
          <div v-if="modoMercado" class="flex items-center justify-end gap-1.5 mb-1">
            <span v-if="mejorPuja > 0" class="px-1.5 py-0.5 text-[9px] font-bold text-amber-300 bg-black/60 border border-amber-500/40">
              <i class="pi pi-arrow-up text-[8px]"></i> {{ mejorPuja.toFixed(2) }}M
            </span>
            <span class="px-2 py-1 text-sm font-black text-[#D4A843] bg-black/50 border border-white/50">
              {{ Number(props.coche.precio).toFixed(2) }}M
            </span>
          </div>

          <!-- Botones: Detalles + Pujar -->
          <div v-if="modoMercado" class="flex gap-2">
            <button @click="mostrarDetalles = true"
              class="py-2.5 px-3 flex items-center justify-center bg-black/50 border border-white/50 cursor-pointer transition-all hover:bg-black/80 active:scale-[0.98]">
              <i class="pi pi-eye text-white text-xs"></i>
            </button>
            <button @click="abrirPuja"
              class="flex-1 py-2.5 flex items-center justify-center border cursor-pointer transition-all active:scale-[0.98]"
              :class="miPuja ? 'bg-amber-900/50 border-amber-500/60 hover:bg-amber-900/70' : 'bg-black/50 border-white/50 hover:bg-black/80'">
              <i class="mr-2 text-xs pi pi-money-bill" :class="miPuja ? 'text-amber-400' : 'text-white'"></i>
              <span class="text-[10px] font-black uppercase tracking-widest drop-shadow-sm" :class="miPuja ? 'text-amber-400' : 'text-white'">
                {{ miPuja ? `${miPuja.toFixed(2)}M` : 'PUJAR' }}
              </span>
            </button>
          </div>

          <!-- Botón detalles fuera de mercado -->
          <button v-else @click="mostrarDetalles = true"
            class="w-full py-2.5 flex items-center justify-center bg-black/50 border border-white/50 cursor-pointer transition-all hover:bg-black/80 active:scale-[0.98]">
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

    <!-- Dialog de puja -->
    <Dialog v-model:visible="mostrarPuja" header="Realizar Puja" modal
      :headerStyle="{ backgroundColor: '#1A1A1F', color: 'white', borderBottom: '1px solid #2A2A32' }"
      :contentStyle="{ backgroundColor: '#1A1A1F', padding: '1.5rem' }"
      :style="{ width: '90vw', maxWidth: '360px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }">
      <div class="space-y-4">
        <p class="text-sm text-zinc-300">
          Pujando por <strong class="text-white">{{ props.coche.nombre }}</strong>
        </p>
        <div class="flex items-center gap-2">
          <span class="text-xs text-zinc-400">Precio base:</span>
          <span class="text-sm font-black text-[#D4A843]">{{ props.coche.precio }}M</span>
        </div>
        <div v-if="mejorPuja > 0" class="flex items-center gap-2">
          <span class="text-xs text-zinc-400">Puja más alta:</span>
          <span class="text-sm font-black text-amber-400">{{ mejorPuja.toFixed(2) }}M</span>
        </div>
        <div>
          <label class="text-xs text-zinc-400 mb-1 block">Tu puja (M)</label>
          <input v-model.number="cantidadPuja" type="number" :min="props.coche.precio" step="0.1"
            class="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 text-white text-sm font-bold focus:border-amber-500 focus:outline-none" />
        </div>
        <button @click="confirmarPuja" :disabled="!cantidadPuja || cantidadPuja < props.coche.precio"
          class="w-full py-3 flex items-center justify-center bg-amber-600 hover:bg-amber-700 disabled:bg-zinc-700 disabled:text-zinc-500 border-none cursor-pointer transition-all text-white text-sm font-black uppercase tracking-widest">
          <i class="pi pi-money-bill mr-2"></i> CONFIRMAR PUJA
        </button>
      </div>
    </Dialog>
  </div>
</template>