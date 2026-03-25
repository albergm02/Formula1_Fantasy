<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'

/* Datos del mercado */
import { mercadoPilotos, mercadoPotenciadores, mercadoCoches } from '@/data/datosMercado'

/* Store */
import { usarStoreEscuderia } from '@/stores/storeEquipo'

/* Componentes UI */
import BarraNavegacion from '@/components/BarraNavegacion.vue'
import Cabecera from '@/components/Cabecera.vue'
import TarjetaPiloto from '@/components/TarjetaPiloto.vue'
import TarjetaPotenciador from '@/components/TarjetaPotenciador.vue'
import TarjetaCoche from '@/components/TarjetaCoche.vue'

const escuderiaStore = usarStoreEscuderia()
const toast = useToast()
const route = useRoute()

/* Estados del mercado semanal */
const pilotoSemanal = ref(null)
const cocheSemanal = ref(null)
const potenciadoresSemanales = ref([])

/* Genera el mercado semanal: selecciona aleatoriamente 1 piloto Tier 2, 1 coche y 4 potenciadores */
const generarMercadoSemanal = () => {
  const pilotosDestacados = mercadoPilotos
    .filter((piloto) => piloto.tier === 2)
    .sort(() => 0.5 - Math.random())
    .slice(0, 1)
    .map((piloto) => ({ ...piloto, tipo: 'piloto' }))

  const cochesDestacados = mercadoCoches
    .sort(() => 0.5 - Math.random())
    .slice(0, 1)
    .map((coche) => ({ ...coche, tipo: 'coche' }))

  pilotoSemanal.value = pilotosDestacados[0]
  cocheSemanal.value = cochesDestacados[0]
  potenciadoresSemanales.value = mercadoPotenciadores
    .sort(() => 0.5 - Math.random())
    .slice(0, 4)
    .map((potenciador) => ({ ...potenciador, tipo: 'potenciador' }))
}

/* Si no hay liga activa, la recuperamos de la query. Luego generamos el mercado */
onMounted(async () => {
  if (!escuderiaStore.idLigaActiva && route.query.liga) {
    await escuderiaStore.cargarEquipo(route.query.liga)
  }

  generarMercadoSemanal()
})

/* Handler Compra de un Ã­tem del mercado */
const manejarCompra = async (elemento) => {
  const resultado = await escuderiaStore.comprarElemento(elemento)

  if (resultado.success) {
    toast.add({ severity: 'success', summary: 'Fichaje exitoso', detail: `Has fichado a ${elemento.nombre} por ${elemento.precio}M` })
  } else {
    toast.add({ severity: 'error', summary: 'Fichaje fallido', detail: resultado.message })
  }
}
</script>

<!-------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!-------------------------------------------------------------------------------------------------------------------------->

<template>
  <Cabecera />

  <main class="p-4 flex flex-col gap-6 mt-4 mb-20 max-w-lg mx-auto w-full">

    <!-- Coche destacado de la semana -->
    <section class="grid">
      <TarjetaCoche v-if="cocheSemanal" :coche="cocheSemanal" :modoMercado="true" @fichar="manejarCompra" />
    </section>

    <!-- Piloto destacado de la semana -->
    <section class="grid">
      <TarjetaPiloto v-if="pilotoSemanal" :piloto="pilotoSemanal" :modoMercado="true" @fichar="manejarCompra" />
    </section>

    <!-- Potenciadores disponibles -->
    <section class="grid">
      <div class="grid grid-cols-2 gap-6">
        <div v-for="potenciador in potenciadoresSemanales" :key="potenciador.id" class="aspect-square">
          <TarjetaPotenciador :potenciador="potenciador" :modoMercado="true" @fichar="manejarCompra" />
        </div>
      </div>
    </section>
  </main>

  <BarraNavegacion />
</template>

