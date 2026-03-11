<script setup>
</script>

<template>
    <nav
        class="fixed bottom-0 left-0 w-full bg-zinc-900 border-t border-zinc-800 p-2 z-50 flex justify-around items-center">

        <router-link to="/inicio" custom v-slot="{ navigate, isActive }">
            <button @click="navigate"
                class="flex flex-col items-center p-2 cursor-pointer transition-transform active:scale-95">
                <i class="pi pi-home text-xl" :class="isActive ? 'text-red-600' : 'text-zinc-500'"></i>
                <span class="text-[10px] mt-1 font-bold"
                    :class="isActive ? 'text-red-600' : 'text-zinc-500'">INICIO</span>
            </button>
        </router-link>

        <router-link to="/ranking" custom v-slot="{ navigate, isActive }">
            <button @click="navigate"
                class="flex flex-col items-center p-2 cursor-pointer transition-transform active:scale-95">
                <i class="pi pi-chart-bar text-xl" :class="isActive ? 'text-red-600' : 'text-zinc-500'"></i>
                <span class="text-[10px] mt-1 font-bold"
                    :class="isActive ? 'text-red-600' : 'text-zinc-500'">RANKING</span>
            </button>
        </router-link>

        <router-link to="/garaje" custom v-slot="{ navigate, isActive }">
            <button @click="navigate"
                class="flex flex-col items-center p-2 cursor-pointer transition-transform active:scale-95">
                <i class="pi pi-warehouse text-xl" :class="isActive ? 'text-red-600' : 'text-zinc-500'"></i>
                <span class="text-[10px] mt-1 font-bold"
                    :class="isActive ? 'text-red-600' : 'text-zinc-500'">GARAJE</span>
            </button>
        </router-link>

        <router-link to="/mercado" custom v-slot="{ navigate, isActive }">
            <button @click="navigate"
                class="flex flex-col items-center p-2 cursor-pointer transition-transform active:scale-95">
                <i class="pi pi-shopping-cart text-xl" :class="isActive ? 'text-red-600' : 'text-zinc-500'"></i>
                <span class="text-[10px] mt-1 font-bold"
                    :class="isActive ? 'text-red-600' : 'text-zinc-500'">MERCADO</span>
            </button>
        </router-link>

    </nav>
</template>