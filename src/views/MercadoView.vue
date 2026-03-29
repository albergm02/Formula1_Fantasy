<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { mercadoPilotos, mercadoCoches, mercadoPotenciadores } from '@/data/datosMercado'
import { usarStoreEscuderia } from '@/stores/storeEquipo'
import BarraNavegacion from '@/components/BarraNavegacion.vue'
import Cabecera from '@/components/Cabecera.vue'
import TarjetaPiloto from '@/components/TarjetaPiloto.vue'
import TarjetaPotenciador from '@/components/TarjetaPotenciador.vue'
import TarjetaCoche from '@/components/TarjetaCoche.vue'

const storeEscuderia = usarStoreEscuderia()
const notificacion = useToast()
const ruta = useRoute()

const pilotosSemanales = ref([])
const cochesSemanales = ref([])
const potenciadoresSemanales = ref([])

/**
 * Genera una selección aleatoria semanal de elementos disponibles en el mercado.
 * Mezcla el catálogo completo y extrae una muestra representativa de cada categoría.
 */
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

onMounted(async () => {
  if (!storeEscuderia.idLigaActiva && ruta.query.liga) {
    await storeEscuderia.cargarEquipo(ruta.query.liga)
  }

  generarMercadoSemanal()
})

/**
 * Gestiona la compra de un elemento del mercado (piloto, coche o potenciador).
 * Delega la lógica de negocio al store y notifica el resultado al usuario.
 * @param {Object} elemento - El elemento del mercado que se desea fichar.
 */
const manejarCompra = async (elemento) => {
  const resultado = await storeEscuderia.comprarElemento(elemento)

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


    <section class="flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <h2 class="text-sm font-black text-white uppercase tracking-widest">Coches</h2>
        <div class="flex-1 h-px bg-zinc-700"></div>
      </div>
      <div class="grid grid-cols-1 gap-4">
        <TarjetaCoche v-for="coche in cochesSemanales" :key="coche.id" :coche="coche" :modoMercado="true"
          @fichar="manejarCompra" />
      </div>
    </section>


    <section class="flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <h2 class="text-sm font-black text-white uppercase tracking-widest">Pilotos</h2>
        <div class="flex-1 h-px bg-zinc-700"></div>
      </div>
      <div class="grid grid-cols-1 gap-4">
        <TarjetaPiloto v-for="piloto in pilotosSemanales" :key="piloto.id" :piloto="piloto" :modoMercado="true"
          @fichar="manejarCompra" />
      </div>
    </section>


    <section class="flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <h2 class="text-sm font-black text-white uppercase tracking-widest">Potenciadores</h2>
        <div class="flex-1 h-px bg-zinc-700"></div>
      </div>
      <div class="grid grid-cols-1 gap-4">
        <TarjetaPotenciador v-for="potenciador in potenciadoresSemanales" :key="potenciador.id"
          :potenciador="potenciador" :modoMercado="true" @fichar="manejarCompra" />
      </div>
    </section>
  </main>

  <BarraNavegacion />
</template>
