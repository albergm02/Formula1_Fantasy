<script setup>
import { useRoute, useRouter } from 'vue-router'

const ruta = useRoute()
const router = useRouter()

const navegar = (destino) => {
  router.push({ path: destino, query: { liga: ruta.query.liga || undefined } })
}

const elementos = [
  { ruta: '/dashboard', icono: 'pi-home', etiqueta: 'Inicio' },
  { ruta: '/clasificacion', icono: 'pi-chart-bar', etiqueta: 'Ranking' },
  { ruta: '/garaje', icono: 'pi-warehouse', etiqueta: 'Garaje' },
  { ruta: '/mercado', icono: 'pi-shopping-cart', etiqueta: 'Mercado' },
  { ruta: '/notificaciones', icono: 'pi-bell', etiqueta: 'Alertas' },
  { ruta: '/jornada', icono: 'pi-question-circle', etiqueta: 'Guía' },
]
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-40 bg-[#1A1A1F] border-t border-[#E10600]">
    <div class="flex items-center justify-around px-1 py-4">
      <button v-for="el in elementos" :key="el.ruta" @click="navegar(el.ruta)"
        class="flex flex-col items-center gap-0.5 bg-transparent min-w-0 flex-1"
        :class="ruta.path === el.ruta ? 'text-[#E10600]' : 'text-zinc-400'">
        <i class="pi text-base sm:text-lg" :class="el.icono"></i>
        <span class="text-[8px] sm:text-[12px] font-bold uppercase truncate">
          {{ el.etiqueta }}
        </span>
      </button>
    </div>
  </nav>
</template>
