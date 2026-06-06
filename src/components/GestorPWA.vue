<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue'

/**
 * Bandera compartida para evitar un bucle de recargas si ambos mecanismos
 * (onNeedRefresh y controllerchange) se disparan en la misma sesión.
 */
let actualizandoPagina = false

/**
 * onNeedRefresh: se activa cuando hay un nuevo SW instalado y en espera.
 * Es el mecanismo principal para iOS/Safari, donde controllerchange no es fiable.
 * Llamar a updateServiceWorker(true) envía skipWaiting al SW y recarga la página.
 */
const { updateServiceWorker } = useRegisterSW({
    immediate: true,
    onNeedRefresh() {
        if (actualizandoPagina) return
        actualizandoPagina = true
        updateServiceWorker(true)
    },
})

/**
 * Fallback para PC y Android Chrome: controllerchange se emite cuando el SW
 * activo cambia y onNeedRefresh no se llegó a disparar (ej: SW activado desde
 * otra pestaña). Fuerza recarga para cargar los nuevos chunks JS.
 */
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
