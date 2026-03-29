<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { usarStoreEscuderia } from '@/stores/storeEquipo'
import { calcularValorReventa } from '@/utils/garaje'
import { ruedasBase } from '@/data/bases/ruedasBase'
import Cabecera from '@/components/Cabecera.vue'
import BarraNavegacion from '@/components/BarraNavegacion.vue'
import TarjetaCoche from '@/components/TarjetaCoche.vue'
import TarjetaPiloto from '@/components/TarjetaPiloto.vue'
import TarjetaPotenciador from '@/components/TarjetaPotenciador.vue'

const storeEscuderia = usarStoreEscuderia()
const notificacion = useToast()
const confirmar = useConfirm()
const ruta = useRoute()

const mostrarSelectorNeumatico = ref(false)

/**
 * Convierte las mejoras de un compuesto en etiquetas con color para mostrar en la carta.
 * @param {Object} rueda - El objeto del compuesto de neumáticos.
 * @returns {Array<{ atributo: string, valor: number, signo: string, color: string }>}
 */
const calcularEtiquetasRueda = (rueda) => {
  if (!rueda?.mejoras) return []
  return Object.entries(rueda.mejoras)
    .filter(([, valor]) => valor !== 0)
    .map(([atributo, valor]) => ({
      atributo,
      valor,
      signo: valor > 0 ? '+' : '',
      color: valor > 0 ? 'text-emerald-400' : 'text-red-400',
    }))
}

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
  if (!resultado.success) {
    notificacion.add({ severity: 'warn', summary: 'Acción denegada', detail: resultado.message })
  }
}

/**
 * Equipa el compuesto seleccionado desde el selector y cierra el diálogo.
 * @param {string} idRueda - El id del compuesto a equipar.
 */
const seleccionarNeumatico = async (idRueda) => {
  const resultado = await storeEscuderia.equiparNeumatico(idRueda)
  if (resultado.success) {
    mostrarSelectorNeumatico.value = false
  } else {
    notificacion.add({ severity: 'warn', summary: 'Acción denegada', detail: resultado.message })
  }
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
              label: { class: 'text-[10px] font-black uppercase tracking-widest text-zinc-400' },
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

    <section class="grid">
      <div class="flex items-center gap-3 px-6 mb-3">
        <i class="pi pi-circle-fill text-white text-lg"></i>
        <h2 class="text-sm font-black text-white uppercase tracking-widest">Neumáticos</h2>
        <div class="flex-1 h-px bg-zinc-700"></div>
      </div>

      <div class="flex flex-col gap-3 px-6">
        <!-- Imagen pura del compuesto equipado, sin texto superpuesto -->
        <div v-if="storeEscuderia.garaje.ruedas"
          class="w-full h-[60px] overflow-hidden border border-emerald-500/50 bg-black relative">
          <img :src="storeEscuderia.garaje.ruedas.imagen" :alt="storeEscuderia.garaje.ruedas.nombre"
            class="absolute inset-0 w-full h-full object-cover" style="object-position: 65% center;" />
        </div>

        <!-- Sin neumáticos -->
        <div v-else
          class="flex flex-col items-center justify-center p-8 bg-[#1A1A1F]/50 border border-zinc-800/50 rounded-2xl">
          <i class="mb-3 text-3xl text-zinc-600 pi pi-circle"></i>
          <span class="text-xs font-black text-zinc-500 uppercase tracking-widest">Sin Neumáticos</span>
        </div>

        <!-- Botón selector -->
        <Button :label="storeEscuderia.garaje.ruedas ? 'CAMBIAR NEUMÁTICOS' : 'EQUIPAR NEUMÁTICOS'"
          icon="pi pi-circle-fill" @click="mostrarSelectorNeumatico = true"
          class="w-full !bg-[#121218] !border-zinc-800 hover:!border-zinc-600 shadow-lg !rounded-xl" :pt="{
            label: { class: 'text-[10px] font-black uppercase tracking-widest text-zinc-400' },
            icon: { class: 'text-zinc-500' },
          }" />

        <!-- Nombre y mejoras del compuesto equipado, desacoplado de la imagen -->
        <div v-if="storeEscuderia.garaje.ruedas" class="flex items-center gap-2 px-1">
          <i class="pi pi-circle-fill text-[8px]" :style="{ color: storeEscuderia.garaje.ruedas.color }"></i>
          <span class="text-xs font-black text-white uppercase tracking-wide">
            {{ storeEscuderia.garaje.ruedas.nombre }}
          </span>
          <div class="flex flex-wrap gap-1 ml-1">
            <span v-for="m in calcularEtiquetasRueda(storeEscuderia.garaje.ruedas)" :key="m.atributo"
              class="px-1.5 py-0.5 text-[8px] font-black uppercase bg-black/80 border border-zinc-700" :class="m.color">
              {{ m.signo }}{{ m.valor }} {{ m.atributo.slice(0, 3) }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Diálogo de selección de compuesto -->
    <Dialog v-model:visible="mostrarSelectorNeumatico" header="Seleccionar Compuesto" modal
      :headerStyle="{ backgroundColor: '#1A1A1F', color: 'white', borderBottom: '1px solid #2A2A32' }"
      :contentStyle="{ backgroundColor: '#1A1A1F', padding: '1.5rem' }"
      :style="{ width: '90vw', maxWidth: '400px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }">
      <div class="flex flex-col gap-4">
        <div v-for="rueda in ruedasBase" :key="rueda.id" class="flex flex-col gap-1 cursor-pointer"
          @click="seleccionarNeumatico(rueda.id)">
          <!-- Imagen pura -->
          <div class="relative w-full h-[60px] overflow-hidden bg-black transition-colors border" :class="storeEscuderia.garaje.ruedas?.id === rueda.id
            ? 'border-emerald-500/70'
            : 'border-zinc-700 hover:border-zinc-500'">
            <img :src="rueda.imagen" :alt="rueda.nombre" class="absolute inset-0 w-full h-full object-cover"
              style="object-position: 65% center;" />
          </div>
          <!-- Nombre y mejoras desacoplados -->
          <div class="flex items-center gap-2 px-1">
            <i class="pi pi-circle-fill text-[8px]" :style="{ color: rueda.color }"></i>
            <span class="text-xs font-black text-white uppercase tracking-wide">{{ rueda.nombre }}</span>
            <div class="flex flex-wrap gap-1 ml-1">
              <span v-for="m in calcularEtiquetasRueda(rueda)" :key="m.atributo"
                class="px-1.5 py-0.5 text-[8px] font-black uppercase bg-black/80 border border-zinc-700"
                :class="m.color">
                {{ m.signo }}{{ m.valor }} {{ m.atributo.slice(0, 3) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Dialog>

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
                label: { class: 'text-[10px] font-black uppercase tracking-widest text-zinc-400' },
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
        <span class="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border rounded-full" :class="storeEscuderia.garaje.potenciadores.filter(p => p.equipado).length >= 3
          ? 'text-amber-400 border-amber-500/50'
          : 'text-zinc-500 border-zinc-700'">{{storeEscuderia.garaje.potenciadores.filter(p => p.equipado).length
          }}/3</span>
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

  </main>

  <BarraNavegacion />
</template>
