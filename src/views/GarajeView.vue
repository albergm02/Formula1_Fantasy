<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import { usarStoreEscuderia } from '@/stores/storeEquipo'
import { calcularValorReventa } from '@/utils/garaje'
import Cabecera from '@/components/Cabecera.vue'
import BarraNavegacion from '@/components/BarraNavegacion.vue'
import TarjetaCoche from '@/components/TarjetaCoche.vue'
import TarjetaPiloto from '@/components/TarjetaPiloto.vue'
import TarjetaPotenciador from '@/components/TarjetaPotenciador.vue'
import TarjetaRueda from '@/components/TarjetaRueda.vue'

const storeEscuderia = usarStoreEscuderia()
const notificacion = useToast()
const confirmar = useConfirm()
const ruta = useRoute()

onMounted(async () => {
  if (!storeEscuderia.idLigaActiva && ruta.query.liga) {
    await storeEscuderia.cargarEquipo(ruta.query.liga)
  }
})

/**
 * Solicita confirmación antes de vender el coche del garaje.
 * En caso afirmativo, delega la operación al store y notifica el resultado.
 * @param {Object} coche - El objeto coche que se desea vender.
 */
const confirmarVentaCoche = (coche) => {
  const valorReventa = calcularValorReventa(coche.precio)

  confirmar.require({
    icon: 'pi pi-exclamation-triangle',
    message: `¿Estás seguro de que quieres vender el chasis ${coche.nombre} por ${valorReventa}M?`,
    header: 'Confirmar Venta',
    acceptLabel: 'Sí, vender',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const resultado = await storeEscuderia.venderElemento(coche)
      if (resultado.success) {
        notificacion.add({ severity: 'success', summary: 'Venta completada', detail: `Has recuperado ${valorReventa}M` })
      } else {
        notificacion.add({ severity: 'warn', summary: 'Venta denegada', detail: resultado.message })
      }
    },
  })
}

/**
 * Solicita confirmación antes de rescindir el contrato de un piloto.
 * @param {Object} piloto - El objeto piloto que se desea despedir.
 */
const confirmarVentaPiloto = (piloto) => {
  const valorReventa = calcularValorReventa(piloto.precio)

  confirmar.require({
    icon: 'pi pi-user-minus',
    message: `¿Estás seguro de que quieres rescindir el contrato de ${piloto.nombre} por ${valorReventa}M?`,
    header: 'Confirmar Despido',
    acceptLabel: 'Sí, despedir',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const resultado = await storeEscuderia.venderElemento(piloto)
      if (resultado.success) {
        notificacion.add({ severity: 'success', summary: 'Despido completado', detail: `Has recuperado ${valorReventa}M` })
      } else {
        notificacion.add({ severity: 'warn', summary: 'Despido denegado', detail: resultado.message })
      }
    },
  })
}

/**
 * Alterna el estado de instalación de un potenciador (instalar / desinstalar).
 * @param {string} idInstancia - El identificador único de la instancia del potenciador.
 */
const alternarInstalacionPotenciador = async (idInstancia) => {
  const resultado = await storeEscuderia.alternarPotenciador(idInstancia)
  if (resultado.success) {
    notificacion.add({ severity: 'success', summary: 'Acción completada', detail: resultado.message })
  } else {
    notificacion.add({ severity: 'warn', summary: 'Acción denegada', detail: resultado.message })
  }
}

/**
 * Solicita confirmación antes de retirar los neumáticos activos del garaje.
 * @param {Object} ruedas - El objeto ruedas que se desea retirar.
 */
const confirmarVentaRuedas = (ruedas) => {
  const valorReventa = calcularValorReventa(ruedas.precio)

  confirmar.require({
    icon: 'pi pi-exclamation-triangle',
    message: `¿Quitar ${ruedas.nombre} y recuperar ${valorReventa}M?`,
    header: 'Confirmar Cambio de Ruedas',
    acceptLabel: 'Sí, quitar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const resultado = await storeEscuderia.venderElemento(ruedas)
      if (resultado.success) {
        notificacion.add({ severity: 'success', summary: 'Ruedas retiradas', detail: `Has recuperado ${valorReventa}M` })
      } else {
        notificacion.add({ severity: 'warn', summary: 'Acción denegada', detail: resultado.message })
      }
    },
  })
}
</script>

<!---------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!---------------------------------------------------------------------------------------------------------------------------->

<template>
  <Cabecera />

  <main class="p-4 flex flex-col gap-6 mt-4 mb-24 max-w-md mx-auto w-full">

    <section class="grid">
      <div class="flex items-center gap-3 px-6 mb-3">
        <i class="pi pi-car text-white text-lg"></i>
        <h2 class="text-sm font-black text-white uppercase tracking-widest">Coche</h2>
        <div class="flex-1 h-px bg-zinc-700"></div>
      </div>

      <div v-if="storeEscuderia.garaje.coche" class="flex flex-col w-full h-full">
        <TarjetaCoche :coche="storeEscuderia.garaje.coche" :modoMercado="false" />
        <div class="px-6 pb-2 -mt-1">
          <Button :label="`VENDER POR ${calcularValorReventa(storeEscuderia.garaje.coche.precio)}M`"
            icon="pi pi-shopping-bag" @click="confirmarVentaCoche(storeEscuderia.garaje.coche)"
            class="w-full !bg-[#121218] !border-zinc-800 hover:!border-red-900/50 shadow-lg !rounded-xl transition-colors"
            :pt="{
              label: { class: 'text-[10px] font-black uppercase tracking-widest' },
              icon: { class: '!text-red-500' },
            }" />
        </div>
      </div>

      <div v-else
        class="flex flex-col items-center justify-center p-12 mx-6 bg-[#1A1A1F]/50 border border-zinc-800/50 rounded-2xl">
        <i class="mb-3 text-3xl text-zinc-600 pi pi-car"></i>
        <span class="text-xs font-black text-zinc-500 uppercase tracking-widest">Garaje Vacío</span>
      </div>
    </section>

    <section class="grid grid-cols-1 gap-6">
      <div class="flex items-center gap-3 px-6">
        <i class="pi pi-users text-white text-lg"></i>
        <h2 class="text-sm font-black text-white uppercase tracking-widest">Pilotos</h2>
        <div class="flex-1 h-px bg-zinc-700"></div>
      </div>

      <template v-if="storeEscuderia.garaje.pilotos.length > 0">
        <div v-for="piloto in storeEscuderia.garaje.pilotos" :key="piloto.instancia_id"
          class="flex flex-col w-full h-full">
          <TarjetaPiloto :piloto="piloto" :modoMercado="false" />
          <div class="px-6 pb-2 -mt-1">
            <Button :label="`DESPEDIR (${calcularValorReventa(piloto.precio)}M)`" icon="pi pi-user-minus"
              @click="confirmarVentaPiloto(piloto)"
              class="w-full !bg-[#121218] !border-zinc-800 hover:!border-red-900/50 shadow-lg !rounded-xl transition-colors"
              :pt="{
                label: { class: 'text-[10px] font-black uppercase tracking-widest' },
                icon: { class: '!text-red-500' },
              }" />
          </div>
        </div>
      </template>

      <div v-else
        class="col-span-full flex flex-col items-center justify-center p-12 mx-6 bg-[#1A1A1F]/50 border border-zinc-800/50 rounded-2xl">
        <i class="mb-3 text-3xl text-zinc-600 pi pi-users"></i>
        <span class="text-xs font-black text-zinc-500 uppercase tracking-widest">Asientos Vacíos</span>
      </div>
    </section>

    <section class="grid">
      <div class="flex items-center gap-3 px-6 mb-3">
        <i class="pi pi-bolt text-white text-lg"></i>
        <h2 class="text-sm font-black text-white uppercase tracking-widest">Potenciadores</h2>
        <div class="flex-1 h-px bg-zinc-700"></div>
      </div>

      <div v-if="storeEscuderia.garaje.potenciadores.length > 0" class="grid grid-cols-1 gap-6 px-6">
        <div v-for="potenciador in storeEscuderia.garaje.potenciadores" :key="potenciador.instancia_id"
          class="flex flex-col w-full h-full">
          <TarjetaPotenciador :potenciador="potenciador" :modoMercado="false" />
          <Button :label="potenciador.equipado ? 'INSTALADO' : 'INSTALAR'"
            :icon="potenciador.equipado ? 'pi pi-check-circle' : 'pi pi-cog'"
            @click="alternarInstalacionPotenciador(potenciador.instancia_id)" :class="[
              'w-full mt-2 shadow-lg !rounded-xl',
              potenciador.equipado
                ? '!bg-emerald-900/20 !border-emerald-500/50'
                : '!bg-[#121218] !border-zinc-800 hover:!border-zinc-600',
            ]" :pt="{
              label: { class: ['text-[10px] font-black uppercase tracking-widest', potenciador.equipado ? 'text-emerald-400' : 'text-zinc-400'] },
              icon: { class: potenciador.equipado ? 'text-emerald-400' : 'text-zinc-500' },
            }" />
        </div>
      </div>

      <div v-else
        class="flex flex-col items-center justify-center p-12 mx-6 bg-[#1A1A1F]/50 border border-zinc-800/50 rounded-2xl">
        <i class="mb-3 text-3xl text-zinc-600 pi pi-box"></i>
        <span class="text-xs font-black text-zinc-500 uppercase tracking-widest">Sin Mejoras Compradas</span>
      </div>
    </section>

    <section class="grid">
      <div class="flex items-center gap-3 px-6 mb-3">
        <i class="pi pi-circle-fill text-white text-lg"></i>
        <h2 class="text-sm font-black text-white uppercase tracking-widest">Neumáticos</h2>
        <div class="flex-1 h-px bg-zinc-700"></div>
      </div>

      <div v-if="storeEscuderia.garaje.ruedas" class="flex flex-col w-full h-full px-6">
        <TarjetaRueda :rueda="storeEscuderia.garaje.ruedas" :modoMercado="false" />
        <div class="pb-2 mt-2">
          <Button :label="`QUITAR (${calcularValorReventa(storeEscuderia.garaje.ruedas.precio)}M)`"
            icon="pi pi-shopping-bag" @click="confirmarVentaRuedas(storeEscuderia.garaje.ruedas)"
            class="w-full !bg-[#121218] !border-zinc-800 hover:!border-red-900/50 shadow-lg !rounded-xl transition-colors"
            :pt="{
              label: { class: 'text-[10px] font-black uppercase tracking-widest' },
              icon: { class: '!text-red-500' },
            }" />
        </div>
      </div>

      <div v-else
        class="flex flex-col items-center justify-center p-12 mx-6 bg-[#1A1A1F]/50 border border-zinc-800/50 rounded-2xl">
        <i class="mb-3 text-3xl text-zinc-600 pi pi-circle"></i>
        <span class="text-xs font-black text-zinc-500 uppercase tracking-widest">Sin Neumáticos</span>
      </div>
    </section>

  </main>

  <BarraNavegacion />
</template>
