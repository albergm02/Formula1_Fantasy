<script setup>
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import { useToast } from 'primevue/usetoast'
import { estiloVariante } from '@/utils/variantesPiloto'

const mostrarDetalles = ref(false)
const mostrarPuja = ref(false)
const cantidadPuja = ref(null)

const props = defineProps({
  carta: { type: Object, required: true },
  tipo: { type: String, required: true },
  modoMercado: { type: Boolean, default: false },
  miPuja: { type: Number, default: null },
  totalPujas: { type: Number, default: 0 },
})

const emit = defineEmits(['pujar', 'eliminarPuja'])
const notificacion = useToast()

const esPiloto = computed(() => props.tipo === 'piloto')
const esCoche = computed(() => props.tipo === 'coche')
const esPotenciador = computed(() => props.tipo === 'potenciador')

const colorVariante = computed(() => estiloVariante[props.carta.variante]?.color ?? '#a1a1aa')
const iconoVariante = computed(() => estiloVariante[props.carta.variante]?.icono ?? 'pi-user')

const etiquetaCondicion = computed(() => {
  if (!esPotenciador.value) return null
  const mapa = {
    lluvia: { texto: 'Sólo cuenta si LLUEVE', color: 'text-blue-400', borde: 'border-blue-500/40' },
    sin_lluvia: { texto: 'Sólo cuenta si la carrera es EN SECO', color: 'text-amber-300', borde: 'border-amber-500/40' },
    safety_car: { texto: 'Sólo cuenta si hay COCHE DE SEGURIDAD (SC o VSC)', color: 'text-[#D4A843]', borde: 'border-[#D4A843]/40' },
    carrera_limpia: {
      texto: 'Sólo cuenta en CARRERA LIMPIA (sin lluvia ni SC)',
      color: 'text-emerald-400',
      borde: 'border-emerald-500/40',
    },
    caos: { texto: 'Sólo cuenta con 3 o más ABANDONOS', color: 'text-red-400', borde: 'border-red-500/40' },
    sin_abandonos: { texto: 'Sólo cuenta si NADIE ABANDONA la carrera', color: 'text-sky-400', borde: 'border-sky-500/40' },
    stint_largo: { texto: 'Sólo cuenta si UN PILOTO TUYO aguanta un STINT LARGO', color: 'text-purple-400', borde: 'border-purple-500/40' },
    mis_remontadas: {
      texto: 'Sólo cuenta si UN PILOTO TUYO REMONTA 3+ POSICIONES',
      color: 'text-orange-400',
      borde: 'border-orange-500/40',
    },
    mis_pilotos_terminan: {
      texto: 'Sólo cuenta si TODOS TUS PILOTOS TERMINAN la carrera',
      color: 'text-green-400',
      borde: 'border-green-500/40',
    },
    mi_piloto_punto: {
      texto: 'Sólo cuenta si UN PILOTO TUYO acaba EN ZONA DE PUNTOS',
      color: 'text-cyan-400',
      borde: 'border-cyan-500/40',
    },
  }
  return mapa[props.carta.condicion] || null
})

const abrirPuja = () => {
  cantidadPuja.value = props.miPuja || props.carta.precio
  mostrarPuja.value = true
}

const confirmarPuja = () => {
  if (Number(cantidadPuja.value) < Number(props.carta.precio)) {
    notificacion.add({
      severity: 'warn',
      summary: 'Precio insuficiente',
      detail: `La puja mínima es ${Number(props.carta.precio).toFixed(2)}M (precio base actual).`,
      life: 5000,
    })
    return
  }
  emit('pujar', { carta: props.carta, cantidad: cantidadPuja.value })
  mostrarPuja.value = false
}

const confirmarEliminarPuja = () => {
  emit('eliminarPuja', props.carta)
  mostrarPuja.value = false
}

const cerrarDialogoPuja = () => {
  mostrarPuja.value = false
}
</script>

<template>
  <div
    class="w-full h-[160px]"
    :style="
      esPiloto
        ? { border: `2px solid ${colorVariante}` }
        : esCoche
          ? { border: '2px solid white' }
          : esPotenciador
            ? { border: '2px solid #4ade80' }
            : {}
    "
  >
    <div class="w-full h-full overflow-hidden border border-zinc-700 bg-black">
      <div class="relative w-full h-full overflow-hidden">
        <img
          v-if="carta.imagen"
          :src="carta.imagen"
          :alt="carta.nombre"
          class="w-full h-full object-cover block"
          :style="esPotenciador ? 'object-position: 20% center' : ''"
        />

        <div
          v-if="modoMercado && totalPujas > 0"
          class="absolute top-2 right-2 z-10 flex items-center gap-1 px-1.5 py-0.5 bg-black/70 border border-zinc-500/40"
        >
          <i class="pi pi-users text-[8px] text-zinc-300"></i>
          <span class="text-[10px] font-black text-zinc-300">{{ totalPujas }}</span>
        </div>

        <div class="absolute inset-y-0 right-0 w-[55%] flex flex-col justify-between p-3">
          <div class="flex flex-col min-w-0">
            <span class="text-sm font-black text-white uppercase leading-tight truncate drop-shadow-md">
              {{ carta.nombre }}
            </span>
            <span v-if="esPiloto" class="text-xs text-zinc-300 uppercase font-bold">{{ carta.equipo }}</span>
            <span v-if="esCoche" class="text-xs text-zinc-300 uppercase font-bold">{{ carta.equipo || 'COCHE' }}</span>
            <span v-if="esPotenciador" class="text-xs text-zinc-300 uppercase font-bold">POTENCIADOR</span>
          </div>

          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between gap-1">
              <div v-if="modoMercado" class="flex items-center gap-1 px-1.5 py-0.5 bg-black/70">
                <span class="text-[10px] font-black text-emerald-400"> {{ Number(carta.precio).toFixed(2) }} M </span>
              </div>
              <span
                v-if="esPiloto"
                class="px-2 py-0.5 flex items-center gap-1 text-[8px] font-black uppercase bg-black/70 border ml-auto"
                :style="{ color: colorVariante, borderColor: colorVariante }"
              >
                <i class="pi" :class="iconoVariante"></i>
                {{ carta.variante }}
              </span>
              <span
                v-if="esPotenciador"
                class="px-2 py-0.5 flex items-center gap-1 text-[8px] font-black uppercase bg-black/70 border border-emerald-500/60 text-emerald-400 ml-auto"
              >
                <i class="pi pi-bolt"></i>
                ×{{ carta.multiplicador }}
              </span>
            </div>

            <div v-if="modoMercado" class="flex gap-2">
              <button
                @click="mostrarDetalles = true"
                class="py-2.5 px-3 flex items-center justify-center gap-1 bg-black/50 border border-white/50"
              >
                <i class="pi pi-info-circle text-white text-[10px]"></i>
                <span class="text-white text-[9px] font-black uppercase">INFO</span>
              </button>
              <button @click="abrirPuja" class="flex-1 py-2.5 flex items-center justify-center bg-black/50 border border-white/50">
                <span class="text-[10px] font-black uppercase tracking-widest" :class="miPuja != null ? 'text-[#D4A843]' : 'text-white'">
                  {{ miPuja != null ? 'EDITAR PUJA' : `PUJAR (${Number(carta.precio).toFixed(2)}M)` }}
                </span>
              </button>
            </div>

            <button
              v-else
              @click="mostrarDetalles = true"
              class="w-full py-2.5 flex items-center justify-center gap-1.5 bg-black/50 border border-white/50"
            >
              <i class="pi pi-info-circle text-white text-xs"></i>
              <span class="text-white text-[10px] font-black uppercase tracking-widest">DETALLES</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog detalles -->
    <Dialog
      v-model:visible="mostrarDetalles"
      :header="carta.nombre"
      modal
      :style="{ width: '90vw', maxWidth: '400px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }"
    >
      <div class="flex flex-col gap-4">
        <!-- Piloto -->
        <template v-if="esPiloto">
          <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
            <p class="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Variante</p>
            <span class="text-base font-black" :style="{ color: colorVariante }">
              <i class="pi mr-1" :class="iconoVariante"></i>
              {{ carta.nombreVariante || carta.variante }}
            </span>
          </div>
        </template>

        <!-- Coche -->
        <template v-if="esCoche">
          <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
            <p class="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">Puntos por jornada</p>
            <span class="text-3xl font-black text-white">{{ carta.puntuacionBase }}</span>
          </div>
          <div v-if="carta.habilidad">
            <p class="text-xs font-black text-emerald-400 uppercase tracking-wide mb-1">
              {{ carta.habilidad.nombre }}
            </p>
            <p class="text-xs text-zinc-300 leading-relaxed">
              Si alineas pilotos del mismo equipo que este chasis, los puntos totales de la jornada se multiplican por
              <strong class="text-emerald-300">×1.10</strong>.
            </p>
          </div>
        </template>

        <!-- Potenciador -->
        <template v-if="esPotenciador">
          <p class="text-xs text-zinc-300 pb-3 border-b border-zinc-800">{{ carta.descripcion }}</p>
          <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
            <p class="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Multiplicador</p>
            <span class="text-2xl font-black text-emerald-400">×{{ carta.multiplicador }}</span>
          </div>
        </template>
      </div>
    </Dialog>

    <!-- Dialog puja -->
    <Dialog
      v-model:visible="mostrarPuja"
      header="Realizar Puja"
      modal
      :style="{ width: '90vw', maxWidth: '300px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }"
    >
      <div class="space-y-4">
        <div class="text-center">
          <p class="text-white font-bold text-sm">{{ carta.nombre }}</p>
          <p class="text-zinc-400 text-xs mt-1">
            Precio base:
            <span class="text-emerald-400 font-bold">{{ Number(carta.precio).toFixed(2) }}M</span>
          </p>
        </div>
        <div class="flex flex-col items-center gap-2">
          <label class="text-zinc-300 text-xs font-bold uppercase">Tu puja (M)</label>
          <InputNumber
            v-model="cantidadPuja"
            :step="0.1"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            inputClass="text-center text-white bg-zinc-800 border-zinc-600 w-32"
          />
        </div>
        <Button
          label="Confirmar puja"
          @click="confirmarPuja"
          class="w-full !bg-[#D4A843] !border-[#D4A843] !text-[#1A1A1F]"
          :pt="{ label: { class: 'text-xs font-black uppercase tracking-widest' } }"
        />
        <Button
          v-if="miPuja != null"
          label="Eliminar puja"
          @click="confirmarEliminarPuja"
          class="w-full !bg-red-700 !border-red-700 !text-white"
          :pt="{ label: { class: 'text-xs font-black uppercase tracking-widest' } }"
        />
        <Button
          label="Cancelar"
          @click="cerrarDialogoPuja"
          class="w-full !bg-gray-700 !border-gray-700 !text-white"
          :pt="{ label: { class: 'text-xs font-black uppercase tracking-widest' } }"
        />
      </div>
    </Dialog>
  </div>
</template>
