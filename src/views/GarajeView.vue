<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useEscuderiaStore } from '@/stores/storeEscuderia'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

import Header from '@/components/Header.vue'
import Navbar from '@/components/Navbar.vue'
import CartaCoche from '@/components/CartaCoche.vue'
import CartaPiloto from '@/components/CartaPiloto.vue'
import CartaPotenciador from '@/components/CartaPotenciador.vue'

const escuderiaStore = useEscuderiaStore()
const toast = useToast()
const confirm = useConfirm()
const route = useRoute()

// Solución al F5 para mantener estado
onMounted(async () => {
  if (!escuderiaStore.ligaActivaId && route.query.liga) {
    await escuderiaStore.cargarEscuderia(route.query.liga)
  }
})

const confirmarVentaCoche = (coche) => {
  confirm.require({
    message: `¿Estás seguro de que quieres vender el chasis ${coche.nombre} por ${Math.floor(coche.precio / 2)}M?`,
    header: 'Confirmar Venta',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, vender',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const respuesta = await escuderiaStore.vender(coche)
      if (respuesta && !respuesta.exito) {
        toast.add({ severity: 'warn', summary: 'Venta denegada', detail: respuesta.mensaje, life: 3000 })
      } else {
        toast.add({ severity: 'success', summary: 'Venta completada', detail: `Has recuperado ${Math.floor(coche.precio / 2)}M`, life: 3000 })
      }
    }
  })
}

const confirmarDespido = (piloto) => {
  confirm.require({
    message: `¿Estás seguro de que quieres rescindir el contrato de ${piloto.nombre} por ${Math.floor(piloto.precio / 2)}M?`,
    header: 'Confirmar Despido',
    icon: 'pi pi-user-minus',
    acceptLabel: 'Sí, despedir',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const respuesta = await escuderiaStore.vender(piloto)
      if (respuesta && !respuesta.exito) {
        toast.add({ severity: 'warn', summary: 'Despido denegado', detail: respuesta.mensaje, life: 3000 })
      } else {
        toast.add({ severity: 'success', summary: 'Despido completado', detail: `Has recuperado ${Math.floor(piloto.precio / 2)}M`, life: 3000 })
      }
    }
  })
}

const intentarEquiparPieza = async (idInstancia) => {
  const respuesta = await escuderiaStore.togglePotenciador(idInstancia)
  if (respuesta && !respuesta.exito) {
    toast.add({ severity: 'warn', summary: 'Acción denegada', detail: respuesta.mensaje, life: 3000 })
  } else {
    toast.add({ severity: 'success', summary: 'Acción completada', detail: respuesta.mensaje, life: 3000 })
  }
}
</script>

<template>
  <Header />

  <main class="p-4 flex flex-col gap-6 mt-4 mb-24 max-w-3xl mx-auto w-full">

    <section class="grid">
      <div v-if="escuderiaStore.garaje.coche" class="flex flex-col w-full h-full">

        <CartaCoche :coche="escuderiaStore.garaje.coche" :modoMercado="false" />

        <div class="px-6 pb-2 -mt-1">
          <button @click="confirmarVentaCoche(escuderiaStore.garaje.coche)"
            class="w-full bg-[#111111] border border-zinc-800 hover:border-red-900/50 py-4 flex items-center justify-center cursor-pointer transition-colors shadow-lg rounded-xl group">
            <i class="pi pi-shopping-bag text-sm text-red-500 mr-2 group-hover:scale-110 transition-transform"></i>
            <span class="text-white text-[10px] font-black uppercase tracking-widest">
              VENDER POR {{ Math.floor(escuderiaStore.garaje.coche.precio / 2) }}M
            </span>
          </button>
        </div>
      </div>

      <div v-else
        class="flex flex-col items-center justify-center p-12 border border-zinc-800/50 bg-[#15151E]/50 rounded-2xl mx-6">
        <i class="pi pi-car text-3xl text-zinc-600 mb-3"></i>
        <span class="text-xs font-black text-zinc-500 uppercase tracking-widest">Garaje Vacío</span>
      </div>
    </section>

    <section class="grid grid-cols-1 md:grid-cols-2 gap-6">

      <template v-if="escuderiaStore.garaje.pilotos.length > 0">
        <div v-for="piloto in escuderiaStore.garaje.pilotos" :key="piloto.instancia_id"
          class="flex flex-col w-full h-full">

          <CartaPiloto :piloto="piloto" :modoMercado="false" />

          <div class="px-6 pb-2 -mt-1">
            <button @click="confirmarDespido(piloto)"
              class="w-full bg-[#111111] border border-zinc-800 hover:border-red-900/50 py-4 flex items-center justify-center cursor-pointer transition-colors shadow-lg rounded-xl group">
              <i class="pi pi-user-minus text-sm text-red-500 mr-2 group-hover:scale-110 transition-transform"></i>
              <span class="text-white text-[10px] font-black uppercase tracking-widest">
                DESPEDIR ({{ Math.floor(piloto.precio / 2) }}M)
              </span>
            </button>
          </div>
        </div>
      </template>

      <div v-else
        class="col-span-full flex flex-col items-center justify-center p-12 border border-zinc-800/50 bg-[#15151E]/50 rounded-2xl mx-6">
        <i class="pi pi-users text-3xl text-zinc-600 mb-3"></i>
        <span class="text-xs font-black text-zinc-500 uppercase tracking-widest">Asientos Vacíos</span>
      </div>
    </section>

    <section class="grid">
      <div v-if="escuderiaStore.garaje.potenciadores.length > 0" class="grid grid-cols-2 gap-6 px-6">

        <div v-for="pieza in escuderiaStore.garaje.potenciadores" :key="pieza.instancia_id"
          class="flex flex-col w-full h-full">

          <div class="aspect-square w-full">
            <CartaPotenciador :potenciador="pieza" :modoMercado="false" />
          </div>

          <button @click="intentarEquiparPieza(pieza.instancia_id)"
            class="w-full py-3 mt-2 flex items-center justify-center cursor-pointer transition-colors rounded-xl shadow-lg group"
            :class="pieza.equipado
              ? 'bg-emerald-900/20 border border-emerald-500/50 text-emerald-400'
              : 'bg-[#111111] border border-zinc-800 text-zinc-400 hover:text-white'">
            <i class="text-[10px] mr-2"
              :class="pieza.equipado ? 'pi pi-check-circle text-emerald-400' : 'pi pi-cog text-zinc-500 group-hover:text-white transition-colors'"></i>
            <span class="text-[10px] font-black uppercase tracking-widest"
              :class="pieza.equipado ? 'text-emerald-400' : 'text-white'">
              {{ pieza.equipado ? 'INSTALADO' : 'INSTALAR' }}
            </span>
          </button>

        </div>
      </div>

      <div v-else
        class="flex flex-col items-center justify-center p-12 border border-zinc-800/50 bg-[#15151E]/50 rounded-2xl mx-6">
        <i class="pi pi-box text-3xl text-zinc-600 mb-3"></i>
        <span class="text-xs font-black text-zinc-500 uppercase tracking-widest">Sin Mejoras Compradas</span>
      </div>
    </section>

  </main>

  <Navbar />
</template>