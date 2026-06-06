<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { enviarVerificacionCorreo, cerrarSesion, obtenerUsuarioActual } from '@/services/servicioAutenticacion'
import { usarStoreAutenticacion } from '@/stores/storeAutenticacion'

import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const notificacion = useToast()
const storeAutenticacion = usarStoreAutenticacion()

const cargandoReenvio = ref(false)
const cargandoComprobacion = ref(false)

/**
 * Reenvía el correo de verificación al usuario actual.
 * Firebase impone un límite de intentos, así que capturamos el error de cuota.
 */
const reenviarCorreo = async () => {
    cargandoReenvio.value = true
    try {
        await enviarVerificacionCorreo()
        notificacion.add({
            severity: 'success',
            summary: 'Correo enviado',
            detail: 'Revisa tu bandeja de entrada y la carpeta de spam.',
            life: 5000,
        })
    } catch (error) {
        if (error?.code === 'auth/too-many-requests') {
            notificacion.add({
                severity: 'warn',
                summary: 'Demasiados intentos',
                detail: 'Espera unos minutos antes de solicitar otro correo.',
                life: 5000,
            })
        } else {
            notificacion.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo enviar el correo. Inténtalo más tarde.',
                life: 5000,
            })
        }
    } finally {
        cargandoReenvio.value = false
    }
}

/**
 * Recarga el estado del usuario desde Firebase para comprobar si ya verificó.
 * Si el correo está verificado, redirige a /ligas.
 */
const comprobarVerificacion = async () => {
    cargandoComprobacion.value = true
    try {
        const usuario = await obtenerUsuarioActual()
        await usuario.reload()
        if (usuario.emailVerified) {
            await storeAutenticacion.verificarExistenciaPerfil(usuario.uid, usuario.email)
            router.push('/ligas')
        } else {
            notificacion.add({
                severity: 'warn',
                summary: 'Aún no verificado',
                detail: 'No hemos detectado la verificación todavía. Revisa tu correo.',
                life: 4000,
            })
        }
    } finally {
        cargandoComprobacion.value = false
    }
}

/**
 * Cierra la sesión y redirige al login.
 */
const salir = async () => {
    await cerrarSesion()
    router.push('/')
}
</script>


<template>
    <div class="flex items-center justify-center min-h-screen p-4">
        <div class="w-full max-w-md flex flex-col items-center gap-6 text-center">

            <img src="/logo.png" alt="Logo F1" class="w-20 h-20 object-contain" />

            <div class="flex flex-col gap-2">
                <h1 class="text-2xl font-black uppercase text-[#E10600]">Verifica tu correo</h1>
                <p class="text-[#F0ECEC] text-sm">
                    Te hemos enviado un enlace de verificación. Ábrelo desde tu correo para acceder a la aplicación.
                </p>
                <p class="text-[#a1a1aa] text-xs">Revisa también la carpeta de spam.</p>
            </div>

            <div class="flex flex-col gap-3 w-full">
                <Button label="Ya lo verifiqué" class="w-full" :loading="cargandoComprobacion"
                    @click="comprobarVerificacion" />
                <Button label="Reenviar correo" severity="secondary" class="w-full" :loading="cargandoReenvio"
                    @click="reenviarCorreo" />
                <Button label="Volver al inicio" icon="pi pi-sign-out" severity="secondary" variant="text"
                    class="w-full" @click="salir" />
            </div>

        </div>
    </div>
</template>
