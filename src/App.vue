<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

import Beams from '@/components/vue-bits/Beams.vue'
import { usarStoreAutenticacion } from '@/stores/storeAutenticacion'
import { escucharCambioEstadoAutenticacion } from '@/services/servicioAutenticacion'

const storeAutenticacion = usarStoreAutenticacion()
const enrutador = useRouter()
const ruta = useRoute()

const RUTAS_SIN_FONDO = ['login', 'registro', 'registro-google']
const mostrarFondoBeams = computed(() => storeAutenticacion.datosCargados && !RUTAS_SIN_FONDO.includes(ruta.name))

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
  <div class="fixed inset-0 h-full w-full bg-transparent -z-40"></div>

  <!-- Fondo animado: visible solo en vistas autenticadas -->
  <div v-if="mostrarFondoBeams" class="fixed inset-0 -z-20 opacity-60"
    style="transform: translateZ(0); backface-visibility: hidden; contain: strict;">
    <Beams :beam-width="1" :beam-height="10" :beam-number="10" :light-color="'red'" :speed="2" :noise-intensity="1.75"
      :scale="0.55" />
  </div>

  <!-- Componentes de PrimeVue -->
  <Toast position="top-center" />
  <ConfirmDialog :pt="{
    root: { class: '!bg-[#1A1A1F] !border-none' },
    title: { class: 'text-[#D4A843]' },
    content: { class: '!text-[#F0ECEC]' },
    footer: { class: '!bg-transparent gap-2 flex justify-end' },
    icon: { class: '!text-[#E10600]' },
  }" />

  <!-- Muestra un loader mientras se cargan los datos de autenticación -->
  <div v-if="!storeAutenticacion.datosCargados" class="flex flex-col items-center justify-center h-screen w-full gap-3">
    <i class="text-4xl text-[#D4A843] pi pi-spinner animate-spin"></i>
    <p class="text-[#D4A843] text-sm font-bold uppercase tracking-widest animate-pulse">Entrando al paddock...</p>
  </div>

  <RouterView v-else />
</template>
