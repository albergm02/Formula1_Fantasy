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

const emit = defineEmits(['pujar', 'eliminarPuja'])

const abrirPuja = () => {
  cantidadPuja.value = props.miPuja || props.coche.precio
  mostrarPuja.value = true
}

const confirmarPuja = () => {
  emit('pujar', { carta: props.coche, cantidad: cantidadPuja.value })
  mostrarPuja.value = false
}

const confirmarEliminarPuja = () => {
  emit('eliminarPuja', props.coche)
  mostrarPuja.value = false
}
</script>

<template>
  <div class="w-full h-[180px]">
    <div class="w-full h-full overflow-hidden border border-zinc-700 bg-black">
      <div class="relative w-full h-full overflow-hidden">

        <img v-if="props.coche.imagen" :src="props.coche.imagen" :alt="props.coche.nombre"
          class="w-full h-full object-cover block" />

        <!-- Badge precio (esquina superior derecha) -->
        <div v-if="modoMercado"
          class="absolute top-2 right-2 z-10 flex items-center gap-1 px-1.5 py-0.5 bg-black/70 border border-[#D4A843]/40">
          <span class="text-[10px] font-black text-[#D4A843]">{{ Number(props.coche.precio).toFixed(2) }}</span>
          <span class="text-[7px] text-zinc-400 uppercase font-bold">M</span>
        </div>

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

          <!-- Botones: Detalles + Pujar -->
          <div v-if="modoMercado" class="flex gap-2">
            <button @click="mostrarDetalles = true"
              class="py-2.5 px-3 flex items-center justify-center gap-1 bg-black/50 border border-white/50 cursor-pointer">
              <i class="pi pi-info-circle text-white text-xs"></i>
              <span class="text-white text-[9px] font-black uppercase">INFO</span>
            </button>
            <button @click="abrirPuja"
              class="flex-1 py-2.5 flex items-center justify-center bg-black/50 border border-white/50 cursor-pointer">
              <span class="text-[10px] font-black uppercase tracking-widest"
                :class="miPuja ? 'text-amber-400' : 'text-white'">
                {{ miPuja ? 'EDITAR PUJA' : 'PUJAR' }}
              </span>
            </button>
          </div>

          <!-- Botón detalles fuera de mercado -->
          <button v-else @click="mostrarDetalles = true"
            class="w-full py-2.5 flex items-center justify-center bg-black/50 border border-white/50 cursor-pointer">
            <i class="pi pi-info-circle text-white text-xs mr-2"></i>
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

        <!-- Puntos base por jornada -->
        <div class="px-3 py-3 bg-zinc-800 border border-zinc-700">
          <p class="text-[10px] text-zinc-400 uppercase font-bold tracking-widest mb-2">Puntos por jornada</p>
          <div class="flex items-center gap-3">
            <span class="text-4xl font-black text-white leading-none">{{ props.coche.puntos }}</span>
            <p class="text-xs text-zinc-300 leading-relaxed">
              Este chasis aporta <strong class="text-white">{{ props.coche.puntos }} puntos base</strong> a tu equipo en
              cada Gran Premio.
            </p>
          </div>
        </div>

        <!-- Sinergia de equipo -->
        <div v-if="props.coche.habilidad" class="px-3 py-3 bg-zinc-800 border border-zinc-700">
          <div class="flex items-center gap-2 mb-2">
            <i class="pi pi-link text-emerald-400 text-xs"></i>
            <p class="text-xs font-black text-emerald-400 uppercase tracking-wide leading-tight">
              {{ props.coche.habilidad.nombre }}
            </p>
            <span
              class="ml-auto px-2 py-0.5 bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 text-[10px] font-black">
              +{{ props.coche.habilidad.puntos }} PTS
            </span>
          </div>
          <p class="text-xs text-zinc-300 leading-relaxed">
            Si alineas pilotos del mismo equipo que este chasis, recibirás
            <strong class="text-emerald-300">+{{ props.coche.habilidad.puntos }} puntos extra</strong>
            en cada Gran Premio.
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
          class="w-full py-3 flex items-center justify-center bg-amber-600 disabled:bg-zinc-700 disabled:text-zinc-500 border-none rounded-sm cursor-pointer text-white text-sm font-black uppercase tracking-widest">
          <i class="pi pi-money-bill mr-2"></i> CONFIRMAR PUJA
        </button>
        <button v-if="miPuja" @click="confirmarEliminarPuja"
          class="w-full py-3 flex items-center justify-center bg-red-900/40 border border-red-500/50 rounded-sm cursor-pointer text-red-400 text-sm font-black uppercase tracking-widest">
          <i class="pi pi-trash mr-2"></i> ELIMINAR PUJA
        </button>
      </div>
    </Dialog>
  </div>
</template>