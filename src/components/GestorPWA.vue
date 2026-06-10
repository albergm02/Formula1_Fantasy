<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue'

// Evita un bucle de recargas si onNeedRefresh y controllerchange se disparan a la vez.
let actualizandoPagina = false

// onNeedRefresh es el mecanismo principal en iOS/Safari, donde `controllerchange`
// no es fiable. updateServiceWorker(true) envía skipWaiting al SW y recarga.
const { updateServiceWorker } = useRegisterSW({
    immediate: true,
    onNeedRefresh() {
        if (actualizandoPagina) return
        actualizandoPagina = true
        updateServiceWorker(true)
    },
})

// Fallback para PC y Android Chrome: si el SW activo cambia desde otra pestaña,
// onNeedRefresh no se dispara y recargamos manualmente para traer los nuevos chunks.
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (actualizandoPagina) return
        actualizandoPagina = true
        window.location.reload()
    })
}
</script>

<template>
    <div></div>
</template>
