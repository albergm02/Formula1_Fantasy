<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/storeAuth'
import { useEscuderiaStore } from '@/stores/storeTeam'
import { signOut } from '@/services/authService'
import Button from 'primevue/button'
import { useRoute } from 'vue-router'


const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const escuderiaStore = useEscuderiaStore()


const handleSignOut = async () => {
    try {
        await signOut()
        router.push({ name: 'login' })
    } catch (error) {
        console.error('Error en cerrar sesión (Header.vue):', error)
    }
}

const goToDashboard = () => {
    const leagueId = escuderiaStore.activeLeagueId || route.query.liga || null
    if (leagueId) {
        router.push({ name: 'inicio', query: { liga: leagueId } })
    } else {
        router.push({ name: 'ligas' })
    }

}
</script>

<template>
    <!-- z-10 para que el header esté por encima de otros elementos / border-b (border-bottom) -->
    <header class="w-full bg-[#1A1A1F] border-b border-[#E10600] p-3 flex justify-between sticky top-0 z-40">
        <div class="flex items-center gap-2">
            <img src="/logo.png" class="h-16 w-16 object-contain cursor-pointer" @click="goToDashboard" />
            <span class="font-black italic text-[#E10600] text-lg sm:block cursor-pointer" @click="goToDashboard">F1
                FANTASY</span>
        </div>

        <div class="flex items-center gap-3">
            <div class="text-right">
                <p class="text text-white font-bold uppercase">{{ authStore.currentUser.displayName }}</p>
                <p v-if="route.name !== 'ligas'" class="text-xs text-white mt-0.5">
                    Pts: <strong class="text-[#D4A843]">{{ escuderiaStore.points }}</strong>
                    | <span class="text-emerald-500 font-bold">{{ escuderiaStore.budget }}M</span>
                </p>
            </div>
            <!-- hover es utilizado para cambiar el color al clickear -->
            <Button @click="handleSignOut" icon="pi pi-sign-out" text
                class="!text-zinc-400 hover:!text-red-500 cursor-pointer" />
        </div>
    </header>
</template>