<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import GestorPWA from '@/components/GestorPWA.vue'

import { usarStoreAutenticacion } from '@/stores/storeAutenticacion'
import { escucharCambioEstadoAutenticacion } from '@/services/servicioAutenticacion'

const storeAutenticacion = usarStoreAutenticacion()
const enrutador = useRouter()

/* Iniciamos el observador para detectar cambios en el estado */
let cancelarObservadorAutenticacion = () => { }

/**
 * Observa los cambios de estado de autenticación de Firebase.
 * Cuando el usuario cierra sesión, limpia el estado del store y redirige al inicio.
 * El observador se registra en onMounted y se cancela en onUnmounted.
 */
onMounted(() => {
  cancelarObservadorAutenticacion = escucharCambioEstadoAutenticacion((usuario) => {
    // El usuario ha cerrado la sesion o la sesión ha expirado
    if (!usuario) {
      storeAutenticacion.limpiarSesion()
      const rutaActual = enrutador.currentRoute.value.path
      const estaEnRutaPublica = rutaActual === '/' || rutaActual === '/registro'
      // ¿No está en una ruta pública? Es expulsado.
      if (!estaEnRutaPublica) enrutador.push('/')
    }
  })
})

// Al desmontar, apagamos el observador.
onUnmounted(() => {
  cancelarObservadorAutenticacion()
})
</script>

<!---------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!---------------------------------------------------------------------------------------------------------------------------->

<template>
  <!-- Fondo base de la aplicación -->
  <div class="fixed inset-0 h-full w-full bg-[#0C0C0E] -z-40"></div>

  <!-- Componentes de PrimeVue -->
  <Toast position="top-center" />
  <ConfirmDialog :pt="{
    root: { class: '!bg-[#1A1A1F] !border-none' },
    title: { class: 'text-[#D4A843]' },
    content: { class: '!text-[#F0ECEC]' },
    footer: { class: '!bg-transparent gap-2 flex justify-end' },
    icon: { class: '!text-[#E10600]' },
  }" />

  <!-- Gestor de la PWA: instalación y avisos de nueva versión -->
  <GestorPWA />

  <!-- Muestra un loader mientras se cargan los datos de autenticación -->
  <div v-if="!storeAutenticacion.datosCargados" class="flex flex-col items-center justify-center h-screen w-full gap-3">
    <i class="text-4xl text-[#D4A843] pi pi-spinner animate-spin"></i>
    <p class="text-[#D4A843] text-sm font-bold uppercase tracking-widest animate-pulse">Entrando al paddock...</p>
  </div>

  <RouterView v-else />
</template>
