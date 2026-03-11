<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
const isActive = (path) => route.path === path
</script>

<template>
    <nav
        class="fixed bottom-0 left-0 w-full bg-zinc-900 border-t border-zinc-800 p-2 z-[9999] flex justify-around items-center">

        <router-link to="/inicio"
            class="flex flex-col items-center p-2 cursor-pointer transition-transform active:scale-95">
            <i class="pi pi-home text-xl" :class="isActive('/inicio') ? 'text-red-600' : 'text-zinc-500'"></i>
            <span class="text-[10px] mt-1 font-bold"
                :class="isActive('/inicio') ? 'text-red-600' : 'text-zinc-500'">INICIO</span>
        </router-link>

        <router-link to="/ranking"
            class="flex flex-col items-center p-2 cursor-pointer transition-transform active:scale-95">
            <i class="pi pi-chart-bar text-xl" :class="isActive('/ranking') ? 'text-red-600' : 'text-zinc-500'"></i>
            <span class="text-[10px] mt-1 font-bold"
                :class="isActive('/ranking') ? 'text-red-600' : 'text-zinc-500'">RANKING</span>
        </router-link>

        <router-link to="/garaje"
            class="flex flex-col items-center p-2 cursor-pointer transition-transform active:scale-95">
            <i class="pi pi-warehouse text-xl" :class="isActive('/garaje') ? 'text-red-600' : 'text-zinc-500'"></i>
            <span class="text-[10px] mt-1 font-bold"
                :class="isActive('/garaje') ? 'text-red-600' : 'text-zinc-500'">GARAJE</span>
        </router-link>

        <router-link to="/mercado"
            class="flex flex-col items-center p-2 cursor-pointer transition-transform active:scale-95">
            <i class="pi pi-shopping-cart text-xl" :class="isActive('/mercado') ? 'text-red-600' : 'text-zinc-500'"></i>
            <span class="text-[10px] mt-1 font-bold"
                :class="isActive('/mercado') ? 'text-red-600' : 'text-zinc-500'">MERCADO</span>
        </router-link>

    </nav>
</template>
