<script setup>
import { useRouter } from 'vue-router'
import { cerrarSesion } from '@/services/servicioAutenticacion'
import Button from 'primevue/button'

const enrutador = useRouter()

async function manejarCerrarSesion() {
    await cerrarSesion()
    enrutador.push({ name: 'login' })
}
</script>

<template>
    <div class="min-h-screen bg-[#0C0C0E] text-[#F0ECEC] flex flex-col">
        <header class="w-full p-3 flex justify-between sticky top-0 z-40 bg-[#1A1A1F] border-b border-[#E10600]">
            <div class="flex items-center gap-2">
                <img src="/logo.png" class="h-8 w-8 object-contain" />
                <span class="font-black italic text-[#E10600] text-lg">F1 FANTASY</span>
            </div>
            <Button @click="manejarCerrarSesion" icon="pi pi-sign-out" text
                class="!text-zinc-400 hover:!text-red-500 cursor-pointer" />
        </header>
    </div>
</template>