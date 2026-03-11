<script setup>
import { useRouter } from 'vue-router'
import { useFantasyStore } from '@/stores/storeFantasy'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

// Importamos la cabecera, la barra inferior y NUESTRAS CARTAS
import Header from '@/components/Header.vue'
import Navbar from '@/components/Navbar.vue'
import CartaCoche from '@/components/CartaCoche.vue'
import CartaPiloto from '@/components/CartaPiloto.vue'
import CartaPotenciador from '@/components/CartaPotenciador.vue'

const router = useRouter()
const partida = useFantasyStore()
const toast = useToast()
const confirm = useConfirm()

// Lógica de ventas y despidos
const confirmarVentaCoche = (coche) => {
  confirm.require({
    message: `¿Estás seguro de que quieres vender a ${coche.nombre} por ${coche.precio}M?`,
    header: 'Confirmar Venta',
    icon: 'pi pi-shopping-bag',
    acceptLabel: 'Sí, vender',
    rejectLabel: 'Cancelar',
    accept() {
      partida.venderCoche()
      toast.add({ severity: 'success', summary: 'Venta completada', detail: `Has recuperado ${coche.precio}M`, life: 3000 })
    }
  })
}

const confirmarDespido = (piloto) => {
  confirm.require({
    message: `¿Estás seguro de que quieres despedir a ${piloto.nombre} por ${piloto.precio}M?`,
    header: 'Confirmar Despido',
    icon: 'pi pi-user-minus',
    acceptLabel: 'Sí, despedir',
    rejectLabel: 'Cancelar',
    accept() {
      partida.despedirPiloto(piloto.idInstancia)
      toast.add({ severity: 'success', summary: 'Despido completado', detail: `Has recuperado ${piloto.precio}M`, life: 3000 })
    }
  })
}

const intentarEquiparPieza = (idInstancia) => {
  const respuesta = partida.instalarMejora(idInstancia)

  if (respuesta && !respuesta.exito) {
    toast.add({ severity: 'warn', summary: 'Acción denegada', detail: respuesta.mensaje, life: 3000 })
  }
}
</script>

<template>
  <div class="min-h-screen w-full font-sans pb-28">

    <Header />

    <main class="mx-auto w-full max-w-5xl p-4 flex flex-col gap-8 mt-4">

      <section>
        <div v-if="partida.garaje.coche" class="flex flex-col gap-2 w-full max-w-2xl mx-auto">
          <div class="w-full min-h-[250px]">
            <CartaCoche :coche="partida.garaje.coche" :modoMercado="false" />
          </div>
          <button @click="confirmarVentaCoche(partida.garaje.coche)"
            class="w-full bg-zinc-800 py-3 flex items-center justify-center gap-2 hover:bg-red-600 group transition-colors">
            <i class="pi pi-shopping-bag text-xs text-red-500 group-hover:text-white transition-colors"></i>
            <span class="text-xs font-black text-red-500 group-hover:text-white transition-colors">VENDER POR {{
              partida.garaje.coche.precio }}M</span>
          </button>
        </div>

        <div v-else class="flex flex-col items-center justify-center p-12">
          <i class="pi pi-car text-4xl mb-3"></i>
          <span class="text-sm font-bold uppercase tracking-widest">Sin Chasis</span>
        </div>
      </section>

      <section>
        <div v-if="partida.garaje.pilotos.length > 0" class="flex flex-wrap justify-center gap-4">
          <div v-for="piloto in partida.garaje.pilotos" :key="piloto.idInstancia"
            class="flex flex-col gap-2 w-full sm:w-[calc(50%-1rem)] md:w-[calc(33.333%-1rem)]">

            <div class="aspect-[3/4] w-full">
              <CartaPiloto :piloto="piloto" :modoMercado="false" />
            </div>

            <button @click="confirmarDespido(piloto)"
              class="w-full bg-zinc-800 py-3 flex items-center justify-center gap-2 hover:bg-red-600 group transition-colors rounded-xl border border-zinc-800 shadow-lg">
              <i class="pi pi-user-minus text-xs text-red-500 group-hover:text-white transition-colors"></i>
              <span class="text-xs font-black text-red-500 group-hover:text-white transition-colors">DESPEDIR ({{
                piloto.precio }}M)</span>
            </button>

          </div>
        </div>

        <div v-else
          class="flex flex-col items-center justify-center p-10 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500 bg-zinc-900/30">
          <i class="pi pi-users text-4xl mb-3"></i>
          <span class="text-xs font-bold uppercase tracking-widest">Asientos Vacíos</span>
        </div>
      </section>

      <section class="mb-10">

        <div v-if="partida.garaje.potenciadores.length > 0" class="flex flex-wrap justify-center gap-4">
          <div v-for="pieza in partida.garaje.potenciadores" :key="pieza.idInstancia"
            class="flex flex-col gap-2 relative w-[calc(50%-0.5rem)] md:w-[calc(25%-1rem)]">

            <div class="aspect-square w-full">
              <CartaPotenciador :potenciador="pieza" :modoMercado="false" />
            </div>

            <button @click="intentarEquiparPieza(pieza.idInstancia)"
              class="w-full py-3 flex items-center justify-center gap-2 group transition-colors rounded-xl border shadow-lg"
              :class="pieza.equipado ? 'bg-emerald-600 border-emerald-500 hover:bg-emerald-500' : 'bg-zinc-800 border-zinc-800 hover:bg-emerald-600'">
              <i class="text-xs transition-colors"
                :class="pieza.equipado ? 'pi pi-check-circle text-white' : 'pi pi-cog text-emerald-500 group-hover:text-white'"></i>
              <span class="text-xs font-black transition-colors"
                :class="pieza.equipado ? 'text-white' : 'text-emerald-500 group-hover:text-white'">
                {{ pieza.equipado ? 'INSTALADO' : 'INSTALAR' }}
              </span>
            </button>

          </div>
        </div>

        <div v-else
          class="flex flex-col items-center justify-center p-10 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500 bg-zinc-900/30">
          <i class="pi pi-box text-4xl mb-3"></i>
          <span class="text-xs font-bold uppercase tracking-widest">Sin Mejoras Compradas</span>
        </div>
      </section>

    </main>

    <Navbar />

  </div>
</template>