<script setup>
import { useRouter } from 'vue-router'
import { useFantasyStore } from '@/stores/storeFantasy'
import { signOut } from '@/services/authService'
import Button from 'primevue/button'

const router = useRouter()
const partida = useFantasyStore()

const cerrarSesion = async () => {
    try {
        await signOut()
        router.push('/')
    } catch (error) {
        console.error('Error al cerrar sesión:', error)
    }
}

const volverADashboard = () => {
    router.push('/inicio')
}
</script>

<template>
    <!-- z-10 para que el header esté por encima de otros elementos / border-b (border-bottom) -->
    <header class="w-full bg-[#15151E] border-b border-[#FF1E00] p-3 flex justify-between sticky top-0 z-40">
        <div class="flex items-center gap-2">
            <img src="/logo.png" class="h-16 w-16 object-contain cursor-pointer" @click="volverADashboard" />
            <span class="font-black italic text-[#FF1E00] text-lg sm:block cursor-pointer" @click="volverADashboard">F1
                FANTASY</span>
        </div>

        <div class="flex items-center gap-3">
            <div class="text-right">
                <p class="text text-white font-bold uppercase">{{ partida.usuario.nombre }}</p>
                <p class="text-xs text-white">
                    Pts: <strong class="text-yellow-500">{{ partida.usuario.puntos }}</strong>
                    | <span class="text-emerald-500 font-bold">{{ partida.usuario.presupuesto }}M</span>
                </p>
            </div>
            <!-- hover es utilizado para cambiar el color al clickear -->
            <Button @click="cerrarSesion" icon="pi pi-sign-out" text
                class="!text-zinc-400 hover:!text-red-500 cursor-pointer" />
        </div>
    </header>
</template>