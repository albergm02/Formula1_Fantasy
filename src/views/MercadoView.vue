<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { usarStoreEscuderia } from '@/stores/storeEquipo'
import { usarStoreMercado } from '@/stores/storeMercado'
import { usarStoreLigas } from '@/stores/storeLigas'
import BarraNavegacion from '@/components/BarraNavegacion.vue'
import Cabecera from '@/components/Cabecera.vue'
import TarjetaPiloto from '@/components/TarjetaPiloto.vue'
import TarjetaPotenciador from '@/components/TarjetaPotenciador.vue'
import TarjetaCoche from '@/components/TarjetaCoche.vue'

const storeEscuderia = usarStoreEscuderia()
const storeMercado = usarStoreMercado()
const storeLigas = usarStoreLigas()
const notificacion = useToast()
const ruta = useRoute()

onMounted(async () => {
  const idLiga = storeEscuderia.idLigaActiva || ruta.query.liga
  if (idLiga && !storeLigas.idLigaActiva) {
    storeLigas.idLigaActiva = idLiga
  }
  if (!storeEscuderia.idLigaActiva && ruta.query.liga) {
    await storeEscuderia.cargarEquipo(ruta.query.liga)
  }

  /* Carga el mercado activo de la liga desde Firestore e inicia la cuenta atrás */
  if (idLiga) {
    await storeMercado.inicializarMercado(idLiga)
  }
})

/** Limpia la cuenta atrás al abandonar la vista */
onUnmounted(() => {
  storeMercado.detenerCuentaAtras()
})

/**
 * Gestiona la puja de un usuario sobre una carta del mercado.
 * Delega la lógica de negocio al store y notifica el resultado al usuario.
 * @param {{ carta: Object, cantidad: number }} payload - Carta y cantidad de la puja.
 */
const manejarPuja = async ({ carta, cantidad }) => {
  const resultado = await storeMercado.pujarPorCarta(carta, cantidad)

  if (resultado.success) {
    notificacion.add({ severity: 'success', summary: 'Puja registrada', detail: resultado.message })
  } else {
    notificacion.add({ severity: 'error', summary: 'Puja fallida', detail: resultado.message })
  }
}

/**
 * Elimina la puja del usuario sobre una carta del mercado.
 * @param {Object} carta - La carta cuya puja se elimina.
 */
const manejarEliminarPuja = async (carta) => {
  const resultado = await storeMercado.eliminarPujaCarta(carta)

  if (resultado.success) {
    notificacion.add({ severity: 'success', summary: 'Puja eliminada', detail: resultado.message })
  } else {
    notificacion.add({ severity: 'error', summary: 'Error', detail: resultado.message })
  }
}
</script>

<!-------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!-------------------------------------------------------------------------------------------------------------------------->

<template>
  <Cabecera />

  <main class="flex flex-col w-full max-w-lg mx-auto mt-4 mb-20 p-4 gap-6">

    <!-- Estado de carga -->
    <div v-if="storeMercado.cargandoMercado" class="flex justify-center items-center py-20">
      <i class="pi pi-spin pi-spinner text-3xl text-zinc-400"></i>
    </div>

    <!-- Sin mercado abierto -->
    <div v-else-if="!storeMercado.hayMercadoAbierto" class="flex flex-col items-center gap-3 py-20 text-zinc-400">
      <i class="pi pi-shop text-4xl"></i>
      <p class="text-sm">No hay mercado abierto en este momento.</p>
    </div>

    <!-- Mercado activo -->
    <template v-else>

      <!-- Cuenta atrás hasta el cierre -->
      <section class="flex items-center justify-between bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3">
        <div class="flex items-center gap-2">
          <i class="pi pi-clock text-amber-400"></i>
          <span class="text-xs font-semibold uppercase tracking-widest text-zinc-300">Cierre del mercado</span>
        </div>
        <span class="text-sm font-mono font-bold text-amber-400">{{ storeMercado.textoCuentaAtras }}</span>
      </section>


      <section class="flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <h2 class="text-sm font-black uppercase tracking-widest text-white">Coches</h2>
          <div class="flex-1 h-px bg-zinc-700"></div>
        </div>
        <div class="grid grid-cols-1 gap-4">
          <TarjetaCoche v-for="coche in storeMercado.cochesMercado" :key="coche.id" :coche="coche" :modoMercado="true"
            :miPuja="storeMercado.misPujas[coche.id] || null"
            :totalPujas="storeMercado.resumenPujas[coche.id]?.totalPujas || 0" @pujar="manejarPuja"
            @eliminarPuja="manejarEliminarPuja" />
        </div>
      </section>


      <section class="flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <h2 class="text-sm font-black uppercase tracking-widest text-white">Pilotos</h2>
          <div class="flex-1 h-px bg-zinc-700"></div>
        </div>
        <div class="grid grid-cols-1 gap-4">
          <TarjetaPiloto v-for="piloto in storeMercado.pilotosMercado" :key="piloto.id" :piloto="piloto"
            :modoMercado="true" :miPuja="storeMercado.misPujas[piloto.id] || null"
            :totalPujas="storeMercado.resumenPujas[piloto.id]?.totalPujas || 0" @pujar="manejarPuja"
            @eliminarPuja="manejarEliminarPuja" />
        </div>
      </section>


      <section class="flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <h2 class="text-sm font-black uppercase tracking-widest text-white">Potenciadores</h2>
          <div class="flex-1 h-px bg-zinc-700"></div>
        </div>
        <div class="grid grid-cols-1 gap-4">
          <TarjetaPotenciador v-for="potenciador in storeMercado.potenciadoresMercado" :key="potenciador.id"
            :potenciador="potenciador" :modoMercado="true" :miPuja="storeMercado.misPujas[potenciador.id] || null"
            :totalPujas="storeMercado.resumenPujas[potenciador.id]?.totalPujas || 0" @pujar="manejarPuja"
            @eliminarPuja="manejarEliminarPuja" />
        </div>
      </section>

    </template>
  </main>

  <BarraNavegacion />
</template>
