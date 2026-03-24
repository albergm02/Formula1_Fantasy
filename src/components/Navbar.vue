<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
const isActive = (path) => {
    return route.path === path
}
</script>

<template>
    <nav class="fixed bottom-0 w-full bg-[#1A1A1F] border-t border-[#E10600] p-4 z-40 flex justify-around items-center">

        <router-link :to="{ path: '/dashboard', query: { liga: route.query.liga || null } }"
            class="flex flex-col items-center p-2">
            <i class="pi pi-trophy text-xl" :class="isActive('/dashboard') ? 'text-[#E10600]' : 'text-[#6E6E78]'"></i>
            <span class="text-[10px] mt-1 font-bold"
                :class="isActive('/dashboard') ? 'text-[#E10600]' : 'text-[#6E6E78]'">LIGAS</span>
        </router-link>

        <router-link :to="{ path: '/clasificacion', query: { liga: route.query.liga || null } }"
            class="flex flex-col items-center p-2">
            <i class="pi pi-chart-bar text-xl"
                :class="isActive('/clasificacion') ? 'text-[#E10600]' : 'text-[#6E6E78]'"></i>
            <span class="text-[10px] mt-1 font-bold"
                :class="isActive('/clasificacion') ? 'text-[#E10600]' : 'text-[#6E6E78]'">RANKING</span>
        </router-link>

        <router-link :to="{ path: '/garaje', query: { liga: route.query.liga || null } }"
            class="flex flex-col items-center p-2">
            <i class="pi pi-warehouse text-xl" :class="isActive('/garaje') ? 'text-[#E10600]' : 'text-[#6E6E78]'"></i>
            <span class="text-[10px] mt-1 font-bold"
                :class="isActive('/garaje') ? 'text-[#E10600]' : 'text-[#6E6E78]'">GARAJE</span>
        </router-link>

        <router-link :to="{ path: '/mercado', query: { liga: route.query.liga || null } }"
            class="flex flex-col items-center p-2">
            <i class="pi pi-shopping-cart text-xl"
                :class="isActive('/mercado') ? 'text-[#E10600]' : 'text-[#6E6E78]'"></i>
            <span class="text-[10px] mt-1 font-bold"
                :class="isActive('/mercado') ? 'text-[#E10600]' : 'text-[#6E6E78]'">MERCADO</span>
        </router-link>

    </nav>
</template>
