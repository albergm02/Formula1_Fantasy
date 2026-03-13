<script setup>
import { useFantasyStore } from '@/stores/storeFantasy'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

import Button from 'primevue/button'
import Header from '@/components/Header.vue'
import Navbar from '@/components/Navbar.vue'
import CartaCoche from '@/components/CartaCoche.vue'
import CartaPiloto from '@/components/CartaPiloto.vue'
import CartaPotenciador from '@/components/CartaPotenciador.vue'

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
const intentarEquiparPieza = async (idInstancia) => {
  const respuesta = await partida.instalarMejora(idInstancia)

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
      <!-- Carta para colocar el coche -->
      <div
        class="!bg-[#15151E]/20 !border-[#FF1E00] flex flex-col items-center max-w-2xl mx-auto w-full"
      >
        <div class="mb-4 mt-4 w-full flex justify-center">
          <h2 class="text-lg font-black text-white text-center">MI MONOPLAZA</h2>
        </div>

        <div v-if="partida.garaje.coche" class="w-full">
          <div class="w-full">
            <!-- modoMercado false para ocultar el boton de fichar -->
            <CartaCoche :coche="partida.garaje.coche" :modoMercado="false" />
          </div>
            <Button
            @click="confirmarVentaCoche(partida.garaje.coche)"
            class="w-full !bg-[#15151E] !border-transparent !rounded-none justify-center group transition-colors"
          >
            <i
              class="pi pi-shopping-bag text-xs text-red-500 group-hover:text-white transition-colors"
            ></i>
            <span class="text-xs font-black text-red-500 group-hover:text-white transition-colors">
              VENDER POR
              {{ Math.round(partida.garaje.coche.precio - partida.garaje.coche.precio / 3) }}M
            </span>
          </Button>
        </div>

        <div
          v-else
          class="items-center justify-center p-12 mb-4 text-zinc-500"
        >
          <i class="pi pi-car text-4xl mb-4 mr-4"></i>
          <span class="text-sm font-bold">SIN MONOPLAZA</span>
        </div>
      </div>

      <!-- Cartas para colocar los pilotos -->
      <div
        class="!bg-[#15151E]/20 !border-[#FF1E00] flex flex-col items-center max-w-2xl mx-auto w-full"
      >
        <div class="mb-4 mt-4 w-full flex justify-center">
          <h2 class="text-lg font-black text-white text-center">
            MIS PILOTOS ({{ partida.garaje.pilotos.length }}/2)
          </h2>
        </div>

        <div class="w-full grid grid-cols-2 gap-4">
          <template v-for="i in 2">
            <div v-if="partida.garaje.pilotos[i - 1]" class="flex flex-col gap-0 w-full">
              <div class="w-full">
                <CartaPiloto :piloto="partida.garaje.pilotos[i - 1]" :modoMercado="false" />
              </div>
              <Button
                @click="confirmarDespido(partida.garaje.pilotos[i - 1])"
                class="w-full !bg-[#15151E] !border-transparent !rounded-none justify-center group transition-colors"
              >
                <i
                  class="pi pi-user-minus text-xs text-red-500 group-hover:text-white transition-colors"
                ></i>
                <span
                  class="text-xs font-black text-red-500 group-hover:text-white transition-colors"
                >
                  DESPEDIR POR
                  {{
                    Math.round(
                      partida.garaje.pilotos[i - 1].precio -
                        partida.garaje.pilotos[i - 1].precio / 3,
                    )
                  }}M
                </span>
              </Button>
            </div>
            <div
              v-else
              class="flex flex-col items-center justify-center p-12 text-zinc-500"
            >
              <i class="pi pi-user text-4xl mb-3"></i>
              <span class="text-sm font-bold uppercase tracking-widest">Asiento Vacío</span>
            </div>
          </template>
        </div>
      </div>

      <!-- Cartas para colocar los potenciadores -->
      <div
        class="!bg-[#15151E]/20 !border-[#FF1E00] flex flex-col items-center max-w-2xl mx-auto w-full"
      >
        <div class="mb-4 mt-4 w-full flex justify-center">
          <h2 class="text-lg font-black text-white text-center">
        MIS POTENCIADORES ({{ partida.garaje.potenciadores.length }}/4)
          </h2>
        </div>

        <div class="w-full grid grid-cols-2 grid-rows-2 gap-4">
          <template v-for="i in 4">
        <div v-if="partida.garaje.potenciadores[i - 1]" class="flex flex-col gap-0 w-full">
          <div class="w-full">
            <CartaPotenciador
          :potenciador="partida.garaje.potenciadores[i - 1]"
          :modoMercado="false"
            />
          </div>
          <Button
            @click="intentarEquiparPieza(partida.garaje.potenciadores[i - 1].idInstancia)"
            class="w-full !bg-[#15151E] !border-transparent !rounded-none justify-center group transition-colors"
            :class="
              partida.garaje.potenciadores[i - 1].equipado
                ? '!bg-[#00FF7F] !border-[#00FF7F] hover:!bg-[#00FF7F]/80'
                : '!bg-[#15151E] !border-[#15151E] hover:!bg-[#00FF7F]'
            "
          >
            <i
              class="text-xs transition-colors mr-2"
              :class="
                partida.garaje.potenciadores[i - 1].equipado
                  ? 'pi pi-check-circle text-white'
                  : 'pi pi-cog text-[#00FF7F] group-hover:text-white'
              "
            ></i>
            <span
              class="text-xs font-black transition-colors"
              :class="
                partida.garaje.potenciadores[i - 1].equipado
                  ? 'text-white'
                  : 'text-[#00FF7F] group-hover:text-white'
              "
            >
              {{ partida.garaje.potenciadores[i - 1].equipado ? 'INSTALADO' : 'INSTALAR' }}
            </span>
          </Button>
        </div>
        <div
          v-else
          class="flex flex-col items-center justify-center p-12 text-zinc-500"
        >
          <i class="pi pi-box text-4xl mb-3"></i>
          <span class="text-sm font-bold uppercase tracking-widest"
            >SIN POTENCIADOR</span
          >
        </div>
          </template>
        </div>
      </div>
    </main>

    <Navbar />
  </div>
</template>
