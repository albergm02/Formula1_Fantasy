<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

/* Stores y utilidades */
import { usarStoreEscuderia } from '@/stores/storeEquipo'
import { calcularValorReventa } from '@/utils/garaje'

/* Componentes UI */
import Cabecera from '@/components/Cabecera.vue'
import BarraNavegacion from '@/components/BarraNavegacion.vue'
import TarjetaCoche from '@/components/TarjetaCoche.vue'
import TarjetaPiloto from '@/components/TarjetaPiloto.vue'
import TarjetaPotenciador from '@/components/TarjetaPotenciador.vue'

const escuderiaStore = usarStoreEscuderia()
const toast = useToast()
const confirm = useConfirm()
const route = useRoute()

/* Si no hay liga activa en el store, intentamos recuperarla de la query */
onMounted(async () => {
  if (!escuderiaStore.idLigaActiva && route.query.liga) {
    await escuderiaStore.cargarEquipo(route.query.liga)
  }
})

/* Handler Venta de coche: pide confirmaciÃ³n y ejecuta la venta */
const confirmarVentaCoche = (coche) => {
  const valorReventa = calcularValorReventa(coche.precio)

  confirm.require({
    icon: 'pi pi-exclamation-triangle',
    message: `Â¿EstÃ¡s seguro de que quieres vender el chasis ${coche.nombre} por ${valorReventa}M?`,
    header: 'Confirmar Venta',
    acceptLabel: 'SÃ­, vender',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const resultado = await escuderiaStore.venderElemento(coche)
      if (resultado.success) {
        toast.add({ severity: 'success', summary: 'Venta completada', detail: `Has recuperado ${valorReventa}M` })
      } else {
        toast.add({ severity: 'warn', summary: 'Venta denegada', detail: resultado.message })
      }
    },
  })
}

/* Handler Despido de piloto: pide confirmaciÃ³n y ejecuta el despido */
const confirmarVentaPiloto = (piloto) => {
  const valorReventa = calcularValorReventa(piloto.precio)

  confirm.require({
    icon: 'pi pi-exclamation-triangle',
    message: `Â¿EstÃ¡s seguro de que quieres rescindir el contrato de ${piloto.nombre} por ${valorReventa}M?`,
    header: 'Confirmar Despido',
    icon: 'pi pi-user-minus',
    acceptLabel: 'SÃ­, despedir',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const resultado = await escuderiaStore.venderElemento(piloto)
      if (resultado.success) {
        toast.add({ severity: 'success', summary: 'Despido completado', detail: `Has recuperado ${valorReventa}M` })
      } else {
        toast.add({ severity: 'warn', summary: 'Despido denegado', detail: resultado.message })
      }
    },
  })
}

/* Handler Instalar/Desinstalar potenciador */
const alternarInstalacionPotenciador = async (idInstancia) => {
  const resultado = await escuderiaStore.alternarPotenciador(idInstancia)
  if (resultado.success) {
    toast.add({ severity: 'success', summary: 'AcciÃ³n completada', detail: resultado.message })
  } else {
    toast.add({ severity: 'warn', summary: 'AcciÃ³n denegada', detail: resultado.message })
  }
}
</script>

<!-------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!-------------------------------------------------------------------------------------------------------------------------->

<template>
  <Cabecera />

  <main class="p-4 flex flex-col gap-6 mt-4 mb-24 max-w-md mx-auto w-full">
    <!-- SecciÃ³n: Coche -->
    <section class="grid">
      <div v-if="escuderiaStore.garaje.coche" class="flex flex-col w-full h-full">
        <TarjetaCoche :coche="escuderiaStore.garaje.coche" :modoMercado="false" />

        <!-- BotÃ³n de venta del coche -->
        <div class="px-6 pb-2 -mt-1">
          <button @click="confirmarVentaCoche(escuderiaStore.garaje.coche)"
            class="w-full bg-[#121218] border border-zinc-800 hover:border-red-900/50 py-4 flex items-center justify-center cursor-pointer transition-colors shadow-lg rounded-xl group">
            <i class="pi pi-shopping-bag text-sm text-red-500 mr-2 group-hover:scale-110 transition-transform"></i>
            <span class="text-white text-[10px] font-black uppercase tracking-widest">
              VENDER POR {{ calcularValorReventa(escuderiaStore.garaje.coche.precio) }}M
            </span>
          </button>
        </div>
      </div>

      <div v-else
        class="flex flex-col items-center justify-center p-12 border border-zinc-800/50 bg-[#1A1A1F]/50 rounded-2xl mx-6">
        <i class="pi pi-car text-3xl text-zinc-600 mb-3"></i>
        <span class="text-xs font-black text-zinc-500 uppercase tracking-widest">Garaje VacÃ­o</span>
      </div>
    </section>

    <!-- SecciÃ³n: Pilotos -->
    <section class="grid grid-cols-1 gap-6">
      <template v-if="escuderiaStore.garaje.pilotos.length > 0">
        <div v-for="piloto in escuderiaStore.garaje.pilotos" :key="piloto.instancia_id"
          class="flex flex-col w-full h-full">
          <TarjetaPiloto :piloto="piloto" :modoMercado="false" />

          <!-- BotÃ³n de despido del piloto -->
          <div class="px-6 pb-2 -mt-1">
            <button @click="confirmarVentaPiloto(piloto)"
              class="w-full bg-[#121218] border border-zinc-800 hover:border-red-900/50 py-4 flex items-center justify-center cursor-pointer transition-colors shadow-lg rounded-xl group">
              <i class="pi pi-user-minus text-sm text-red-500 mr-2 group-hover:scale-110 transition-transform"></i>
              <span class="text-white text-[10px] font-black uppercase tracking-widest">
                DESPEDIR ({{ calcularValorReventa(piloto.precio) }}M)
              </span>
            </button>
          </div>
        </div>
      </template>

      <!-- Estado vacÃ­o: sin pilotos -->
      <div v-else
        class="col-span-full flex flex-col items-center justify-center p-12 border border-zinc-800/50 bg-[#1A1A1F]/50 rounded-2xl mx-6">
        <i class="pi pi-users text-3xl text-zinc-600 mb-3"></i>
        <span class="text-xs font-black text-zinc-500 uppercase tracking-widest">Asientos VacÃ­os</span>
      </div>
    </section>

    <section class="grid">
      <div v-if="escuderiaStore.garaje.potenciadores.length > 0" class="grid grid-cols-2 gap-6 px-6">
        <div v-for="potenciador in escuderiaStore.garaje.potenciadores" :key="potenciador.instancia_id"
          class="flex flex-col w-full h-full">
          <div class="aspect-square w-full">
            <TarjetaPotenciador :potenciador="potenciador" :modoMercado="false" />
          </div>

          <button @click="alternarInstalacionPotenciador(potenciador.instancia_id)"
            class="w-full py-3 mt-2 flex items-center justify-center cursor-pointer transition-colors rounded-xl shadow-lg group"
            :class="potenciador.equipado
              ? 'bg-emerald-900/20 border border-emerald-500/50 text-emerald-400'
              : 'bg-[#121218] border border-zinc-800 text-zinc-400 hover:text-white'">
            <i class="text-[10px] mr-2"
              :class="potenciador.equipado ? 'pi pi-check-circle text-emerald-400' : 'pi pi-cog text-zinc-500 group-hover:text-white transition-colors'"></i>
            <span class="text-[10px] font-black uppercase tracking-widest"
              :class="potenciador.equipado ? 'text-emerald-400' : 'text-white'">
              {{ potenciador.equipado ? 'INSTALADO' : 'INSTALAR' }}
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

  <BarraNavegacion />
</template>

