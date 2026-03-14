<template>
    <nav class="fixed bottom-0 w-full bg-[#15151E] border-t border-[#FF1E00] p-4 z-40 flex justify-around items-center">

        <router-link :to="{ path: '/inicio', query: { liga: route.query.liga || null } }"
            class="flex flex-col items-center p-2">
            <i class="pi pi-home text-xl" :class="isActive('/inicio') ? 'text-[#FF1E00]' : 'text-[#808080]'"></i>
            <span class="text-[10px] mt-1 font-bold"
                :class="isActive('/inicio') ? 'text-[#FF1E00]' : 'text-[#808080]'">INICIO</span>
        </router-link>

        <router-link :to="{ path: '/clasificacion', query: { liga: route.query.liga || null } }"
            class="flex flex-col items-center p-2">
            <i class="pi pi-chart-bar text-xl"
                :class="isActive('/clasificacion') ? 'text-[#FF1E00]' : 'text-[#808080]'"></i>
            <span class="text-[10px] mt-1 font-bold"
                :class="isActive('/clasificacion') ? 'text-[#FF1E00]' : 'text-[#808080]'">RANKING</span>
        </router-link>

        <router-link :to="{ path: '/garaje', query: { liga: route.query.liga || null } }"
            class="flex flex-col items-center p-2">
            <i class="pi pi-warehouse text-xl" :class="isActive('/garaje') ? 'text-[#FF1E00]' : 'text-[#808080]'"></i>
            <span class="text-[10px] mt-1 font-bold"
                :class="isActive('/garaje') ? 'text-[#FF1E00]' : 'text-[#808080]'">GARAJE</span>
        </router-link>

        <router-link :to="{ path: '/mercado', query: { liga: route.query.liga || null } }"
            class="flex flex-col items-center p-2">
            <i class="pi pi-shopping-cart text-xl"
                :class="isActive('/mercado') ? 'text-[#FF1E00]' : 'text-[#808080]'"></i>
            <span class="text-[10px] mt-1 font-bold"
                :class="isActive('/mercado') ? 'text-[#FF1E00]' : 'text-[#808080]'">MERCADO</span>
        </router-link>

    </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
/* Flag para determinar si el enlace está activo y cambiar el color del icono y del texto */
const isActive = (path) => {
    return route.path === path
}
</script>
