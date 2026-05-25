<script setup>
import { useRouter } from 'vue-router'
import { cerrarSesion } from '@/services/servicioAutenticacion'

import SeccionTesting from '@/components/SeccionTesting.vue'

import Button from 'primevue/button'

const router = useRouter()

async function manejarCerrarSesion() {
    await cerrarSesion()
    router.push({ name: 'login' })
}
</script>

<template>
    <div class="min-h-screen bg-[#0C0C0E] text-[#F0ECEC] flex flex-col">
        <header class="w-full p-3 flex justify-between sticky top-0 z-40 bg-[#1A1A1F] border-b border-[#E10600]">
            <div class="flex items-center gap-2">
                <img src="/logo.png" class="h-8 w-8 object-contain" />
                <span class="font-black text-[#E10600] text-lg">ADMINISTRADOR</span>
            </div>
            <Button @click="manejarCerrarSesion" icon="pi pi-sign-out" text class="!text-zinc-400" />
        </header>

        <main class="flex-1 p-10 max-w-6xl mx-auto w-full space-y-4">
            <SeccionTesting />
        </main>
    </div>
</template>
