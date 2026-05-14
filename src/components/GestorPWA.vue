<script setup>
// Gestiona la instalación nativa de la PWA y el aviso de nueva versión del Service Worker.
import { ref, onMounted, onUnmounted } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import Button from 'primevue/button'

const promptInstalacion = ref(null)
const mostrarBotonInstalar = ref(false)

const { needRefresh, updateServiceWorker } = useRegisterSW({
    immediate: true,
})

function capturarPromptInstalacion(evento) {
    evento.preventDefault()
    promptInstalacion.value = evento
    mostrarBotonInstalar.value = true
}

async function lanzarInstalacion() {
    if (!promptInstalacion.value) return
    promptInstalacion.value.prompt()
    await promptInstalacion.value.userChoice
    promptInstalacion.value = null
    mostrarBotonInstalar.value = false
}

function descartarInstalacion() {
    mostrarBotonInstalar.value = false
}

function aplicarActualizacion() {
    updateServiceWorker(true)
}

onMounted(() => {
    window.addEventListener('beforeinstallprompt', capturarPromptInstalacion)
    window.addEventListener('appinstalled', descartarInstalacion)
})

onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', capturarPromptInstalacion)
    window.removeEventListener('appinstalled', descartarInstalacion)
})
</script>

<template>
    <div v-if="mostrarBotonInstalar"
        class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#1A1A1F] border border-[#E10600] px-3 py-2 shadow-lg">
        <i class="pi pi-download text-[#E10600]" />
        <span class="text-xs text-[#F0ECEC] font-bold uppercase tracking-wide">Instalar F1 Fantasy</span>
        <Button @click="lanzarInstalacion" icon="pi pi-check" size="small" rounded
            class="!bg-[#E10600] !border-[#E10600] hover:!bg-red-700 !w-8 !h-8" aria-label="Instalar aplicación" />
        <Button @click="descartarInstalacion" icon="pi pi-times" size="small" rounded text
            class="!text-zinc-400 hover:!text-white !w-8 !h-8" aria-label="Cerrar" />
    </div>

    <div v-if="needRefresh"
        class="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#1A1A1F] border border-[#D4A843] px-3 py-2 shadow-lg">
        <i class="pi pi-refresh text-[#D4A843]" />
        <span class="text-xs text-[#F0ECEC] font-bold uppercase tracking-wide">Nueva versión disponible</span>
        <Button @click="aplicarActualizacion" label="Actualizar" size="small"
            class="!bg-[#D4A843] !border-[#D4A843] !text-black hover:!bg-yellow-600" />
    </div>
</template>
