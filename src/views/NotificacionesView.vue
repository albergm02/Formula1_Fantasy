<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usarStoreNotificaciones } from '@/stores/storeNotificaciones'
import { usarStoreLigas } from '@/stores/storeLigas'
import { usarStoreEscuderia } from '@/stores/storeEquipo'
import Cabecera from '@/components/Cabecera.vue'
import BarraNavegacion from '@/components/BarraNavegacion.vue'

const storeNotificaciones = usarStoreNotificaciones()
const storeLigas = usarStoreLigas()
const storeEscuderia = usarStoreEscuderia()
const ruta = useRoute()

/**
 * Convierte el tipo interno del evento en una etiqueta legible en español.
 * @param {string} tipo
 * @returns {string}
 */
const etiquetaPorTipo = (tipo) => {
  const etiquetas = {
    compra: 'Fichaje',
    venta: 'Venta',
    incorporacion: 'Incorporación',
    abandono: 'Abandono',
  }
  return etiquetas[tipo] ?? tipo
}

/**
 * Formatea una fecha JavaScript en texto relativo legible en español.
 * @param {Date} fecha
 * @returns {string}
 */
const formatearFecha = (fecha) => {
  const ahora = new Date()
  const diferencia = Math.floor((ahora - fecha) / 1000)

  if (diferencia < 60) return 'hace un momento'
  if (diferencia < 3600) return `hace ${Math.floor(diferencia / 60)} min`
  if (diferencia < 86400) return `hace ${Math.floor(diferencia / 3600)} h`
  return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

onMounted(async () => {
  const idLiga = ruta.query.liga || storeLigas.idLigaActiva
  if (!idLiga) return

  storeLigas.idLigaActiva = idLiga

  if (!storeEscuderia.idLigaActiva) {
    await storeEscuderia.cargarEquipo(idLiga)
  }

  await storeNotificaciones.cargarActividad()
})
</script>

<!-------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE----------------------------------------------------------->

<!-------------------------------------------------------------------------------------------------------------------------->

<template>
  <div class="min-h-screen pb-24 bg-[#1A1A1F] font-sans">
    <Cabecera />

    <main class="p-4 max-w-md mx-auto w-full flex flex-col gap-4 mt-2">

      <!-- Cabecera de sección -->
      <div class="flex justify-between items-center pb-2 border-b border-[#FFFFFF]/10">
        <h2 class="text-sm font-black text-white uppercase tracking-widest">Actividad del campeonato</h2>
        <span v-if="storeNotificaciones.actividad.length" class="text-xs text-zinc-500">
          {{ storeNotificaciones.actividad.length }} movimientos
        </span>
      </div>

      <!-- Spinner de carga -->
      <div v-if="storeNotificaciones.cargando" class="flex flex-col items-center justify-center py-16 gap-3">
        <i class="text-3xl text-[#D4A843] pi pi-spinner animate-spin"></i>
        <p class="text-[#D4A843] text-xs font-bold uppercase tracking-widest animate-pulse">Cargando actividad...</p>
      </div>

      <!-- Feed de actividad -->
      <div v-else-if="storeNotificaciones.actividad.length" class="flex flex-col gap-2">
        <div v-for="evento in storeNotificaciones.actividad" :key="evento.id"
          class="flex justify-between items-start p-3 border border-white/5">
          <p class="text-sm text-[#F0ECEC]">
            <span class="font-black text-white uppercase">{{ etiquetaPorTipo(evento.tipo) }}: </span>
            {{ evento.nombreUsuario }} {{ evento.descripcion }}
          </p>
          <span class="ml-4 shrink-0 text-[10px] text-zinc-500 uppercase tracking-wide">
            {{ formatearFecha(evento.fecha) }}
          </span>
        </div>
      </div>

      <!-- Estado vacío -->
      <div v-else class="flex flex-col items-center justify-center py-16 gap-3">
        <i class="pi pi-flag text-3xl text-zinc-700"></i>
        <p class="text-xs text-zinc-500 uppercase tracking-widest text-center">
          Aún no hay movimientos en este campeonato
        </p>
      </div>

    </main>

    <BarraNavegacion />
  </div>
</template>