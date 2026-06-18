<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { usarStoreGaraje } from '@/stores/storeGaraje'
import { usarStoreMercado } from '@/stores/storeMercado'
import { usarStoreLigas } from '@/stores/storeLigas'
import BarraNavegacion from '@/components/BarraNavegacion.vue'
import Cabecera from '@/components/Cabecera.vue'
import CartaPiloto from '@/components/CartaPiloto.vue'
import CartaPotenciador from '@/components/CartaPotenciador.vue'
import CartaCoche from '@/components/CartaCoche.vue'

const storeGaraje = usarStoreGaraje()
const storeMercado = usarStoreMercado()
const storeLigas = usarStoreLigas()
const notificacion = useToast()
const ruta = useRoute()

onMounted(async () => {
  const idLiga = storeGaraje.idLigaActiva || ruta.query.liga
  if (idLiga && !storeLigas.idLigaActiva) {
    storeLigas.idLigaActiva = idLiga
  }
  if (!storeGaraje.idLigaActiva && ruta.query.liga) {
    await storeGaraje.cargarEquipo(ruta.query.liga)
  }

  if (idLiga) {
    await storeMercado.inicializarMercado(idLiga)
  }
})

onUnmounted(() => {
  storeMercado.detenerMercado()
})

const handlePuja = async ({ carta, cantidad }) => {
  const resultado = await storeMercado.pujarPorCarta(carta, cantidad)

  if (resultado.success) {
    notificacion.add({ severity: 'success', summary: 'Puja registrada', detail: resultado.message, life: 4000 })
  } else {
    notificacion.add({ severity: 'error', summary: 'Puja fallida', detail: resultado.message, life: 5000 })
  }
}

const handleEliminarPuja = async (carta) => {
  const resultado = await storeMercado.eliminarPujaCarta(carta)

  if (resultado.success) {
    notificacion.add({ severity: 'success', summary: 'Puja eliminada', detail: resultado.message, life: 4000 })
  } else {
    notificacion.add({ severity: 'error', summary: 'Error', detail: resultado.message, life: 5000 })
  }
}
</script>

<template>
  <Cabecera />

  <main class="flex flex-col w-full max-w-lg mx-auto mt-4 mb-20 p-4 gap-6">

    <div v-if="storeMercado.cargandoMercado" class="flex justify-center py-20">
      <p class="text-sm font-bold uppercase tracking-widest text-[#D4A843]">Cargando...</p>
    </div>

    <div v-else-if="!storeMercado.hayMercadoAbierto" class="flex flex-col items-center gap-3 py-20 text-zinc-400">
      <p class="text-sm">No hay mercado abierto en este momento.</p>
    </div>

    <template v-else>

      <!-- ─── Cuenta atrás del cierre ─── -->
      <div class="flex items-center justify-between bg-[#121218] rounded-lg px-4 py-3">
        <span class="text-xs uppercase tracking-widest text-zinc-400 font-black">Cierre del mercado</span>
        <span class="text-lg font-black text-[#D4A843]">{{ storeMercado.textoCuentaAtras }}</span>
      </div>

      <section class="flex flex-col gap-4">
        <div class="grid grid-cols-1 gap-4">
          <CartaCoche v-for="coche in storeMercado.cochesMercado" :key="coche.id" :coche="coche" :modoMercado="true"
            :miPuja="storeMercado.misPujas[coche.id] || null"
            :totalPujas="storeMercado.resumenPujas[coche.id]?.totalPujas || 0" @pujar="handlePuja"
            @eliminarPuja="handleEliminarPuja" />
        </div>
      </section>

      <div class="flex-1 h-px bg-zinc-700 border-t border-zinc-700"></div>


      <section class="flex flex-col gap-4">
        <div class="grid grid-cols-1 gap-4">
          <CartaPiloto v-for="piloto in storeMercado.pilotosMercado" :key="piloto.id" :piloto="piloto"
            :modoMercado="true" :miPuja="storeMercado.misPujas[piloto.id] || null"
            :totalPujas="storeMercado.resumenPujas[piloto.id]?.totalPujas || 0" @pujar="handlePuja"
            @eliminarPuja="handleEliminarPuja" />
        </div>
      </section>

      <div class="flex-1 h-px bg-zinc-700 border-t border-zinc-700"></div>

      <section class="flex flex-col gap-4">
        <div class="grid grid-cols-1 gap-4">
          <CartaPotenciador v-for="potenciador in storeMercado.potenciadoresMercado" :key="potenciador.id"
            :potenciador="potenciador" :modoMercado="true" :miPuja="storeMercado.misPujas[potenciador.id] || null"
            :totalPujas="storeMercado.resumenPujas[potenciador.id]?.totalPujas || 0" @pujar="handlePuja"
            @eliminarPuja="handleEliminarPuja" />
        </div>
      </section>

    </template>
  </main>

  <BarraNavegacion />
</template>
