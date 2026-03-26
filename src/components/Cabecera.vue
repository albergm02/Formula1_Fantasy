<script setup>
import { useRouter } from 'vue-router'
import { usarStoreAutenticacion } from '@/stores/storeAutenticacion'
import { usarStoreEscuderia } from '@/stores/storeEquipo'
import { cerrarSesion } from '@/services/servicioAutenticacion'
import Button from 'primevue/button'
import { useRoute } from 'vue-router'


const enrutador = useRouter()
const ruta = useRoute()
const storeAutenticacion = usarStoreAutenticacion()
const escuderiaStore = usarStoreEscuderia()


const handlerCerrarSesion = async () => {
    try {
        await cerrarSesion()
        enrutador.push({ name: 'login' })
    } catch (error) {
        console.error('Error en cerrar sesiÃ³n (Cabecera.vue):', error)
    }
}

const irADashboard = () => {
    const idLiga = escuderiaStore.idLigaActiva || ruta.query.liga || null
    if (idLiga) {
        enrutador.push({ name: 'inicio', query: { liga: idLiga } })
    } else {
        enrutador.push({ name: 'ligas' })
    }

}
</script>

<template>
    <!-- z-10 para que el header estÃ© por encima de otros elementos / border-b (border-bottom) -->
    <header class="w-full p-3 flex justify-between sticky top-0 z-40 bg-[#1A1A1F] border-b border-[#E10600]">
        <div class="flex items-center gap-2">
            <img src="/logo.png" class="h-16 w-16 object-contain cursor-pointer" @click="irADashboard" />
            <span class="sm:block font-black italic text-[#E10600] text-lg cursor-pointer" @click="irADashboard">F1
                FANTASY</span>
        </div>

        <div class="flex items-center gap-3">
            <div class="text-right">
                <p class="text-white font-bold uppercase text">{{ storeAutenticacion.usuarioActual.nombreVisible }}</p>
                <p v-if="ruta.name !== 'ligas'" class="mt-0.5 text-xs text-white">
                    Pts: <strong class="text-[#D4A843]">{{ escuderiaStore.puntos }}</strong>
                    | <span class="text-emerald-500 font-bold">{{ escuderiaStore.presupuesto }}M</span>
                </p>
            </div>
            <!-- hover es utilizado para cambiar el color al clickear -->
            <Button @click="handlerCerrarSesion" icon="pi pi-sign-out" text
                class="!text-zinc-400 hover:!text-red-500 cursor-pointer" />
        </div>
    </header>
</template>



