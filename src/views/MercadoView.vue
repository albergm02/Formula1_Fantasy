<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'

import { mercadoPilotos, mercadoPotenciadores, mercadoCoches } from '@/data/mercado'
import { useEscuderiaStore } from '@/stores/storeEscuderia'
import { showResultToast } from '@/utils/uiFeedback'
import Navbar from '@/components/Navbar.vue'
import Header from '@/components/Header.vue'
import CartaPiloto from '@/components/CartaPiloto.vue'
import CartaPotenciador from '@/components/CartaPotenciador.vue'
import CartaCoche from '@/components/CartaCoche.vue'

const escuderiaStore = useEscuderiaStore()
const toast = useToast()
const route = useRoute()

const weeklyDriver = ref(null)
const weeklyCar = ref(null)
const weeklyBoosters = ref([])

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

onMounted(async () => {
  if (!escuderiaStore.activeLeagueId && route.query.liga) {
    await escuderiaStore.loadTeam(route.query.liga)
  }

  generateWeeklyMarket()
})

const handlePurchase = async (item) => {
  const result = await escuderiaStore.buyItem(item)

  showResultToast(toast, result, {
    success: { severity: 'success', summary: 'Fichaje exitoso' },
    failure: { severity: 'error', summary: 'Fichaje fallido' },
    successDetail: `Has fichado a ${item.nombre} por ${item.precio}M`,
  })
}
</script>

<template>
  <Header />

  <main class="p-4 flex flex-col gap-6 mt-4 mb-20">
    <section class="grid">
      <CartaCoche v-if="weeklyCar" :coche="weeklyCar" :modoMercado="true" @fichar="handlePurchase" />
    </section>

    <section class="grid">
      <CartaPiloto v-if="weeklyDriver" :piloto="weeklyDriver" :modoMercado="true" @fichar="handlePurchase" />
    </section>

    <section class="grid">
      <div class="grid grid-cols-2 gap-6">
        <div v-for="booster in weeklyBoosters" :key="booster.id" class="aspect-square">
          <CartaPotenciador :potenciador="booster" :modoMercado="true" @fichar="handlePurchase" />
        </div>
      </div>
    </section>
  </main>

  <Navbar />
</template>