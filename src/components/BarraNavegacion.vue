<!-- Componente Barra de Navegación: utilizo Dock para mostrar los elementos de navegación -->

<script setup>
import { h, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Dock from '@/components/vue-bits/Dock.vue'

const ruta = useRoute()
const enrutador = useRouter()

const navegar = (destino) => {
  enrutador.push({ path: destino, query: { liga: ruta.query.liga || undefined } })
}

const elementosNav = computed(() => [
  {
    icon: () => h('i', { class: 'pi pi-home', style: { fontSize: '18px', color: ruta.path === '/dashboard' ? '#E10600' : 'white' } }),
    label: 'Inicio',
    onClick: () => navegar('/dashboard'),
  },
  {
    icon: () => h('i', { class: 'pi pi-chart-bar', style: { fontSize: '18px', color: ruta.path === '/clasificacion' ? '#E10600' : 'white' } }),
    label: 'Ranking',
    onClick: () => navegar('/clasificacion'),
  },
  {
    icon: () => h('i', { class: 'pi pi-warehouse', style: { fontSize: '18px', color: ruta.path === '/garaje' ? '#E10600' : 'white' } }),
    label: 'Garaje',
    onClick: () => navegar('/garaje'),
  },
  {
    icon: () => h('i', { class: 'pi pi-shopping-cart', style: { fontSize: '18px', color: ruta.path === '/mercado' ? '#E10600' : 'white' } }),
    label: 'Mercado',
    onClick: () => navegar('/mercado'),
  },
  {
    icon: () => h('i', { class: 'pi pi-bell', style: { fontSize: '18px', color: ruta.path === '/notificaciones' ? '#E10600' : 'white' } }),
    label: 'Notificaciones',
    onClick: () => navegar('/notificaciones'),
  },
])
</script>

<template>
  <div class="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-2">
    <Dock :items="elementosNav" :panel-height="68" :base-item-size="50" :magnification="70" :distance="200"
      :dock-height="256" :spring="{ mass: 0.1, stiffness: 150, damping: 12 }" />
  </div>
</template>
