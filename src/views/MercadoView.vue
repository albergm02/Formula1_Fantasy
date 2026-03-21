<script setup>
import { ref, onMounted } from 'vue'

import { mercadoPilotos, mercadoPotenciadores, mercadoCoches } from '@/data/mercado'
import { useEscuderiaStore } from '@/stores/storeEscuderia'
import { useRoute } from 'vue-router'

import { useToast } from 'primevue/usetoast'
import Navbar from '@/components/Navbar.vue'
import Header from '@/components/Header.vue'

import CartaPiloto from '@/components/CartaPiloto.vue'
import CartaPotenciador from '@/components/CartaPotenciador.vue'
import CartaCoche from '@/components/CartaCoche.vue'

const escuderiaStore = useEscuderiaStore()
const toast = useToast()
const route = useRoute()

/* Variables simplificadas: 1 piloto, 1 coche y 4 potenciadores */
const pilotoSemanal = ref(null)
const cocheSemanal = ref(null)
const potenciadoresSemanales = ref([])

const generarMercado = () => {
  const pilotosTier1 = mercadoPilotos.filter(p => p.tier === 2)
  const pilotosBarajados = pilotosTier1.sort(() => 0.5 - Math.random()).slice(0, 1).map(p => ({ ...p, tipo: 'piloto' }))
  pilotoSemanal.value = pilotosBarajados[0]
  const cochesBarajados = mercadoCoches.sort(() => 0.5 - Math.random()).slice(0, 1).map(c => ({ ...c, tipo: 'coche' }))
  cocheSemanal.value = cochesBarajados[0]
  potenciadoresSemanales.value = mercadoPotenciadores.sort(() => 0.5 - Math.random()).slice(0, 4).map(p => ({ ...p, tipo: 'potenciador' }))
}

onMounted(async () => {
  /* Volvemos a cargar la escudería al entrar al mercado por si el usuario ha fichado algo y vuelve atrás sin refrescar, 
  para que se refleje el presupuesto actualizado y no pueda fichar cosas que ya no puede pagar. */
  if (!escuderiaStore.ligaActivaId && route.query.liga) {
    await escuderiaStore.cargarEscuderia(route.query.liga)
  }

  generarMercado()
})

const realizarFichaje = async (elemento) => {
  const resultado = await escuderiaStore.fichar(elemento)

  if (resultado.exito) {
    toast.add({
      severity: 'success',
      summary: 'Fichaje exitoso',
      detail: `Has fichado a ${elemento.nombre} por ${elemento.precio}M`,
      life: 3000,
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Fichaje fallido',
      detail: resultado.mensaje,
      life: 3000,
    })
  }
}
</script>

<template>

  <Header />

  <main class="p-4 flex flex-col gap-6 mt-4 mb-20">

    <section class="grid">
      <CartaCoche v-if="cocheSemanal" :coche="cocheSemanal" :modoMercado="true" @fichar="realizarFichaje" />
    </section>

    <section class="grid">
      <CartaPiloto v-if="pilotoSemanal" :piloto="pilotoSemanal" :modoMercado="true" @fichar="realizarFichaje" />
    </section>

    <section class="grid">
      <div class="grid grid-cols-2 gap-6">
        <div v-for="potenciador in potenciadoresSemanales" :key="potenciador.id" class="aspect-square">
          <CartaPotenciador :potenciador="potenciador" :modoMercado="true" @fichar="realizarFichaje" />
        </div>
      </div>
    </section>

  </main>

  <Navbar />

</template>