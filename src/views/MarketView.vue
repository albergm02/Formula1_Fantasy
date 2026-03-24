<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'

/* Datos del mercado */
import { mercadoPilotos, mercadoPotenciadores, mercadoCoches } from '@/data/marketData'

/* Store */
import { useEscuderiaStore } from '@/stores/storeTeam'

/* Componentes UI */
import Navbar from '@/components/Navbar.vue'
import Header from '@/components/Header.vue'
import DriverCard from '@/components/DriverCard.vue'
import BoosterCard from '@/components/BoosterCard.vue'
import CarCard from '@/components/CarCard.vue'

const escuderiaStore = useEscuderiaStore()
const toast = useToast()
const route = useRoute()

/* Estados del mercado semanal */
const weeklyDriver = ref(null)
const weeklyCar = ref(null)
const weeklyBoosters = ref([])

/* Genera el mercado semanal: selecciona aleatoriamente 1 piloto Tier 2, 1 coche y 4 potenciadores */
const generateWeeklyMarket = () => {
  const featuredDrivers = mercadoPilotos
    .filter((driver) => driver.tier === 2)
    .sort(() => 0.5 - Math.random())
    .slice(0, 1)
    .map((driver) => ({ ...driver, tipo: 'piloto' }))

  const featuredCars = mercadoCoches
    .sort(() => 0.5 - Math.random())
    .slice(0, 1)
    .map((car) => ({ ...car, tipo: 'coche' }))

  weeklyDriver.value = featuredDrivers[0]
  weeklyCar.value = featuredCars[0]
  weeklyBoosters.value = mercadoPotenciadores
    .sort(() => 0.5 - Math.random())
    .slice(0, 4)
    .map((booster) => ({ ...booster, tipo: 'potenciador' }))
}

/* Si no hay liga activa, la recuperamos de la query. Luego generamos el mercado */
onMounted(async () => {
  if (!escuderiaStore.activeLeagueId && route.query.liga) {
    await escuderiaStore.loadTeam(route.query.liga)
  }

  generateWeeklyMarket()
})

/* Handler Compra de un ítem del mercado */
const handlePurchase = async (item) => {
  const result = await escuderiaStore.buyItem(item)

  if (result.success) {
    toast.add({ severity: 'success', summary: 'Fichaje exitoso', detail: `Has fichado a ${item.nombre} por ${item.precio}M` })
  } else {
    toast.add({ severity: 'error', summary: 'Fichaje fallido', detail: result.message })
  }
}
</script>

<!-------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!-------------------------------------------------------------------------------------------------------------------------->

<template>
  <Header />

  <main class="p-4 flex flex-col gap-6 mt-4 mb-20 max-w-md mx-auto w-full">

    <!-- Coche destacado de la semana -->
    <section class="grid">
      <CarCard v-if="weeklyCar" :coche="weeklyCar" :modoMercado="true" @fichar="handlePurchase" />
    </section>

    <!-- Piloto destacado de la semana -->
    <section class="grid">
      <DriverCard v-if="weeklyDriver" :piloto="weeklyDriver" :modoMercado="true" @fichar="handlePurchase" />
    </section>

    <!-- Potenciadores disponibles -->
    <section class="grid">
      <div class="grid grid-cols-2 gap-6">
        <div v-for="booster in weeklyBoosters" :key="booster.id" class="aspect-square">
          <BoosterCard :potenciador="booster" :modoMercado="true" @fichar="handlePurchase" />
        </div>
      </div>
    </section>
  </main>

  <Navbar />
</template>