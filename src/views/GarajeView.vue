<script setup>
import { useRouter } from 'vue-router'
import { useFantasyStore } from '@/stores/storeFantasy'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

import Button from 'primevue/button'
import Header from '@/components/Header.vue'
import Navbar from '@/components/Navbar.vue'
import CartaCoche from '@/components/CartaCoche.vue'
import CartaPiloto from '@/components/CartaPiloto.vue'
import CartaPotenciador from '@/components/CartaPotenciador.vue'

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
      toast.add({
        severity: 'success',
        summary: 'Venta completada',
        detail: `Has recuperado ${coche.precio}M`,
        life: 3000,
      })
    },
  })
}

const confirmarDespido = (piloto) => {
  confirm.require({
    message: `¿Estás seguro de que quieres despedir a ${piloto.nombre} por ${piloto.precio}M?`,
    header: 'Confirmar Despido',
    icon: 'pi pi-user-minus',
    acceptLabel: 'Sí, despedir',
    rejectLabel: 'Cancelar',
    /* Al aceptar, se llama a la función de despedir piloto en el store, 
    pasando el id de instancia del piloto a despedir. 
    Luego se muestra un toast de éxito indicando que el despido se ha completado y cuánto dinero se ha recuperado. */
    accept() {
      partida.despedirPiloto(piloto.idInstancia)
      toast.add({
        severity: 'success',
        summary: 'Despido completado',
        detail: `Has recuperado ${piloto.precio}M`,
        life: 3000,
      })
    },
  })
}

/* La función intentarEquiparPieza se encarga de intentar equipar una pieza de mejora en el coche.
Recibe como parámetro el id de instancia de la pieza que se desea equipar. */
const intentarEquiparPieza = (idInstancia) => {
  const respuesta = partida.instalarMejora(idInstancia)

  if (respuesta && !respuesta.exito) {
    toast.add({
      severity: 'warn',
      summary: 'Acción denegada',
      detail: respuesta.mensaje,
      life: 3000,
    })
  }
}
</script>

<template>
  <div class="min-h-screen w-full font-sans pb-30">
    <Header />

    <main class="mx-auto w-full p-4 mt-4 flex flex-col gap-8">
      <Card class="!bg-[#15151E] !border-[#FF1E00] pl-2">
        <div class="mb-4">
          <h2 class="text-lg font-black italic text-white uppercase tracking-wide">
            Monoplaza 
          </h2>
        </div>

        <div v-if="partida.garaje.coche" class="w-full max-w-lg mx-auto flex flex-col gap-0">
          <div class="w-full aspect-[3/2]">
            <CartaCoche :coche="partida.garaje.coche" :modoMercado="false" />
          </div>
          <Button
            @click="confirmarVentaCoche(partida.garaje.coche)"
            class="w-full !bg-[#15151E] !border-t-0 justify-center group transition-colors"
          >
            <i
              class="pi pi-shopping-bag text-xs text-red-500 group-hover:text-white transition-colors mr-2"
            ></i>
            <span class="text-xs font-black text-red-500 group-hover:text-white transition-colors">
              VENDER POR {{ partida.garaje.coche.precio }}M
            </span>
          </Button>
        </div>

        <div
          v-else
          class="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500 bg-zinc-900/30"
        >
          <i class="pi pi-car text-4xl mb-3"></i>
          <span class="text-sm font-bold uppercase tracking-widest">Sin Chasis</span>
        </div>
      </Card>

      <section>
        <div class="mb-4 border-l-4 border-zinc-500 pl-2">
          <h2 class="text-lg font-black italic text-white uppercase tracking-wide">
            Mis Asientos ({{ partida.garaje.pilotos.length }}/2)
          </h2>
        </div>

        <div
          v-if="partida.garaje.pilotos.length > 0"
          class="grid grid-cols-2 gap-4 max-w-lg mx-auto w-full"
        >
          <div
            v-for="piloto in partida.garaje.pilotos"
            :key="piloto.idInstancia"
            class="flex flex-col gap-0 w-full"
          >
            <div class="w-full aspect-[2/3]">
              <CartaPiloto :piloto="piloto" :modoMercado="false" />
            </div>
            <Button
              @click="confirmarDespido(piloto)"
              class="w-full !bg-[#15151E] !border-t-0 py-3 flex items-center justify-center group transition-colors"
            >
              <i
                class="pi pi-user-minus text-xs text-red-500 group-hover:text-white transition-colors mr-2"
              ></i>
              <span
                class="text-xs font-black text-red-500 group-hover:text-white transition-colors"
              >
                DESPEDIR ({{ piloto.precio }}M)
              </span>
            </Button>
          </div>
        </div>

        <div
          v-else
          class="flex flex-col items-center justify-center p-10 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500 bg-zinc-900/30"
        >
          <i class="pi pi-users text-4xl mb-3"></i>
          <span class="text-xs font-bold uppercase tracking-widest">Sin Pilotos Contratados</span>
        </div>
      </section>

      <section class="mb-10">
        <div class="mb-4 border-l-4 border-zinc-500 pl-2">
          <h2 class="text-lg font-black italic text-white uppercase tracking-wide">
            Inventario de Piezas
          </h2>
        </div>

        <div
          v-if="partida.garaje.potenciadores.length > 0"
          class="grid grid-cols-2 md:grid-cols-4 gap-4 mx-auto w-full"
        >
          <div
            v-for="pieza in partida.garaje.potenciadores"
            :key="pieza.idInstancia"
            class="flex flex-col gap-0 relative w-full"
          >
            <div class="aspect-square w-full">
              <CartaPotenciador :potenciador="pieza" :modoMercado="false" />
            </div>

            <Button
              @click="intentarEquiparPieza(pieza.idInstancia)"
              class="w-full py-3 flex items-center justify-center group transition-colors rounded-b-xl rounded-t-none border-t-0 shadow-lg"
              :class="
                pieza.equipado
                  ? '!bg-emerald-600 !border-emerald-500 hover:!bg-emerald-500'
                  : '!bg-zinc-800 !border-zinc-800 hover:!bg-emerald-600'
              "
            >
              <i
                class="text-xs transition-colors mr-2"
                :class="
                  pieza.equipado
                    ? 'pi pi-check-circle text-white'
                    : 'pi pi-cog text-emerald-500 group-hover:text-white'
                "
              ></i>
              <span
                class="text-xs font-black transition-colors"
                :class="pieza.equipado ? 'text-white' : 'text-emerald-500 group-hover:text-white'"
              >
                {{ pieza.equipado ? 'INSTALADO' : 'INSTALAR' }}
              </span>
            </Button>
          </div>
        </div>

        <div
          v-else
          class="flex flex-col items-center justify-center p-10 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500 bg-zinc-900/30"
        >
          <i class="pi pi-box text-4xl mb-3"></i>
          <span class="text-xs font-bold uppercase tracking-widest">Sin Mejoras Compradas</span>
        </div>
      </section>
    </main>

    <Navbar />
  </div>
</template>
