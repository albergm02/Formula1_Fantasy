<script setup>
import { useRoute, useRouter } from 'vue-router'

const ruta = useRoute()
const enrutador = useRouter()

const navegar = (destino) => {
  enrutador.push({ path: destino, query: { liga: ruta.query.liga || undefined } })
}

const elementos = [
  { ruta: '/dashboard', icono: 'pi-home', etiqueta: 'Inicio' },
  { ruta: '/clasificacion', icono: 'pi-chart-bar', etiqueta: 'Ranking' },
  { ruta: '/garaje', icono: 'pi-warehouse', etiqueta: 'Garaje' },
  { ruta: '/mercado', icono: 'pi-shopping-cart', etiqueta: 'Mercado' },
  { ruta: '/notificaciones', icono: 'pi-bell', etiqueta: 'Alertas' },
]
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-40 bg-[#1A1A1F] border-t border-[#E10600]">
    <div class="flex items-center justify-around px-2 py-2">
      <button v-for="el in elementos" :key="el.ruta" @click="navegar(el.ruta)"
        class="flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer bg-transparent border-none"
        :class="ruta.path === el.ruta ? 'text-[#E10600]' : 'text-zinc-400'">
        <i class="pi text-lg" :class="el.icono"></i>
        <span class="text-[10px] font-bold uppercase tracking-wide">{{ el.etiqueta }}</span>
      </button>
    </div>
  </nav>
</template>
