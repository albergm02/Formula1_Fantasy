<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'

import { usarStoreLigas } from '@/stores/storeLigas'
import { usarStoreAutenticacion } from '@/stores/storeAutenticacion'
import { usarStoreGaraje } from '@/stores/storeGaraje'

import BarraNavegacion from '@/components/BarraNavegacion.vue'
import Cabecera from '@/components/Cabecera.vue'
import VistaGaraje from '@/components/VistaGaraje.vue'
import WidgetDesgloseJornada from '@/components/WidgetDesgloseJornada.vue'

import Dialog from 'primevue/dialog'

const storeLigas = usarStoreLigas()
const storeAutenticacion = usarStoreAutenticacion()
const storeGaraje = usarStoreGaraje()
const ruta = useRoute()
const toast = useToast()

const ranking = ref([])
const cargando = ref(true)

const dialogoRivalVisible = ref(false)
const participacionRival = ref(null)
const cargandoRival = ref(false)

async function cargarClasificacion() {
  cargando.value = true

  try {
    const idLiga = ruta.query.liga || storeLigas.idLigaActiva
    if (!idLiga) return

    storeLigas.idLigaActiva = idLiga
    ranking.value = await storeLigas.cargarClasificacion(idLiga)
  } catch (error) {
    ranking.value = []
    throw new Error(`Error al cargar la clasificación: ${error.message}`)
  } finally {
    cargando.value = false
  }
}

async function verEquipoRival(jugador) {
  const esUsuarioActual = jugador.correo === storeAutenticacion.usuarioActual.correoAutenticacion
  if (esUsuarioActual) return

  cargandoRival.value = true
  dialogoRivalVisible.value = true

  try {
    participacionRival.value = await storeLigas.cargarGarajeRival(jugador.id)
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el equipo rival.', life: 3000 })
    dialogoRivalVisible.value = false
  } finally {
    cargandoRival.value = false
  }
}

onMounted(async () => {
  if (!storeGaraje.idLigaActiva && ruta.query.liga) {
    await storeGaraje.cargarEquipo(ruta.query.liga)
  }

  await cargarClasificacion()
})
</script>


<template>
  <div class="min-h-screen pb-24 font-sans">
    <Cabecera />

    <main class="flex flex-col w-full max-w-lg mx-auto mt-4 p-4 gap-4">

      <WidgetDesgloseJornada />

      <div class="flex justify-center pb-2 border-b border-[#FFFFFF]/50">
        <h2 class="text-2xl font-black uppercase text-white">Clasificación general</h2>
      </div>

      <div v-if="cargando" class="flex justify-center py-10">
        <p class="text-sm font-bold uppercase tracking-widest text-[#D4A843]">Cargando...</p>
      </div>

      <div v-else class="flex flex-col gap-3">
        <div v-for="(jugador, indice) in ranking" :key="jugador.id"
          class="flex items-center justify-between p-4 border border-white transition-colors" :class="{
            '!border-[#E10600] !bg-[#E10600]/10': jugador.correo === storeAutenticacion.usuarioActual.correoAutenticacion,
          }" @click="verEquipoRival(jugador)">
          <div class="flex items-center gap-4">
            <div class="relative -top-4 text-2xl font-black italic" :class="{
              'text-[#D4A843]': indice === 0,
              'text-gray-200': indice === 1,
              'text-[#CD7F32]': indice === 2,
              'text-[#FFFFFF]': indice > 2
            }">{{ indice + 1 }}º</div>
            <div class="flex flex-col">
              <span class="text-lg font-bold uppercase text-white">{{ jugador.nombre }}</span>
              <span v-if="jugador.correo === storeAutenticacion.usuarioActual.correoAutenticacion"
                class="mt-1 text-xs text-[#F0ECEC]">
                Presupuesto: <span class="font-bold text-[#E10600]">${{ Number(jugador.presupuesto || 0).toFixed(2)
                }}M</span>
              </span>
              <span v-else class="mt-1 text-[10px] uppercase tracking-widest text-zinc-500">
                Toca para ver su equipo y hacer clausulas.
              </span>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="flex flex-col items-end justify-center text-right">
              <span class="text-3xl font-black text-[#D4A843]">{{ jugador.puntos }}</span>
              <span class="mt-1 text-xs font-bold uppercase text-[#F0ECEC]">PTS</span>
            </div>
            <i v-if="jugador.correo !== storeAutenticacion.usuarioActual.correoAutenticacion"
              class="pi pi-eye text-zinc-500 text-sm"></i>
          </div>
        </div>
      </div>

      <Dialog v-model:visible="dialogoRivalVisible" modal :draggable="false" class="w-full max-w-md mx-auto"
        :pt="{ root: { class: '!bg-[#0C0C0E] !border-none' }, header: { class: '!bg-[#0C0C0E] !p-3' }, content: { class: '!bg-[#0C0C0E] !p-0' } }">
        <template #header>
          <span class="text-sm font-bold uppercase tracking-widest text-zinc-400">Equipo rival</span>
        </template>

        <div v-if="cargandoRival" class="flex justify-center py-10">
          <p class="text-sm font-bold uppercase tracking-widest text-[#D4A843]">Cargando...</p>
        </div>

        <VistaGaraje v-else-if="participacionRival" :modoRival="true" :participacion="participacionRival" />
      </Dialog>
    </main>
    <BarraNavegacion />
  </div>
</template>
