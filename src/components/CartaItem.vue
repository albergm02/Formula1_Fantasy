<script setup>
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import { estiloVariante } from '@/utils/variantesPiloto'
import { perfilesPuntuacion } from '@/utils/perfilesPuntuacion'

const mostrarDetalles = ref(false)
const mostrarPuja = ref(false)
const cantidadPuja = ref(null)

const props = defineProps({
  carta: { type: Object, required: true },
  tipo: { type: String, required: true },
  modoMercado: { type: Boolean, default: false },
  miPuja: { type: Number, default: null },
  totalPujas: { type: Number, default: 0 },
  cargando: { type: Boolean, default: false },
})

const emit = defineEmits(['pujar', 'eliminarPuja'])
const notificacion = useToast()

const esPiloto = computed(() => props.tipo === 'piloto')
const esCoche = computed(() => props.tipo === 'coche')
const esPotenciador = computed(() => props.tipo === 'potenciador')

const colorVariante = computed(() => estiloVariante[props.carta.variante]?.color ?? '#a1a1aa')
const iconoVariante = computed(() => estiloVariante[props.carta.variante]?.icono ?? 'pi-user')

const resumenPuntuacionPiloto = computed(() => perfilesPuntuacion[props.carta.variante]?.resumenPuntuacion ?? null)

const resumenPuntuacionCoche = computed(
  () =>
    `Esta carta puntúa ${props.carta.puntuacionBase} puntos fijos en cada gran premio disputado, sin depender del resultado de la carrera.`,
)

const resumenPuntuacionPotenciador = computed(
  () => `Esta carta multiplica la puntuación final de tu jornada por ×${props.carta.multiplicador}.`,
)

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
}

const confirmarEliminarPuja = () => {
  emit('eliminarPuja', props.carta)
}

const cerrarDialogoPuja = () => {
  if (props.cargando) return
  mostrarPuja.value = false
}

watch(
  () => props.cargando,
  (estaCargando, estabaCargando) => {
    if (estabaCargando && !estaCargando) {
      mostrarPuja.value = false
    }
  },
)
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
              <Button
                icon="pi pi-info-circle"
                @click="mostrarDetalles = true"
                size="small"
                class="!bg-[#1A1A1F] !border-zinc-700"
                :pt="{
                  label: { class: 'text-[10px] font-black uppercase tracking-wide text-zinc-300' },
                  icon: { class: '!text-zinc-300 text-[10px]' },
                }"
              />
              <Button
                :label="miPuja != null ? 'EDITAR PUJA' : `PUJAR ${Number(carta.precio).toFixed(2)}M`"
                @click="abrirPuja"
                :disabled="cargando"
                :loading="cargando"
                size="small"
                class="flex-1 !bg-[#1A1A1F] !border-[#D4A843]/40"
                :pt="{ label: { class: 'text-[10px] font-black uppercase tracking-wide text-[#D4A843]' } }"
              />
            </div>

            <Button
              v-else
              label="DETALLES"
              icon="pi pi-info-circle"
              @click="mostrarDetalles = true"
              size="small"
              class="w-full !bg-[#1A1A1F] !border-zinc-700"
              :pt="{
                label: { class: 'text-[10px] font-black uppercase tracking-wide text-zinc-300' },
                icon: { class: '!text-zinc-300 text-[10px]' },
              }"
            />
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
          <p v-if="resumenPuntuacionPiloto" class="text-xs text-zinc-300 leading-relaxed">
            {{ resumenPuntuacionPiloto }}
          </p>
        </template>

        <!-- Coche -->
        <template v-if="esCoche">
          <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
            <p class="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">Puntos por jornada</p>
            <span class="text-3xl font-black text-white">{{ carta.puntuacionBase }}</span>
          </div>
          <p class="text-xs text-zinc-300 leading-relaxed">{{ resumenPuntuacionCoche }}</p>
        </template>

        <!-- Potenciador -->
        <template v-if="esPotenciador">
          <p class="text-xs text-zinc-300 pb-3 border-b border-zinc-800">{{ carta.descripcion }}</p>
          <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
            <p class="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Multiplicador</p>
            <span class="text-2xl font-black text-emerald-400">×{{ carta.multiplicador }}</span>
          </div>
          <p class="text-xs text-zinc-300 leading-relaxed">{{ resumenPuntuacionPotenciador }}</p>
        </template>
      </div>
    </Dialog>

    <!-- Dialog puja -->
    <Dialog
      v-model:visible="mostrarPuja"
      header="Realizar Puja"
      modal
      :style="{ width: '90vw', maxWidth: '400px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }"
    >
      <div class="flex flex-col gap-4">
        <Message severity="info" :closable="false"> Puja mínima: {{ Number(carta.precio).toFixed(2) }}M (precio base). </Message>
        <div class="flex flex-col gap-2">
          <label class="text-xs text-zinc-400 uppercase">Tu puja (M)</label>
          <InputNumber
            v-model="cantidadPuja"
            :step="0.1"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            inputClass="w-full !bg-[#1A1A1F] !border-zinc-700 !text-white"
            class="w-full"
          />
        </div>
        <div class="flex justify-end gap-2 mt-2">
          <Button
            label="Cancelar"
            text
            @click="cerrarDialogoPuja"
            :disabled="cargando"
            class="!bg-zinc-900 !border-zinc-700 !text-white"
            :pt="{ label: { class: 'text-xs font-black uppercase tracking-widest' } }"
          />
          <Button
            v-if="miPuja != null"
            label="Eliminar puja"
            @click="confirmarEliminarPuja"
            :loading="cargando"
            class="!bg-[#E10600] !border-[#E10600] !text-white"
            :pt="{ label: { class: 'text-xs font-black uppercase tracking-widest' } }"
          />
          <Button
            label="Confirmar puja"
            @click="confirmarPuja"
            :loading="cargando"
            class="!bg-[#D4A843] !border-[#D4A843] !text-[#1A1A1F]"
            :pt="{ label: { class: 'text-xs font-black uppercase tracking-widest' } }"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>
