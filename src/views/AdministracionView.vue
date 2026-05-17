<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { cerrarSesion } from '@/services/servicioAutenticacion'
import SeccionTesting from '@/components/admin/SeccionTesting.vue'
import SeccionRachas from '@/components/admin/SeccionRachas.vue'
import SeccionAnalisis from '@/components/admin/SeccionAnalisis.vue'
import Button from 'primevue/button'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

const enrutador = useRouter()
const seccionActiva = ref('testing')

async function manejarCerrarSesion() {
    await cerrarSesion()
    enrutador.push({ name: 'login' })
}
</script>

<template>
    <div class="min-h-screen bg-[#0C0C0E] text-[#F0ECEC] flex flex-col">
        <Toast position="bottom-right" />
        <ConfirmDialog />

        <header class="w-full p-3 flex justify-between sticky top-0 z-40 bg-[#1A1A1F] border-b border-[#E10600]">
            <div class="flex items-center gap-2">
                <img src="/logo.png" class="h-8 w-8 object-contain" />
                <span class="font-black italic text-[#E10600] text-lg">F1 FANTASY · ADMIN</span>
            </div>
            <Button @click="manejarCerrarSesion" icon="pi pi-sign-out" text
                class="!text-zinc-400 hover:!text-red-500 cursor-pointer" />
        </header>

        <main class="flex-1 p-4 max-w-6xl mx-auto w-full space-y-4">
            <header>
                <h1 class="text-xl font-black uppercase tracking-wide">Panel de administración</h1>
                <p class="text-zinc-500 text-xs mt-1">
                    Gestión separada por responsabilidad: validación funcional con datos reales,
                    ajuste de rachas del catálogo y análisis del sistema.
                </p>
            </header>

            <Tabs v-model:value="seccionActiva">
                <TabList>
                    <Tab value="testing">
                        <i class="pi pi-bolt mr-2" />
                        Testing
                    </Tab>
                    <Tab value="rachas">
                        <i class="pi pi-chart-line mr-2" />
                        Rachas
                    </Tab>
                    <Tab value="analisis">
                        <i class="pi pi-chart-pie mr-2" />
                        Análisis
                    </Tab>
                </TabList>
                <TabPanels class="!bg-transparent !px-0">
                    <TabPanel value="testing">
                        <SeccionTesting />
                    </TabPanel>
                    <TabPanel value="rachas">
                        <SeccionRachas />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </main>
    </div>
</template>
