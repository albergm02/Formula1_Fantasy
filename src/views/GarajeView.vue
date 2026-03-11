<script setup>
import { useRouter } from 'vue-router'
import { useFantasyStore } from '@/stores/storeFantasy'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

import Button from 'primevue/button'
import Card from 'primevue/card'
import Navbar from '@/components/Navbar.vue'
import Header from '@/components/Header.vue'

const router = useRouter()
const partida = useFantasyStore()
const toast = useToast()
const confirm = useConfirm()


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

// 2. Separamos el despido de pilotos
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

// 3. Conectamos con el nuevo nombre de la función de piezas
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
        <div class="mb-4 border-l-4 border-zinc-500 pl-2">
          <h2 class="text-lg font-black italic text-white uppercase tracking-wide">Mi Monoplaza (1/1)</h2>
        </div>

        <Card v-if="partida.garaje.coche"
          class="!bg-zinc-900 !border !border-zinc-800 !shadow-none w-full md:w-1/2 overflow-hidden">
          <template #header>
            <div class="relative aspect-[4/3] bg-zinc-800/30">
              <img :src="partida.garaje.coche.imagen" class="absolute inset-0 w-full h-full object-cover" />
              <div
                class="absolute top-2 left-2 bg-zinc-900/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-black text-white">
                {{ partida.garaje.coche.nombre }} <span class="text-emerald-500 ml-1">{{ partida.garaje.coche.precio
                }}M</span>
              </div>
            </div>
          </template>
          <template #footer>
            <Button @click="confirmarVentaCoche(partida.garaje.coche)" label="VENDER" icon="pi pi-shopping-bag"
              class="!w-full !bg-transparent !text-zinc-400 !border !border-zinc-800 hover:!border-red-500 hover:!text-red-500 !text-xs !font-black" />
          </template>
        </Card>

        <div v-else
          class="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-400">
          <i class="pi pi-car text-3xl mb-2"></i>
          <span class="text-xs font-bold uppercase">Sin Chasis</span>
        </div>
      </section>

      <section>
        <div class="mb-4 border-l-4 border-zinc-500 pl-2">
          <h2 class="text-lg font-black italic text-white uppercase tracking-wide">Mis Asientos ({{
            partida.garaje.pilotos.length }}/2)</h2>
        </div>

        <div v-if="partida.garaje.pilotos.length > 0" class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card v-for="piloto in partida.garaje.pilotos" :key="piloto.idInstancia"
            class="!bg-zinc-900 !border !border-zinc-800 !shadow-none overflow-hidden flex flex-col h-full">
            <template #header>
              <div class="relative aspect-[3/4] bg-zinc-800/30">
                <img :src="piloto.imagen" class="absolute inset-0 w-full h-full object-cover" />
                <div
                  class="absolute bottom-2 left-2 right-2 bg-zinc-900/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-black text-white truncate text-center">
                  {{ piloto.nombre }}
                </div>
              </div>
            </template>
            <template #footer>
              <Button @click="confirmarDespido(piloto)" label="DESPEDIR" icon="pi pi-user-minus"
                class="!w-full !p-2 !bg-transparent !text-zinc-400 !border !border-zinc-800 hover:!border-red-500 hover:!text-red-500 !text-xs !font-black" />
            </template>
          </Card>
        </div>

        <div v-else
          class="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-400">
          <i class="pi pi-users text-3xl mb-2"></i>
          <span class="text-xs font-bold uppercase">Asientos Vacíos</span>
        </div>
      </section>

      <section class="mb-10">
        <div class="mb-4 border-l-4 border-zinc-500 pl-2">
          <h2 class="text-lg font-black italic text-white uppercase tracking-wide">Inventario de Piezas</h2>
        </div>

        <div v-if="partida.garaje.potenciadores.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card v-for="pieza in partida.garaje.potenciadores" :key="pieza.idInstancia"
            class="!bg-zinc-900 !border !shadow-none overflow-hidden transition-colors"
            :class="pieza.equipado ? '!border-red-600' : '!border-zinc-800'">
            <template #header>
              <div class="relative aspect-square p-4 bg-zinc-800/10 flex items-center justify-center">
                <img :src="pieza.imagen" class="w-full h-full object-contain drop-shadow-lg transition-all"
                  :class="!pieza.equipado && 'opacity-50 grayscale'" />

                <Button @click="intentarEquiparPieza(pieza.idInstancia)"
                  :icon="pieza.equipado ? 'pi pi-minus' : 'pi pi-plus'"
                  class="!absolute !top-2 !right-2 !w-8 !h-8 !rounded-full !p-0 !text-white transition-colors"
                  :class="pieza.equipado ? '!bg-red-600 !border-none' : '!bg-zinc-800 !border-none hover:!bg-zinc-700'" />
              </div>
            </template>
            <template #content>
              <div class="text-center pt-2">
                <p class="text-[10px] font-black uppercase text-white truncate">{{ pieza.nombre }}</p>
                <span class="text-[9px] font-bold" :class="pieza.equipado ? 'text-emerald-500' : 'text-zinc-400'">
                  {{ pieza.equipado ? 'INSTALADO' : 'EN LA CAJA' }}
                </span>
              </div>
            </template>
          </Card>
        </div>

        <div v-else
          class="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-400">
          <i class="pi pi-cog text-3xl mb-2"></i>
          <span class="text-xs font-bold uppercase">Sin Mejoras Compradas</span>
        </div>
      </section>

    </main>

    <Navbar />

  </div>
</template>