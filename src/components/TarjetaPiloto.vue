<script setup>
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import { perfilesPuntuacion } from '@/data/perfilesPuntuacion'

const mostrarDetalles = ref(false)
const mostrarPuja = ref(false)
const cantidadPuja = ref(null)

const props = defineProps({
  piloto: {
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
  totalPujas: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['pujar', 'eliminarPuja'])

const reglasVariante = computed(() => {
  const clave = props.piloto.perfilPuntuacion || props.piloto.variante
  return perfilesPuntuacion[clave]?.reglasUsuario || props.piloto.reglasUsuario || []
})

const barrasAtributos = computed(() => {
  const a = props.piloto.atributos
  const p = props.piloto.pesos
  if (!a || !p) return []
  return [
    { nombre: 'Ritmo', valor: a.ritmo, peso: p.ritmo, color: '#38bdf8' },
    { nombre: 'Consistencia', valor: a.consistencia, peso: p.consistencia, color: '#22c55e' },
    { nombre: 'Adaptabilidad', valor: a.adaptabilidad, peso: p.adaptabilidad, color: '#a78bfa' },
    { nombre: 'Agresividad', valor: a.agresividad, peso: p.agresividad, color: '#ef4444' },
    { nombre: 'Gestión', valor: a.gestion, peso: p.gestion, color: '#f59e0b' },
  ]
})

const abrirPuja = () => {
  cantidadPuja.value = props.miPuja || props.piloto.precio
  mostrarPuja.value = true
}

const confirmarPuja = () => {
  emit('pujar', { carta: props.piloto, cantidad: cantidadPuja.value })
  mostrarPuja.value = false
}

const confirmarEliminarPuja = () => {
  emit('eliminarPuja', props.piloto)
  mostrarPuja.value = false
}
</script>

<template>
  <div class="w-full h-[160px]">
    <div class="w-full h-full overflow-hidden border border-zinc-700 bg-black">
      <div class="relative w-full h-full overflow-hidden">

        <!-- Imagen de fondo completa -->
        <img v-if="props.piloto.imagen" :src="props.piloto.imagen" :alt="props.piloto.nombre"
          class="w-full h-full object-cover block" />

        <!-- Pujas arriba a la derecha -->
        <div v-if="modoMercado && totalPujas > 0"
          class="absolute top-2 right-2 z-10 flex items-center gap-1 px-1.5 py-0.5 bg-black/70 border border-zinc-500/40">
          <i class="pi pi-users text-[8px] text-zinc-300"></i>
          <span class="text-[10px] font-black text-zinc-300">{{ totalPujas }}</span>
        </div>

        <!-- Overlay de info (lado derecho, siempre visible) -->
        <div class="absolute inset-y-0 right-0 w-[55%] flex flex-col justify-between p-3">

          <!-- Header: nombre + equipo -->
          <div>
            <div class="flex flex-col min-w-0">
              <span class="text-sm font-black text-white uppercase">
                {{ props.piloto.nombre }}
              </span>
              <span class="text-xs text-zinc-300 uppercase font-bold">
                {{ props.piloto.equipo }}
              </span>
            </div>
          </div>

          <!-- Etiquetas de precio y clase + botones -->
          <div class="flex flex-col gap-1.5">
            <!-- Precio y clase encima del botón -->
            <div class="flex items-center justify-between gap-1">
              <div v-if="modoMercado" class="flex items-center gap-1 px-1.5 py-0.5 bg-black/70">
                <span class="text-[10px] font-black text-emerald-400">{{ Number(props.piloto.precio).toFixed(2) }}
                  M</span>
              </div>
              <span
                class="px-2 py-0.5 flex items-center gap-1 text-[8px] font-black uppercase bg-black/70 border ml-auto"
                :style="{ color: props.piloto.colorVariante, borderColor: props.piloto.colorVariante }">
                <i class="pi" :class="props.piloto.iconoVariante"></i>
                {{ props.piloto.variante }}
              </span>
            </div>

            <!-- Botones: Info + Pujar -->
            <div v-if="modoMercado" class="flex gap-2">
              <button @click="mostrarDetalles = true"
                class="py-2.5 px-3 flex items-center justify-center gap-1 bg-black/50 border border-white/50 cursor-pointer">
                <i class="pi pi-info-circle text-white text-xs"></i>
                <span class="text-white text-[9px] font-black uppercase">INFO</span>
              </button>
              <button @click="abrirPuja"
                class="flex-1 py-2.5 flex items-center justify-center bg-black/50 border border-white/50 cursor-pointer">
                <span class="text-[10px] font-black uppercase tracking-widest"
                  :class="miPuja != null ? 'text-amber-400' : 'text-white'">
                  {{ miPuja != null ? 'EDITAR PUJA' : 'PUJAR' }}
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
    </div>

    <!-- Modal de detalles -->
    <Dialog v-model:visible="mostrarDetalles" :header="props.piloto.nombre" modal
      :style="{ width: '90vw', maxWidth: '400px' }">
      <div class="space-y-3">

        <!-- Puntuacion ponderada -->
        <div class="px-3 py-2.5 bg-zinc-800 border border-zinc-700 flex items-center justify-between">
          <p class="text-sm font-black text-white uppercase">Puntuacion Base</p>
          <span class="text-lg font-black" :style="{ color: props.piloto.colorVariante }">
            {{ props.piloto.puntuacionBase }}
          </span>
        </div>

        <!-- Barras de atributos -->
        <div class="px-3 py-2.5 bg-zinc-800 border border-zinc-700 space-y-2">
          <p class="text-sm font-black text-sky-400 uppercase leading-tight mb-2">Atributos del piloto</p>
          <div v-for="barra in barrasAtributos" :key="barra.nombre" class="space-y-0.5">
            <div class="flex justify-between items-center">
              <span class="text-[10px] font-bold text-zinc-300 uppercase">{{ barra.nombre }}</span>
              <span class="text-[10px] font-black" :class="barra.peso > 0 ? 'text-white' : 'text-zinc-600'">{{
                barra.valor }} <span :class="barra.peso > 0 ? 'text-zinc-500' : 'text-red-500'">× {{
                  barra.peso }}</span></span>
            </div>
            <div class="w-full h-1.5 bg-zinc-700 overflow-hidden">
              <div class="h-full"
                :style="{ width: `${barra.valor}%`, backgroundColor: barra.color, opacity: barra.peso > 0 ? 0.4 : 0.1 }">
              </div>
            </div>
          </div>
        </div>

        <!-- Reglas de la variante -->
        <div v-if="reglasVariante.length" class="px-3 py-2.5 bg-zinc-800 border border-zinc-700">
          <p class="text-sm font-black uppercase leading-tight" :style="{ color: props.piloto.colorVariante }">
            <i class="pi mr-1" :class="props.piloto.iconoVariante"></i>
            {{ props.piloto.nombreVariante }}
          </p>
          <ul class="mt-2 space-y-1.5">
            <li v-for="(regla, indice) in reglasVariante" :key="`${props.piloto.id}-regla-${indice}`"
              class="text-xs text-zinc-300 leading-relaxed">
              -{{ regla }}
            </li>
          </ul>
        </div>

      </div>
    </Dialog>

    <!-- Dialog de puja -->
    <Dialog v-model:visible="mostrarPuja" header="Realizar Puja" modal
      :style="{ width: '90vw', maxWidth: '300px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }">
      <div class="space-y-4">
        <div class="text-center">
          <p class="text-white font-bold text-sm">{{ props.piloto.nombre }}</p>
          <p class="text-zinc-400 text-xs mt-1">Precio base: <span class="text-emerald-400 font-bold">{{
            Number(props.piloto.precio).toFixed(2) }}M</span></p>
        </div>
        <div class="flex flex-col items-center gap-2">
          <label class="text-zinc-300 text-xs font-bold uppercase">Tu puja (M)</label>
          <InputNumber v-model="cantidadPuja" :min="Number(props.piloto.precio)" :step="0.1" :minFractionDigits="2"
            :maxFractionDigits="2" inputClass="text-center text-white bg-zinc-800 border-zinc-600 w-32" />
        </div>
        <button @click="confirmarPuja"
          class="w-full py-3 bg-[#D4A843]/70 border border-[#D4A843] text-white font-black uppercase">
          CONFIRMAR PUJA
        </button>
        <button v-if="miPuja != null" @click="confirmarEliminarPuja"
          class="w-full py-3 flex items-center justify-center bg-red-900/40 border border-red-500/50 text-white uppercase font-black">ELIMINAR
          PUJA
        </button>
      </div>
    </Dialog>
  </div>
</template>
