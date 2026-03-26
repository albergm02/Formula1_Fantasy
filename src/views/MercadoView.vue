<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'

/* Datos del mercado */
import { mercadoPilotos, mercadoCoches, mercadoPotenciadores } from '@/data/datosMercado'

/* Store */
import { usarStoreEscuderia } from '@/stores/storeEquipo'

/* Componentes UI */
import BarraNavegacion from '@/components/BarraNavegacion.vue'
import Cabecera from '@/components/Cabecera.vue'
import TarjetaPiloto from '@/components/TarjetaPiloto.vue'
import TarjetaPotenciador from '@/components/TarjetaPotenciador.vue'
import TarjetaCoche from '@/components/TarjetaCoche.vue'

const escuderiaStore = usarStoreEscuderia()
const notificacion = useToast()
const ruta = useRoute()

/* Estados del mercado semanal */
const pilotosSemanales = ref([])
const cochesSemanales = ref([])
const potenciadoresSemanales = ref([])

/* Genera el mercado semanal: selecciona aleatoriamente 3 pilotos, 2 coches y 4 potenciadores */
const generarMercadoSemanal = () => {
  pilotosSemanales.value = [...mercadoPilotos]
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .map((piloto) => ({ ...piloto, tipo: 'piloto' }))

  cochesSemanales.value = [...mercadoCoches]
    .sort(() => 0.5 - Math.random())
    .slice(0, 2)
    .map((coche) => ({ ...coche, tipo: 'coche' }))

  potenciadoresSemanales.value = [...mercadoPotenciadores]
    .sort(() => 0.5 - Math.random())
    .slice(0, 4)
    .map((potenciador) => ({ ...potenciador, tipo: 'potenciador' }))
}

/* Si no hay liga activa, la recuperamos de la query. Luego generamos el mercado */
onMounted(async () => {
  if (!escuderiaStore.idLigaActiva && ruta.query.liga) {
    await escuderiaStore.cargarEquipo(ruta.query.liga)
  }

  generarMercadoSemanal()
})

/* Handler Compra de un i­tem del mercado */
const handlerCompra = async (elemento) => {
  const resultado = await escuderiaStore.comprarElemento(elemento)

  if (resultado.success) {
    notificacion.add({ severity: 'success', summary: 'Fichaje exitoso', detail: `Has fichado a ${elemento.nombre} por ${elemento.precio}M` })
  } else {
    notificacion.add({ severity: 'error', summary: 'Fichaje fallido', detail: resultado.message })
  }
}
</script>

<!-------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!-------------------------------------------------------------------------------------------------------------------------->

<template>
  <Cabecera />

  <main class="p-4 flex flex-col gap-6 mt-4 mb-20 max-w-lg mx-auto w-full">

    <!-- Seccion: Coches -->
    <section class="flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <i class="pi pi-car text-white text-lg"></i>
        <h2 class="text-sm font-black text-white uppercase tracking-widest">Coches</h2>
        <div class="flex-1 h-px bg-zinc-700"></div>
      </div>
      <div class="grid grid-cols-1 gap-4">
        <TarjetaCoche v-for="coche in cochesSemanales" :key="coche.id" :coche="coche" :modoMercado="true"
          @fichar="handlerCompra" />
      </div>
    </section>

    <!-- Seccion: Pilotos -->
    <section class="flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <i class="pi pi-users text-white text-lg"></i>
        <h2 class="text-sm font-black text-white uppercase tracking-widest">Pilotos</h2>
        <div class="flex-1 h-px bg-zinc-700"></div>
      </div>
      <div class="grid grid-cols-1 gap-4">
        <TarjetaPiloto v-for="piloto in pilotosSemanales" :key="piloto.id" :piloto="piloto" :modoMercado="true"
          @fichar="handlerCompra" />
      </div>
    </section>

    <!-- Seccion: Potenciadores -->
    <section class="flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <i class="pi pi-bolt text-white text-lg"></i>
        <h2 class="text-sm font-black text-white uppercase tracking-widest">Potenciadores</h2>
        <div class="flex-1 h-px bg-zinc-700"></div>
      </div>
      <div class="grid grid-cols-1 gap-4">
        <TarjetaPotenciador v-for="potenciador in potenciadoresSemanales" :key="potenciador.id"
          :potenciador="potenciador" :modoMercado="true" @fichar="handlerCompra" />
      </div>
    </section>
  </main>

  <BarraNavegacion />
</template>
