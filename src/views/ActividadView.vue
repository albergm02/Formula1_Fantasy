<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usarStoreActividad } from '@/stores/storeActividad'
import { usarStoreLigas } from '@/stores/storeLigas'
import { usarStoreGaraje } from '@/stores/storeGaraje'
import Cabecera from '@/components/Cabecera.vue'
import BarraNavegacion from '@/components/BarraNavegacion.vue'

const storeActividad = usarStoreActividad()
const storeLigas = usarStoreLigas()
const storeGaraje = usarStoreGaraje()
const ruta = useRoute()

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

  if (!storeGaraje.idLigaActiva) {
    await storeGaraje.cargarEquipo(idLiga)
  }

  await storeActividad.cargarActividad()
})
</script>

<template>
  <div class="min-h-screen pb-24 font-sans">
    <Cabecera />

    <main class="flex flex-col w-full max-w-lg mx-auto mt-4 mb-20 p-4 gap-6">
      <div class="flex justify-between items-center pb-2 border-b border-[#FFFFFF]/10">
        <h2 class="text-sm font-black uppercase tracking-widest text-white">Actividad del campeonato</h2>
      </div>

      <div v-if="storeActividad.cargando" class="flex justify-center py-16">
        <p class="text-sm font-bold uppercase tracking-widest text-[#D4A843]">Cargando...</p>
      </div>

      <div v-else-if="storeActividad.actividad.length" class="flex flex-col gap-2">
        <div v-for="(evento, indice) in storeActividad.actividad" :key="indice"
          class="flex items-start justify-between p-3 border border-white/5">
          <p class="text-sm text-[#F0ECEC]">{{ evento.nombreUsuario }} {{ evento.descripcion }}</p>
          <span class="shrink-0 ml-4 text-[10px] uppercase tracking-wide text-zinc-500">
            {{ formatearFecha(evento.fecha) }}
          </span>
        </div>
      </div>
    </main>

    <BarraNavegacion />
  </div>
</template>
