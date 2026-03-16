<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/storeAuth'
import { useEscuderiaStore } from '@/stores/storeEscuderia'
import { signOut } from '@/services/authService'
import Button from 'primevue/button'
import { useRoute } from 'vue-router'


const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const escuderiaStore = useEscuderiaStore()


const cerrarSesion = async () => {
    try {
        await signOut()
        router.push({ name: 'login' })
    } catch (error) {
        console.error('Error en cerrar sesión (Header.vue):', error)
    }
}

const volverADashboard = () => {
    const ligaId = escuderiaStore.ligaActualId || route.query.liga || null
    if (ligaId) {
        router.push({ name: 'inicio', query: { liga: ligaId } })
    } else {
        router.push({ name: 'ligas' })
    }

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
                <p class="text text-white font-bold uppercase">{{ authStore.usuarioGlobal.nombre }}</p>
                <p v-if="route.name !== 'ligas'" class="text-xs text-white mt-0.5">
                    Pts: <strong class="text-yellow-500">{{ escuderiaStore.puntos }}</strong>
                    | <span class="text-emerald-500 font-bold">{{ escuderiaStore.presupuesto }}M</span>
                </p>
            </div>
            <!-- hover es utilizado para cambiar el color al clickear -->
            <Button @click="cerrarSesion" icon="pi pi-sign-out" text
                class="!text-zinc-400 hover:!text-red-500 cursor-pointer" />
        </div>
    </header>
</template>