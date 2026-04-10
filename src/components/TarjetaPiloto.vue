<script setup>
import { ref, computed } from 'vue'
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
    <div class="w-full h-full overflow-hidden border border-zinc-700 bg-black">
      <!-- La imagen ES la carta. Todo se superpone encima -->
      <div class="relative w-full h-full overflow-hidden">

        <!-- Imagen de fondo completa -->
        <img v-if="props.piloto.imagen" :src="props.piloto.imagen" :alt="props.piloto.nombre"
          class="w-full h-full object-cover block" />

        <!-- Overlay de info (lado derecho, siempre visible) -->
        <div class="absolute inset-y-0 right-0 w-[55%] flex flex-col justify-between p-3">

          <!-- Header: nombre + equipo -->
          <div>
            <div class="flex flex-col min-w-0">
              <span class="text-sm font-black text-white uppercase leading-tight truncate drop-shadow-md">
                {{ props.piloto.nombre }}
              </span>
              <span class="text-xs text-zinc-300 uppercase font-bold">
                {{ props.piloto.equipo }}
              </span>
            </div>
          </div>

          <div class="flex-1"></div>

          <!-- Fila: badge variante + precio -->
          <div v-if="modoMercado" class="flex items-center justify-between gap-2 mb-1">
            <span class="px-2 py-1 flex items-center gap-1 text-[8px] font-black uppercase bg-black/50 border"
              :style="{ color: props.piloto.colorVariante, borderColor: props.piloto.colorVariante }">
              <i class="pi text-[8px]" :class="props.piloto.iconoVariante"></i>
              {{ props.piloto.variante }}
            </span>
            <span class="px-2 py-1 text-sm font-black text-[#D4A843] bg-black/50 border border-white/50">
              {{ Number(props.piloto.precio).toFixed(2) }}M
            </span>
          </div>

          <!-- Badge variante (solo fuera de mercado) -->
          <div v-else class="flex mb-1">
            <span class="px-2 py-1 flex items-center gap-1 text-[8px] font-black uppercase bg-black/50 border"
              :style="{ color: props.piloto.colorVariante, borderColor: props.piloto.colorVariante }">
              <i class="pi text-[8px]" :class="props.piloto.iconoVariante"></i>
              {{ props.piloto.variante }}
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

          <!-- Botón detalles fuera de mercado -->
          <button v-else @click="mostrarDetalles = true"
            class="w-full py-2.5 flex items-center justify-center bg-black/50 border border-white/50 cursor-pointer transition-all hover:bg-black/80 active:scale-[0.98]">
            <i class="pi pi-eye text-white text-xs mr-2"></i>
            <span class="text-white text-[10px] font-black uppercase tracking-widest">DETALLES</span>
          </button>
        </div>

      </div>
    </div>

    <!-- Modal de detalles (fuera de la carta) -->
    <Dialog v-model:visible="mostrarDetalles" :header="props.piloto.nombre" modal
      :headerStyle="{ backgroundColor: '#1A1A1F', color: 'white', borderBottom: '1px solid #2A2A32' }"
      :contentStyle="{ backgroundColor: '#1A1A1F', padding: '1.5rem' }"
      :style="{ width: '90vw', maxWidth: '400px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }">
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
          <p class="text-sm font-black text-sky-400 uppercase leading-tight mb-2">Atributos</p>
          <div v-for="barra in barrasAtributos" :key="barra.nombre" class="space-y-0.5">
            <div class="flex justify-between items-center">
              <span class="text-[10px] font-bold text-zinc-300 uppercase">{{ barra.nombre }}</span>
              <span class="text-[10px] font-black" :class="barra.peso > 0 ? 'text-white' : 'text-zinc-600'">{{ barra.valor }} <span
                :class="barra.peso > 0 ? 'text-zinc-500' : 'text-red-500'">× {{
                barra.peso }}</span></span>
            </div>
            <div class="w-full h-1.5 bg-zinc-700 overflow-hidden">
              <div class="h-full transition-all duration-500"
                :style="{ width: `${barra.valor}%`, backgroundColor: barra.color, opacity: barra.peso > 0 ? 0.4 + barra.peso : 0.15 }"></div>
            </div>
          </div>
        </div>

        <!-- Reglas de la variante -->
        <div v-if="props.piloto.reglasUsuario?.length" class="px-3 py-2.5 bg-zinc-800 border border-zinc-700">
          <p class="text-sm font-black uppercase leading-tight" :style="{ color: props.piloto.colorVariante }">
            <i class="pi mr-1" :class="props.piloto.iconoVariante"></i>
            {{ props.piloto.nombreVariante }}
          </p>
          <ul class="mt-2 space-y-1.5">
            <li v-for="(regla, indice) in props.piloto.reglasUsuario" :key="`${props.piloto.id}-regla-${indice}`"
              class="text-xs text-zinc-300 leading-relaxed">
              • {{ regla }}
            </li>
          </ul>
        </div>

      </div>
    </Dialog>
  </div>
</template>
