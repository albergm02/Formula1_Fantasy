<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

import { usarStoreGaraje } from '@/stores/storeGaraje'
import { usarStoreLigas } from '@/stores/storeLigas'

import { calcularPrecioClausula, estaEnPeriodoDeGracia, horasRestantesDeGracia } from '@/services/servicioClausulas'
import { usarBloqueoJornada } from '@/composables/usarBloqueoJornada'

import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import Cabecera from '@/components/Cabecera.vue'
import BarraNavegacion from '@/components/BarraNavegacion.vue'
import TarjetaCoche from '@/components/TarjetaCoche.vue'
import TarjetaPiloto from '@/components/TarjetaPiloto.vue'
import TarjetaPotenciador from '@/components/TarjetaPotenciador.vue'

const storeGaraje = usarStoreGaraje()
const storeLigas = usarStoreLigas()
const notificacion = useToast()
const confirmar = useConfirm()
const ruta = useRoute()

const { jornadaIniciada, mensajeBloqueoJornada } = usarBloqueoJornada()

const notificarBloqueoJornada = () => {
  notificacion.add({ severity: 'warn', summary: 'Jornada sin procesar', detail: mensajeBloqueoJornada, life: 4000 })
}
const dialogoProteccion = ref(false)
const elementoProtegiendo = ref(null)
const cantidadInversion = ref(1)

const calcularValorReventa = (precio = 0) => Math.round(Number(precio || 0) * 0.9 * 100) / 100

const formatearPrecioActual = (carta) => Number(carta?.precio ?? 0).toFixed(2)

onMounted(async () => {
  const idLiga = storeGaraje.idLigaActiva || ruta.query.liga
  if (idLiga && !storeLigas.idLigaActiva) {
    storeLigas.idLigaActiva = idLiga
  }
  if (!storeGaraje.idLigaActiva && ruta.query.liga) {
    await storeGaraje.cargarEquipo(ruta.query.liga)
  }
})

const confirmarVentaCoche = (coche) => {
  if (jornadaIniciada.value && coche.equipado) {
    notificacion.add({ severity: 'warn', summary: 'Venta denegada', detail: 'No puedes vender un chasis alineado mientras la jornada no se haya procesado.', life: 5000 })
    return
  }
  const valorReventa = calcularValorReventa(coche.precio).toFixed(2)

  confirmar.require({
    icon: 'pi pi-exclamation-triangle',
    message: `¿Estás seguro de que quieres vender el chasis ${coche.nombre} por ${valorReventa}M?`,
    header: 'Confirmar Venta',
    acceptLabel: 'Sí, vender',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const resultado = await storeGaraje.venderElemento(coche)
      if (resultado.success) {
        notificacion.add({ severity: 'success', summary: 'Venta completada', detail: `Has recuperado ${valorReventa}M`, life: 4000 })
      } else {
        notificacion.add({ severity: 'warn', summary: 'Venta denegada', detail: resultado.message, life: 5000 })
      }
    },
  })
}

const confirmarVentaPiloto = (piloto) => {
  if (jornadaIniciada.value && piloto.equipado) {
    notificacion.add({ severity: 'warn', summary: 'Despido denegado', detail: 'No puedes despedir a un piloto titular mientras la jornada no se haya procesado.', life: 5000 })
    return
  }
  const valorReventa = calcularValorReventa(piloto.precio).toFixed(2)

  confirmar.require({
    icon: 'pi pi-user-minus',
    message: `¿Estás seguro de que quieres rescindir el contrato de ${piloto.nombre} por ${valorReventa}M?`,
    header: 'Confirmar Despido',
    acceptLabel: 'Sí, despedir',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const resultado = await storeGaraje.venderElemento(piloto)
      if (resultado.success) {
        notificacion.add({ severity: 'success', summary: 'Despido completado', detail: `Has recuperado ${valorReventa}M`, life: 4000 })
      } else {
        notificacion.add({ severity: 'warn', summary: 'Despido denegado', detail: resultado.message, life: 5000 })
      }
    },
  })
}

const alternarInstalacionPotenciador = async (idInstancia) => {
  if (jornadaIniciada.value) {
    notificarBloqueoJornada()
    return
  }
  const resultado = await storeGaraje.alternarPotenciador(idInstancia)
  if (!resultado.success) {
    notificacion.add({ severity: 'warn', summary: 'Acción denegada', detail: resultado.message, life: 5000 })
  }
}

const alternarEquipoCoche = async (instanciaId) => {
  if (jornadaIniciada.value) {
    notificarBloqueoJornada()
    return
  }
  const resultado = await storeGaraje.alternarCoche(instanciaId)
  if (!resultado.success) {
    notificacion.add({ severity: 'warn', summary: 'Acción denegada', detail: resultado.message, life: 5000 })
  }
}

const alternarEquipoPiloto = async (instanciaId) => {
  if (jornadaIniciada.value) {
    notificarBloqueoJornada()
    return
  }
  const resultado = await storeGaraje.alternarPiloto(instanciaId)
  if (!resultado.success) {
    notificacion.add({ severity: 'warn', summary: 'Acción denegada', detail: resultado.message, life: 5000 })
  }
}

const abrirDialogoProteccion = (elemento) => {
  elementoProtegiendo.value = elemento
  cantidadInversion.value = 1
  dialogoProteccion.value = true
}

const confirmarInversionClausula = async () => {
  const resultado = await storeGaraje.invertirEnClausula(
    elementoProtegiendo.value.instancia_id,
    cantidadInversion.value,
  )

  if (resultado.success) {
    notificacion.add({ severity: 'success', summary: 'Cláusula aumentada.', detail: resultado.message, life: 4000 })
    dialogoProteccion.value = false
  } else {
    notificacion.add({ severity: 'warn', summary: 'Cláusula no aumentada.', detail: resultado.message, life: 5000 })
  }
}
</script>

<template>
  <Cabecera />

  <main class="flex flex-col w-full max-w-lg mx-auto mt-4 mb-24 px-3 gap-6">

    <div v-if="jornadaIniciada"
      class="px-3 py-2 bg-[#D4A843]/10 text-[10px] font-black uppercase tracking-widest text-[#D4A843] text-center">
      {{ mensajeBloqueoJornada }}
    </div>

    <section>
      <header class="flex items-center gap-2 mb-2">
        <div class="flex-1 h-px bg-zinc-700"></div>
        <h2 class="text-xs font-black uppercase tracking-widest text-white">Chásis</h2>
        <div class="flex-1 h-px bg-zinc-700"></div>
      </header>
      <span class="text-[9px] uppercase tracking-widest text-[#D4A843] font-black mb-2 block">
        {{storeGaraje.garaje.coches.filter((c) => c.equipado).length}} titulares
      </span>
      <div v-if="storeGaraje.garaje.coches.length > 0" class="grid grid-cols-1 gap-3">
        <article v-for="coche in storeGaraje.garaje.coches" :key="coche.instancia_id"
          class="flex flex-col bg-[#121218]">
          <TarjetaCoche :coche="coche" :modoMercado="false" />

          <div class="flex flex-col gap-2 px-2 py-2 items-center">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
              <span class="text-zinc-400">
                Valor actual:
                <span class="font-black text-[#D4A843]">{{ formatearPrecioActual(coche) }}M</span>
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

            <div class="grid grid-cols-3 gap-1.5">
              <Button :label="coche.equipado ? 'En uso' : 'Usar chasis'"
                @click="alternarEquipoCoche(coche.instancia_id)" size="small" :disabled="jornadaIniciada"
                :class="coche.equipado ? '!bg-emerald-900/30 !border-emerald-500/50' : '!bg-[#1A1A1F] !border-zinc-700'"
                :pt="{
                  label: { class: ['text-[10px] font-black uppercase tracking-wide', coche.equipado ? 'text-emerald-400' : 'text-zinc-300'] },
                }" />
              <Button label="Proteger" @click="abrirDialogoProteccion(coche)" size="small"
                class="!bg-[#1A1A1F] !border-[#D4A843]/40"
                :pt="{ label: { class: 'text-[10px] font-black uppercase tracking-wide text-[#D4A843]' } }" />
              <Button :label="`Vender ${calcularValorReventa(coche.precio).toFixed(2)}M`"
                @click="confirmarVentaCoche(coche)" size="small" class="!bg-[#1A1A1F] !border-[#E10600]/40"
                :pt="{ label: { class: 'text-[10px] font-black uppercase tracking-wide text-[#E10600]' } }" />
            </div>
          </div>
        </article>
      </div>

      <div v-else class="flex flex-col items-center justify-center p-8 bg-[#1A1A1F]/50 border border-zinc-800/50">
        <span class="text-[10px] font-black uppercase text-zinc-500">Garaje Vacío</span>
      </div>
    </section>

    <section>
      <header class="flex items-center gap-2 mb-2">
        <div class="flex-1 h-px bg-zinc-700"></div>
        <h2 class="text-xs font-black uppercase tracking-widest text-white">Pilotos</h2>
        <div class="flex-1 h-px bg-zinc-700"></div>
      </header>
      <span class="text-[9px] uppercase tracking-widest text-[#D4A843] font-black mb-2 block">
        {{storeGaraje.garaje.pilotos.filter((p) => p.equipado).length}} titulares
      </span>
      <div v-if="storeGaraje.garaje.pilotos.length > 0" class="grid grid-cols-1 gap-3">
        <article v-for="piloto in storeGaraje.garaje.pilotos" :key="piloto.instancia_id"
          class="flex flex-col bg-[#121218] border border-zinc-800">
          <TarjetaPiloto :piloto="piloto" :modoMercado="false" />

          <div class="flex flex-col gap-2 px-3 py-2 border-t border-zinc-800/70">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
              <span class="text-zinc-400">
                Valor actual:
                <span class="font-black text-[#D4A843]">{{ formatearPrecioActual(piloto) }}M</span>
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

            <div class="grid grid-cols-3 gap-1.5">
              <Button :label="piloto.equipado ? 'Titular' : 'Hacer titular'"
                @click="alternarEquipoPiloto(piloto.instancia_id)" size="small" :disabled="jornadaIniciada"
                :class="piloto.equipado ? '!bg-emerald-900/30 !border-emerald-500/50' : '!bg-[#1A1A1F] !border-zinc-700'"
                :pt="{
                  label: { class: ['text-[10px] font-black uppercase tracking-wide', piloto.equipado ? 'text-emerald-400' : 'text-zinc-300'] },
                }" />
              <Button label="Proteger" @click="abrirDialogoProteccion(piloto)" size="small"
                class="!bg-[#1A1A1F] !border-[#D4A843]/40"
                :pt="{ label: { class: 'text-[10px] font-black uppercase tracking-wide text-[#D4A843]' } }" />
              <Button :label="`Despedir ${calcularValorReventa(piloto.precio).toFixed(2)}M`"
                @click="confirmarVentaPiloto(piloto)" size="small" class="!bg-[#1A1A1F] !border-[#E10600]/40"
                :pt="{ label: { class: 'text-[10px] font-black uppercase tracking-wide text-[#E10600]' } }" />
            </div>
          </div>
        </article>
      </div>

      <div v-else class="flex flex-col items-center justify-center p-8 bg-[#1A1A1F]/50 border border-zinc-800/50">
        <span class="text-[10px] font-black uppercase text-zinc-500">Asientos vacíos</span>
      </div>
    </section>

    <section>
      <header class="flex items-center gap-2 mb-2 px-1">
        <div class="flex-1 h-px bg-zinc-700"></div>
        <h2 class="text-xs font-black uppercase tracking-widest text-white">Potenciadores</h2>
        <div class="flex-1 h-px bg-zinc-700"></div>
      </header>

      <span class="text-[9px] uppercase tracking-widest text-[#D4A843] font-black mb-2 block">
        {{storeGaraje.garaje.potenciadores.filter((p) => p.equipado).length}} instalados
      </span>

      <div v-if="storeGaraje.garaje.potenciadores.length > 0" class="grid grid-cols-1 gap-3">
        <article v-for="potenciador in storeGaraje.garaje.potenciadores" :key="potenciador.instancia_id"
          class="flex flex-col bg-[#121218] border border-zinc-800">
          <TarjetaPotenciador :potenciador="potenciador" :modoMercado="false" />
          <div class="flex flex-col gap-2 px-2 py-2 items-center border-t border-zinc-800/70">
            <Button :label="potenciador.equipado ? 'Instalado' : 'Instalar'"
              @click="alternarInstalacionPotenciador(potenciador.instancia_id)" size="small" class="w-full"
              :disabled="jornadaIniciada"
              :class="potenciador.equipado ? '!bg-emerald-900/30 !border-emerald-500/50' : '!bg-[#1A1A1F] !border-zinc-700'"
              :pt="{
                label: { class: ['text-[10px] font-black uppercase tracking-wide', potenciador.equipado ? 'text-emerald-400' : 'text-zinc-300'] },
              }" />
          </div>
        </article>
      </div>

      <div v-else class="flex flex-col items-center justify-center p-8 bg-[#1A1A1F]/50 border border-zinc-800/50">
        <span class="text-[10px] font-black uppercase text-zinc-500">Sin mejoras</span>
      </div>
    </section>

    <Dialog v-model:visible="dialogoProteccion" header="Proteger Carta" modal
      :headerStyle="{ backgroundColor: '#1A1A1F', color: 'white', borderBottom: '1px solid #2A2A32' }"
      :contentStyle="{ backgroundColor: '#1A1A1F', padding: '1.5rem' }"
      :style="{ width: '90vw', maxWidth: '400px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }">
      <div v-if="elementoProtegiendo" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <span class="text-xs font-black uppercase tracking-widest text-white">
            {{ elementoProtegiendo.nombre }}
          </span>
          <span class="text-[10px] text-zinc-400">
            Cláusula actual: {{ calcularPrecioClausula(elementoProtegiendo).toFixed(2) }}M
          </span>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            Invertir (×2 en cláusula)
          </label>
          <InputNumber v-model="cantidadInversion" :min="1" :max="storeGaraje.presupuesto" suffix="M"
            :minFractionDigits="1" :maxFractionDigits="1" inputClass="!bg-black !text-white !border-zinc-700 w-full"
            class="w-full" />
          <span class="text-[10px] text-zinc-500">
            Nueva cláusula: {{ (calcularPrecioClausula(elementoProtegiendo) + cantidadInversion * 2).toFixed(2) }}M
          </span>
        </div>

        <Button label="CONFIRMAR INVERSIÓN" icon="pi pi-shield" @click="confirmarInversionClausula"
          :disabled="cantidadInversion <= 0 || cantidadInversion > storeGaraje.presupuesto"
          class="w-full !bg-[#D4A843]/10 !border-[#D4A843]/50" :pt="{
            label: { class: 'text-[10px] font-black uppercase tracking-widest text-[#D4A843]' },
            icon: { class: 'text-[#D4A843]' },
          }" />
      </div>
    </Dialog>

  </main>

  <BarraNavegacion />
</template>
