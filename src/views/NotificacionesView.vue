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
    clausula: 'Cláusula',
    creacion: 'Nueva liga',
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
  <div class="min-h-screen pb-24 font-sans">
    <Cabecera />

    <main class="flex flex-col w-full max-w-md mx-auto mt-2 p-4 gap-4">

      <!-- Cabecera de sección -->
      <div class="flex justify-between items-center pb-2 border-b border-[#FFFFFF]/10">
        <h2 class="text-sm font-black uppercase tracking-widest text-white">Actividad del campeonato</h2>
        <span v-if="storeNotificaciones.actividad.length" class="text-xs text-zinc-500">
          {{ storeNotificaciones.actividad.length }} movimientos
        </span>
      </div>

      <!-- Spinner de carga -->
      <div v-if="storeNotificaciones.cargando" class="flex flex-col items-center justify-center py-16 gap-3">
        <i class="pi pi-spinner text-3xl text-[#D4A843] animate-spin"></i>
        <p class="text-xs font-bold uppercase tracking-widest text-[#D4A843] animate-pulse">Cargando actividad...</p>
      </div>

      <!-- Feed de actividad -->
      <div v-else-if="storeNotificaciones.actividad.length" class="flex flex-col gap-2">
        <div v-for="evento in storeNotificaciones.actividad" :key="evento.id"
          class="flex items-start justify-between p-3 border border-white/5">
          <p class="text-sm text-[#F0ECEC]">
            {{ evento.nombreUsuario }} {{ evento.descripcion }}
          </p>
          <span class="shrink-0 ml-4 text-[10px] uppercase tracking-wide text-zinc-500">
            {{ formatearFecha(evento.fecha) }}
          </span>
        </div>
      </div>

      <!-- Estado vacío -->
      <div v-else class="flex flex-col items-center justify-center py-16 gap-3">
        <i class="pi pi-flag text-3xl text-zinc-700"></i>
        <p class="text-center text-xs uppercase tracking-widest text-zinc-500">
          Aún no hay movimientos en este campeonato
        </p>
      </div>

    </main>

    <BarraNavegacion />
  </div>
</template>