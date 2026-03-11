<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// Comprueba si la ruta actual es la misma que la del botón
const isActive = (ruta) => route.path === ruta
</script>

<template>
    <nav
        class="fixed bottom-0 left-0 w-full bg-zinc-900 border-t border-zinc-800 p-2 z-50 flex justify-around items-center">

        <button @click="router.push('/inicio')" class="flex flex-col items-center p-2">
            <i class="pi pi-home text-xl" :class="isActive('/inicio') ? 'text-red-600' : 'text-zinc-500'"></i>
            <span class="text-[10px] mt-1 font-bold"
                :class="isActive('/inicio') ? 'text-red-600' : 'text-zinc-500'">INICIO</span>
        </button>

        <button @click="router.push('/ranking')" class="flex flex-col items-center p-2">
            <i class="pi pi-chart-bar text-xl" :class="isActive('/ranking') ? 'text-red-600' : 'text-zinc-500'"></i>
            <span class="text-[10px] mt-1 font-bold"
                :class="isActive('/ranking') ? 'text-red-600' : 'text-zinc-500'">RANKING</span>
        </button>

        <button @click="router.push('/garaje')" class="flex flex-col items-center p-2">
            <i class="pi pi-warehouse text-xl" :class="isActive('/garaje') ? 'text-red-600' : 'text-zinc-500'"></i>
            <span class="text-[10px] mt-1 font-bold"
                :class="isActive('/garaje') ? 'text-red-600' : 'text-zinc-500'">GARAJE</span>
        </button>

        <button @click="router.push('/mercado')" class="flex flex-col items-center p-2">
            <i class="pi pi-shopping-cart text-xl" :class="isActive('/mercado') ? 'text-red-600' : 'text-zinc-500'"></i>
            <span class="text-[10px] mt-1 font-bold"
                :class="isActive('/mercado') ? 'text-red-600' : 'text-zinc-500'">MERCADO</span>
        </button>

    </nav>
</template>