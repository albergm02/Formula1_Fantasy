<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue'

/**
 * Bandera compartida para evitar un bucle de recargas si varios mecanismos
 * se disparan en la misma sesión.
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

/**
 * Mecanismo de seguridad para iOS con la app en background (NO cerrada del todo).
 * Cuando el usuario vuelve a la app tras más de 5 minutos suspendida, iOS puede
 * haber dejado el JS antiguo en memoria. Forzamos recarga para evitar que Vue
 * Router intente cargar chunks con hashes desactualizados.
 * Nota: el caso «app cerrada y reabierta» (cold start) está resuelto a nivel
 * de servidor — firebase.json sirve index.html con Cache-Control: no-cache en
 * la ruta «/», garantizando que iOS siempre descargue el index.html más reciente.
 */
const MINUTOS_PARA_FORZAR_RECARGA = 5
let momentoOcultacion = null

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        momentoOcultacion = Date.now()
        return
    }

    if (!momentoOcultacion) return
    const minutosEnBackground = (Date.now() - momentoOcultacion) / 60000

    if (minutosEnBackground >= MINUTOS_PARA_FORZAR_RECARGA && !actualizandoPagina) {
        actualizandoPagina = true
        window.location.reload()
    }
})
</script>

<template>
    <div></div>
</template>
