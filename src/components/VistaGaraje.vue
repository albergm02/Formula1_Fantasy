<script setup>
import { ref, computed } from 'vue'

import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

import { calcularPrecioClausula, estaEnPeriodoDeGracia, horasRestantesDeGracia } from '@/services/servicioGaraje'
import { usarStoreGaraje } from '@/stores/storeGaraje'

import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import CartaItem from '@/components/CartaItem.vue'

const props = defineProps({
  modoRival: { type: Boolean, default: false },
  participacion: { type: Object, default: null },
})

const storeGaraje = usarStoreGaraje()
const notificacion = useToast()
const confirmar = useConfirm()

const coches = computed(() => (props.modoRival ? (props.participacion?.garaje?.coches ?? []) : storeGaraje.garaje.coches))
const pilotos = computed(() => (props.modoRival ? (props.participacion?.garaje?.pilotos ?? []) : storeGaraje.garaje.pilotos))
const potenciadores = computed(() =>
  props.modoRival ? (props.participacion?.garaje?.potenciadores ?? []) : storeGaraje.garaje.potenciadores,
)

const valorTotalGaraje = computed(() => {
  const todasLasCartas = [...coches.value, ...pilotos.value, ...potenciadores.value]
  const total = todasLasCartas.reduce((suma, carta) => suma + storeGaraje.obtenerValorMercado(carta), 0)
  return total.toFixed(1)
})

// ─── Modo propio ──────────────────────────────────────────────────────────────

const dialogoProteccion = ref(false)
const elementoProtegiendo = ref(null)
const cantidadInversion = ref(1)

const calcularValorReventa = (precio = 0) => Math.round(Number(precio || 0) * 0.9 * 100) / 100
const formatearValorMercado = (carta) => storeGaraje.obtenerValorMercado(carta).toFixed(2)

const confirmarVentaCoche = (coche) => {
  const valorReventa = calcularValorReventa(coche.precio).toFixed(2)
  confirmar.require({
    message: `¿Estás seguro de que quieres vender el chasis ${coche.nombre} por ${valorReventa}M?`,
    header: 'Confirmar Venta',
    acceptLabel: 'Sí, vender',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const resultado = await storeGaraje.venderElemento(coche)
      if (resultado.success)
        notificacion.add({ severity: 'success', summary: 'Venta completada', detail: `Has recuperado ${valorReventa}M`, life: 4000 })
      else notificacion.add({ severity: 'warn', summary: 'Venta denegada', detail: resultado.message, life: 5000 })
    },
  })
}

const confirmarVentaPiloto = (piloto) => {
  const valorReventa = calcularValorReventa(piloto.precio).toFixed(2)
  confirmar.require({
    message: `¿Estás seguro de que quieres rescindir el contrato de ${piloto.nombre} por ${valorReventa}M?`,
    header: 'Confirmar Despido',
    acceptLabel: 'Sí, despedir',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const resultado = await storeGaraje.venderElemento(piloto)
      if (resultado.success)
        notificacion.add({ severity: 'success', summary: 'Despido completado', detail: `Has recuperado ${valorReventa}M`, life: 4000 })
      else notificacion.add({ severity: 'warn', summary: 'Despido denegado', detail: resultado.message, life: 5000 })
    },
  })
}

const alternarEquipado = async (instanciaId) => {
  const resultado = await storeGaraje.alternarEquipado(instanciaId)
  if (!resultado.success) notificacion.add({ severity: 'warn', summary: 'Acción denegada', detail: resultado.message, life: 5000 })
}

const abrirDialogoProteccion = (elemento) => {
  elementoProtegiendo.value = elemento
  cantidadInversion.value = 1
  dialogoProteccion.value = true
}

const confirmarInversionClausula = async () => {
  const resultado = await storeGaraje.invertirEnClausula(elementoProtegiendo.value.instancia_id, cantidadInversion.value)
  if (resultado.success) {
    notificacion.add({ severity: 'success', summary: 'Cláusula aumentada.', detail: resultado.message, life: 4000 })
    dialogoProteccion.value = false
  } else {
    notificacion.add({ severity: 'warn', summary: 'Cláusula no aumentada.', detail: resultado.message, life: 5000 })
  }
}

// ─── Modo rival ───────────────────────────────────────────────────────────────

const esFichajeDeshabilitado = (elemento) => {
  if (estaEnPeriodoDeGracia(elemento)) return true
  return calcularPrecioClausula(elemento) > storeGaraje.presupuesto
}

const confirmarEjecucionClausula = (elemento) => {
  const precioClausula = calcularPrecioClausula(elemento)
  confirmar.require({
    message: `¿Pagar ${precioClausula.toFixed(1)}M de cláusula para fichar a ${elemento.nombre}?`,
    header: 'Ejecutar Cláusula',
    acceptLabel: 'Sí, fichar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const resultado = await storeGaraje.ejecutarClausulaRival(props.participacion.id, elemento)
      if (resultado.success) notificacion.add({ severity: 'success', summary: 'Cláusula ejecutada', detail: resultado.message, life: 4000 })
      else notificacion.add({ severity: 'warn', summary: 'Cláusula denegada', detail: resultado.message, life: 5000 })
    },
  })
}
</script>

<template>
  <div class="flex flex-col gap-6"
    :class="modoRival ? 'p-4 max-w-lg mx-auto' : 'w-full max-w-lg mx-auto mt-4 mb-24 px-3'">
    <!-- Cabecera del rival: nombre, puntos y última jornada -->
    <template v-if="modoRival && participacion">
      <div class="flex items-center justify-between border-b border-zinc-700 pb-3">
        <div class="flex flex-col">
          <span class="text-lg font-black uppercase text-white">{{ participacion.nombreUsuario }}</span>
          <span class="text-xs text-zinc-400">Equipo rival</span>
        </div>
        <div class="flex gap-4 items-center">
          <div class="flex flex-col items-center">
            <span class="text-xl font-black text-[#D4A843]">{{ participacion.puntos }}</span>
            <span class="text-[10px] font-bold uppercase text-zinc-400">PTS</span>
          </div>
        </div>
      </div>

      <section v-if="participacion.ultimaJornada" class="flex flex-col gap-2 p-3 bg-[#121218] border border-zinc-800">
        <div class="flex items-center justify-between">
          <div class="flex flex-col">
            <span class="text-[10px] font-black uppercase tracking-widest text-zinc-500">Última jornada</span>
            <span class="text-sm font-bold text-white">{{ participacion.ultimaJornada.nombreGranPremio }}</span>
          </div>
          <span class="text-2xl font-black text-[#D4A843]">+{{ participacion.ultimaJornada.puntosJornada }}</span>
        </div>
      </section>
    </template>

    <div v-if="!modoRival" class="flex items-center justify-between pb-2 border-b border-[#FFFFFF]/10">
      <h2 class="text-sm font-black uppercase tracking-widest text-white">Valor de mercado</h2>
      <span class="text-sm font-black text-[#D4A843]">{{ valorTotalGaraje }}M</span>
    </div>

    <!-- ─── Chásis ─── -->
    <section>
      <header v-if="!modoRival" class="flex items-center gap-2 mb-2">
        <div class="flex-1 h-px bg-zinc-700"></div>
        <h2 class="text-xs font-black uppercase tracking-widest text-white">Coches</h2>
        <div class="flex-1 h-px bg-zinc-700"></div>
      </header>
      <h3 v-else class="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Coches</h3>

      <span v-if="!modoRival" class="text-[9px] uppercase tracking-widest text-[#D4A843] font-black mb-2 block">
        {{coches.filter((c) => c.equipado).length}}/1 titular
      </span>

      <div v-if="coches.length > 0" class="grid grid-cols-1 gap-3">
        <article v-for="coche in coches" :key="coche.instancia_id" class="flex flex-col bg-[#121218]">
          <CartaItem :carta="coche" tipo="coche" :modoMercado="false" />

          <div class="flex flex-col gap-2 px-2 py-2 items-center">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
              <span v-if="!modoRival" class="text-zinc-400">
                Valor de mercado:
                <span class="font-black text-[#D4A843]">{{ formatearValorMercado(coche) }}M</span>
              </span>
              <span class="text-zinc-400">
                Cláusula:
                <span class="font-black text-[#D4A843]">{{ calcularPrecioClausula(coche).toFixed(1) }}M</span>
              </span>
              <span v-if="estaEnPeriodoDeGracia(coche)"
                class="px-2 py-0.5 bg-emerald-900/30 border border-emerald-500/40 text-[10px] font-black uppercase text-emerald-400">
                Protegido {{ horasRestantesDeGracia(coche) }}h
              </span>
            </div>

            <div v-if="!modoRival" class="grid grid-cols-3 gap-1.5 w-full">
              <Button :label="coche.equipado ? 'En uso' : 'Usar chasis'" @click="alternarEquipado(coche.instancia_id)"
                size="small"
                :class="coche.equipado ? '!bg-emerald-900/30 !border-emerald-500/50' : '!bg-[#1A1A1F] !border-zinc-700'"
                :pt="{
                  label: {
                    class: ['text-[10px] font-black uppercase tracking-wide', coche.equipado ? 'text-emerald-400' : 'text-zinc-300'],
                  },
                }" />
              <Button label="Proteger" @click="abrirDialogoProteccion(coche)" size="small"
                class="!bg-[#1A1A1F] !border-[#D4A843]/40"
                :pt="{ label: { class: 'text-[10px] font-black uppercase tracking-wide text-[#D4A843]' } }" />
              <Button :label="`Vender ${calcularValorReventa(coche.precio).toFixed(2)}M`"
                @click="confirmarVentaCoche(coche)" size="small" class="!bg-[#1A1A1F] !border-[#E10600]/40"
                :pt="{ label: { class: 'text-[10px] font-black uppercase tracking-wide text-[#E10600]' } }" />
            </div>

            <div v-else class="w-full">
              <Button :label="`FICHAR ${calcularPrecioClausula(coche).toFixed(1)}M`" icon="pi pi-shield"
                @click="confirmarEjecucionClausula(coche)" :disabled="esFichajeDeshabilitado(coche)"
                class="w-full !bg-[#121218] !border-zinc-800 shadow-lg transition-colors" :pt="{
                  label: { class: 'text-[10px] font-black uppercase tracking-widest text-zinc-400' },
                  icon: { class: '!text-[#D4A843]' },
                }" />
            </div>
          </div>
        </article>
      </div>

      <div v-else class="flex flex-col items-center justify-center p-8 bg-[#1A1A1F]/50 border border-zinc-800/50">
        <span class="text-[10px] font-black uppercase text-zinc-500">Garaje Vacío</span>
      </div>
    </section>

    <!-- ─── Pilotos ─── -->
    <section>
      <header v-if="!modoRival" class="flex items-center gap-2 mb-2">
        <div class="flex-1 h-px bg-zinc-700"></div>
        <h2 class="text-xs font-black uppercase tracking-widest text-white">Pilotos</h2>
        <div class="flex-1 h-px bg-zinc-700"></div>
      </header>
      <h3 v-else class="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Pilotos</h3>

      <span v-if="!modoRival" class="text-[9px] uppercase tracking-widest text-[#D4A843] font-black mb-2 block">
        {{pilotos.filter((p) => p.equipado).length}}/2 titulares
      </span>

      <div v-if="pilotos.length > 0" class="grid grid-cols-1 gap-3">
        <article v-for="piloto in pilotos" :key="piloto.instancia_id"
          class="flex flex-col bg-[#121218] border border-zinc-800">
          <CartaItem :carta="piloto" tipo="piloto" :modoMercado="false" />

          <div class="flex flex-col gap-2 px-3 py-2 border-t border-zinc-800/70">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
              <span v-if="!modoRival" class="text-zinc-400">
                Valor de mercado:
                <span class="font-black text-[#D4A843]">{{ formatearValorMercado(piloto) }}M</span>
              </span>
              <span class="text-zinc-400">
                Cláusula de rescisión:
                <span class="font-black text-[#D4A843]">{{ calcularPrecioClausula(piloto).toFixed(1) }}M</span>
              </span>
              <span v-if="estaEnPeriodoDeGracia(piloto)"
                class="px-2 py-0.5 bg-emerald-900/30 border border-emerald-500/40 text-[10px] font-black uppercase text-emerald-400">
                Protegido {{ horasRestantesDeGracia(piloto) }}h
              </span>
            </div>

            <div v-if="!modoRival" class="grid grid-cols-3 gap-1.5">
              <Button :label="piloto.equipado ? 'Titular' : 'Hacer titular'"
                @click="alternarEquipado(piloto.instancia_id)" size="small"
                :class="piloto.equipado ? '!bg-emerald-900/30 !border-emerald-500/50' : '!bg-[#1A1A1F] !border-zinc-700'"
                :pt="{
                  label: {
                    class: ['text-[10px] font-black uppercase tracking-wide', piloto.equipado ? 'text-emerald-400' : 'text-zinc-300'],
                  },
                }" />
              <Button label="Proteger" @click="abrirDialogoProteccion(piloto)" size="small"
                class="!bg-[#1A1A1F] !border-[#D4A843]/40"
                :pt="{ label: { class: 'text-[10px] font-black uppercase tracking-wide text-[#D4A843]' } }" />
              <Button :label="`Despedir ${calcularValorReventa(piloto.precio).toFixed(2)}M`"
                @click="confirmarVentaPiloto(piloto)" size="small" class="!bg-[#1A1A1F] !border-[#E10600]/40"
                :pt="{ label: { class: 'text-[10px] font-black uppercase tracking-wide text-[#E10600]' } }" />
            </div>

            <div v-else>
              <Button :label="`FICHAR ${calcularPrecioClausula(piloto).toFixed(1)}M`" icon="pi pi-shield"
                @click="confirmarEjecucionClausula(piloto)" :disabled="esFichajeDeshabilitado(piloto)"
                class="w-full !bg-[#121218] !border-zinc-800 shadow-lg transition-colors" :pt="{
                  label: { class: 'text-[10px] font-black uppercase tracking-widest text-zinc-400' },
                  icon: { class: '!text-[#D4A843]' },
                }" />
            </div>
          </div>
        </article>
      </div>

      <div v-else class="flex flex-col items-center justify-center p-8 bg-[#1A1A1F]/50 border border-zinc-800/50">
        <span class="text-[10px] font-black uppercase text-zinc-500">Asientos vacíos</span>
      </div>
    </section>

    <!-- ─── Potenciadores ─── -->
    <section>
      <header v-if="!modoRival" class="flex items-center gap-2 mb-2 px-1">
        <div class="flex-1 h-px bg-zinc-700"></div>
        <h2 class="text-xs font-black uppercase tracking-widest text-white">Potenciadores</h2>
        <div class="flex-1 h-px bg-zinc-700"></div>
      </header>
      <h3 v-else class="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Potenciadores</h3>

      <span v-if="!modoRival" class="text-[9px] uppercase tracking-widest text-[#D4A843] font-black mb-2 block">
        {{potenciadores.filter((p) => p.equipado).length}} instalados
      </span>

      <div v-if="potenciadores.length > 0" class="grid grid-cols-1 gap-3">
        <article v-for="potenciador in potenciadores" :key="potenciador.instancia_id"
          class="flex flex-col bg-[#121218] border border-zinc-800">
          <CartaItem :carta="potenciador" tipo="potenciador" :modoMercado="false" />
          <div v-if="!modoRival" class="flex flex-col gap-2 px-2 py-2 items-center border-t border-zinc-800/70">
            <span class="text-[11px] text-zinc-400">
              Valor de mercado:
              <span class="font-black text-[#D4A843]">{{ formatearValorMercado(potenciador) }}M</span>
            </span>
            <Button :label="potenciador.equipado ? 'Instalado' : 'Instalar'"
              @click="alternarEquipado(potenciador.instancia_id)" size="small" class="w-full"
              :class="potenciador.equipado ? '!bg-emerald-900/30 !border-emerald-500/50' : '!bg-[#1A1A1F] !border-zinc-700'"
              :pt="{
                label: {
                  class: ['text-[10px] font-black uppercase tracking-wide', potenciador.equipado ? 'text-emerald-400' : 'text-zinc-300'],
                },
              }" />
          </div>
        </article>
      </div>

      <div v-else class="flex flex-col items-center justify-center p-8 bg-[#1A1A1F]/50 border border-zinc-800/50">
        <span class="text-[10px] font-black uppercase text-zinc-500">Sin mejoras</span>
      </div>
    </section>

    <!-- Dialog de protección (solo modo propio) -->
    <Dialog v-if="!modoRival" v-model:visible="dialogoProteccion" header="Proteger Carta" modal
      :headerStyle="{ backgroundColor: '#1A1A1F', color: 'white', borderBottom: '1px solid #2A2A32' }"
      :contentStyle="{ backgroundColor: '#1A1A1F', padding: '1.5rem' }"
      :style="{ width: '90vw', maxWidth: '400px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }">
      <div v-if="elementoProtegiendo" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <span class="text-xs font-black uppercase tracking-widest text-white">
            {{ elementoProtegiendo.nombre }}
          </span>
          <span class="text-[10px] text-zinc-400"> Cláusula actual: {{
            calcularPrecioClausula(elementoProtegiendo).toFixed(2) }}M </span>
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-[10px] font-black uppercase tracking-widest text-zinc-400"> Invertir (×2 en cláusula)
          </label>
          <InputNumber v-model="cantidadInversion" :min="1" :max="storeGaraje.presupuesto" suffix="M"
            :minFractionDigits="1" :maxFractionDigits="1" inputClass="!bg-black !text-white !border-zinc-700 w-full"
            class="w-full" />
          <span class="text-[10px] text-zinc-500">
            Nueva cláusula: {{ (calcularPrecioClausula(elementoProtegiendo) + cantidadInversion * 2).toFixed(2) }}M
          </span>
        </div>
        <Button label="CONFIRMAR INVERSIÓN" @click="confirmarInversionClausula"
          :disabled="cantidadInversion <= 0 || cantidadInversion > storeGaraje.presupuesto"
          class="w-full !bg-[#D4A843]/10 !border-[#D4A843]/50"
          :pt="{ label: { class: 'text-[10px] font-black uppercase tracking-widest text-[#D4A843]' }, icon: { class: 'text-[#D4A843]' } }" />
      </div>
    </Dialog>
  </div>
</template>
