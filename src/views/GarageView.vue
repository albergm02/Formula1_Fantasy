<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

/* Stores y utilidades */
import { useEscuderiaStore } from '@/stores/storeTeam'
import { calculateResaleValue } from '@/utils/garage'

/* Componentes UI */
import Header from '@/components/Header.vue'
import Navbar from '@/components/Navbar.vue'
import CarCard from '@/components/CarCard.vue'
import DriverCard from '@/components/DriverCard.vue'
import BoosterCard from '@/components/BoosterCard.vue'

const escuderiaStore = useEscuderiaStore()
const toast = useToast()
const confirm = useConfirm()
const route = useRoute()

/* Si no hay liga activa en el store, intentamos recuperarla de la query */
onMounted(async () => {
  if (!escuderiaStore.activeLeagueId && route.query.liga) {
    await escuderiaStore.loadTeam(route.query.liga)
  }
})

/* Handler Venta de coche: pide confirmación y ejecuta la venta */
const confirmCarSale = (car) => {
  const resaleValue = calculateResaleValue(car.precio)

  confirm.require({
    icon: 'pi pi-exclamation-triangle',
    message: `¿Estás seguro de que quieres vender el chasis ${car.nombre} por ${resaleValue}M?`,
    header: 'Confirmar Venta',
    acceptLabel: 'Sí, vender',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const result = await escuderiaStore.sellItem(car)
      if (result.success) {
        toast.add({ severity: 'success', summary: 'Venta completada', detail: `Has recuperado ${resaleValue}M` })
      } else {
        toast.add({ severity: 'warn', summary: 'Venta denegada', detail: result.message })
      }
    },
  })
}

/* Handler Despido de piloto: pide confirmación y ejecuta el despido */
const confirmDriverSale = (driver) => {
  const resaleValue = calculateResaleValue(driver.precio)

  confirm.require({
    icon: 'pi pi-exclamation-triangle',
    message: `¿Estás seguro de que quieres rescindir el contrato de ${driver.nombre} por ${resaleValue}M?`,
    header: 'Confirmar Despido',
    icon: 'pi pi-user-minus',
    acceptLabel: 'Sí, despedir',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const result = await escuderiaStore.sellItem(driver)
      if (result.success) {
        toast.add({ severity: 'success', summary: 'Despido completado', detail: `Has recuperado ${resaleValue}M` })
      } else {
        toast.add({ severity: 'warn', summary: 'Despido denegado', detail: result.message })
      }
    },
  })
}

/* Handler Instalar/Desinstalar potenciador */
const toggleBoosterInstallation = async (instanceId) => {
  const result = await escuderiaStore.toggleBooster(instanceId)
  if (result.success) {
    toast.add({ severity: 'success', summary: 'Acción completada', detail: result.message })
  } else {
    toast.add({ severity: 'warn', summary: 'Acción denegada', detail: result.message })
  }
}
</script>

<!-------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!-------------------------------------------------------------------------------------------------------------------------->

<template>
  <Header />

  <main class="p-4 flex flex-col gap-6 mt-4 mb-24 max-w-md mx-auto w-full">
    <!-- Sección: Coche -->
    <section class="grid">
      <div v-if="escuderiaStore.garage.coche" class="flex flex-col w-full h-full">
        <CarCard :coche="escuderiaStore.garage.coche" :modoMercado="false" />

        <!-- Botón de venta del coche -->
        <div class="px-6 pb-2 -mt-1">
          <button @click="confirmCarSale(escuderiaStore.garage.coche)"
            class="w-full bg-[#121218] border border-zinc-800 hover:border-red-900/50 py-4 flex items-center justify-center cursor-pointer transition-colors shadow-lg rounded-xl group">
            <i class="pi pi-shopping-bag text-sm text-red-500 mr-2 group-hover:scale-110 transition-transform"></i>
            <span class="text-white text-[10px] font-black uppercase tracking-widest">
              VENDER POR {{ calculateResaleValue(escuderiaStore.garage.coche.precio) }}M
            </span>
          </button>
        </div>
      </div>

      <div v-else
        class="flex flex-col items-center justify-center p-12 border border-zinc-800/50 bg-[#1A1A1F]/50 rounded-2xl mx-6">
        <i class="pi pi-car text-3xl text-zinc-600 mb-3"></i>
        <span class="text-xs font-black text-zinc-500 uppercase tracking-widest">Garaje Vacío</span>
      </div>
    </section>

    <!-- Sección: Pilotos -->
    <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <template v-if="escuderiaStore.garage.pilotos.length > 0">
        <div v-for="driver in escuderiaStore.garage.pilotos" :key="driver.instancia_id"
          class="flex flex-col w-full h-full">
          <DriverCard :piloto="driver" :modoMercado="false" />

          <!-- Botón de despido del piloto -->
          <div class="px-6 pb-2 -mt-1">
            <button @click="confirmDriverSale(driver)"
              class="w-full bg-[#121218] border border-zinc-800 hover:border-red-900/50 py-4 flex items-center justify-center cursor-pointer transition-colors shadow-lg rounded-xl group">
              <i class="pi pi-user-minus text-sm text-red-500 mr-2 group-hover:scale-110 transition-transform"></i>
              <span class="text-white text-[10px] font-black uppercase tracking-widest">
                DESPEDIR ({{ calculateResaleValue(driver.precio) }}M)
              </span>
            </button>
          </div>
        </div>
      </template>

      <!-- Estado vacío: sin pilotos -->
      <div v-else
        class="col-span-full flex flex-col items-center justify-center p-12 border border-zinc-800/50 bg-[#1A1A1F]/50 rounded-2xl mx-6">
        <i class="pi pi-users text-3xl text-zinc-600 mb-3"></i>
        <span class="text-xs font-black text-zinc-500 uppercase tracking-widest">Asientos Vacíos</span>
      </div>
    </section>

    <section class="grid">
      <div v-if="escuderiaStore.garage.potenciadores.length > 0" class="grid grid-cols-2 gap-6 px-6">
        <div v-for="booster in escuderiaStore.garage.potenciadores" :key="booster.instancia_id"
          class="flex flex-col w-full h-full">
          <div class="aspect-square w-full">
            <BoosterCard :potenciador="booster" :modoMercado="false" />
          </div>

          <button @click="toggleBoosterInstallation(booster.instancia_id)"
            class="w-full py-3 mt-2 flex items-center justify-center cursor-pointer transition-colors rounded-xl shadow-lg group"
            :class="booster.equipado
              ? 'bg-emerald-900/20 border border-emerald-500/50 text-emerald-400'
              : 'bg-[#121218] border border-zinc-800 text-zinc-400 hover:text-white'">
            <i class="text-[10px] mr-2"
              :class="booster.equipado ? 'pi pi-check-circle text-emerald-400' : 'pi pi-cog text-zinc-500 group-hover:text-white transition-colors'"></i>
            <span class="text-[10px] font-black uppercase tracking-widest"
              :class="booster.equipado ? 'text-emerald-400' : 'text-white'">
              {{ booster.equipado ? 'INSTALADO' : 'INSTALAR' }}
            </span>
          </button>
        </div>
      </div>

      <div v-else
        class="flex flex-col items-center justify-center p-12 border border-zinc-800/50 bg-[#1A1A1F]/50 rounded-2xl mx-6">
        <i class="pi pi-box text-3xl text-zinc-600 mb-3"></i>
        <span class="text-xs font-black text-zinc-500 uppercase tracking-widest">Sin Mejoras Compradas</span>
      </div>
    </section>
  </main>

  <Navbar />
</template>