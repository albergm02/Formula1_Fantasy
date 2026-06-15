<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usarStoreUsuario } from '@/stores/storeUsuario'
import { usarStoreGaraje } from '@/stores/storeGaraje'
import { usarStoreMercado } from '@/stores/storeMercado'
import { cerrarSesion } from '@/services/servicioAutenticacion'
import Button from 'primevue/button'

const router = useRouter()
const ruta = useRoute()
const storeUsuario = usarStoreUsuario()
const storeGaraje = usarStoreGaraje()
const storeMercado = usarStoreMercado()

const manejarCerrarSesion = async () => {
    await cerrarSesion()
    router.push({ name: 'login' })
}

const irADashboard = () => {
    const idLiga = storeGaraje.idLigaActiva || ruta.query.liga || null
    if (idLiga) {
        router.push({ name: 'inicio', query: { liga: idLiga } })
    } else {
        router.push({ name: 'ligas' })
    }
}

const ocultarResumenEquipo = computed(() => {
    return ruta.name === 'ligas' || ruta.name === 'perfil' || ruta.name === 'jornada'
})
</script>

<template>
    <header class="w-full p-3 flex justify-between sticky top-0 z-40 bg-[#1A1A1F] border-b border-[#E10600]">
        <div class="flex items-center gap-2">
            <img src="/logo.png" class="h-8 w-8 object-contain" @click="irADashboard" />
            <div class="text-left">
                <p class="text-white font-bold uppercase text">{{ storeUsuario.usuarioActual.nombreVisible }}</p>
                <p v-if="!ocultarResumenEquipo" class="mt-0.5 text-xs text-white">
                    Pts: <strong class="text-[#D4A843]">{{ storeGaraje.puntos }}</strong>
                    | <span class="text-emerald-500 font-bold">{{ Number(storeGaraje.presupuesto || 0).toFixed(2)
                        }}M</span>
                    <span v-if="storeMercado.totalPujasComprometidas > 0" class="text-[#D4A843] font-bold">
                        (-{{ storeMercado.totalPujasComprometidas.toFixed(2) }}M)
                    </span>
                </p>
            </div>
        </div>

        <div class="flex items-center gap-2">
            <Button @click="router.push({ name: 'ligas' })" icon="pi pi-trophy" text class="!text-zinc-400" />
            <Button @click="router.push({ name: 'perfil' })" icon="pi pi-user" text class="!text-zinc-400" />
            <Button @click="manejarCerrarSesion" icon="pi pi-sign-out" text class="!text-zinc-400" />
        </div>
    </header>
</template>
