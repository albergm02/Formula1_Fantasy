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

let cancelarObservadorAutenticacion = () => { }

// Si Firebase detecta que el usuario cerró sesión, limpiamos el store y
// expulsamos al login salvo que ya esté en una ruta pública.
onMounted(() => {
  cancelarObservadorAutenticacion = escucharCambioEstadoAutenticacion((usuario) => {
    if (!usuario) {
      storeAutenticacion.limpiarSesion()
      const rutaActual = enrutador.currentRoute.value.path
      const estaEnRutaPublica = rutaActual === '/' || rutaActual === '/registro'
      if (!estaEnRutaPublica) enrutador.push('/')
    }
  })
})

onUnmounted(() => {
  cancelarObservadorAutenticacion()
})
</script>

<template>
  <div class="fixed inset-0 h-full w-full bg-[#0C0C0E] -z-40"></div>

  <Toast position="top-center" />
  <ConfirmDialog :pt="{
    root: { class: '!bg-[#1A1A1F] !border-none' },
    title: { class: 'text-[#D4A843]' },
    content: { class: '!text-[#F0ECEC]' },
    footer: { class: '!bg-transparent gap-2 flex justify-end' },
    icon: { class: '!text-[#E10600]' },
  }" />

  <GestorPWA />

  <!-- Spinner mientras se resuelve el estado inicial de autenticación. -->
  <div v-if="!storeAutenticacion.datosCargados" class="flex flex-col items-center justify-center h-screen w-full gap-3">
    <i class="text-4xl text-[#D4A843] pi pi-spinner animate-spin"></i>
    <p class="text-[#D4A843] text-sm font-bold uppercase tracking-widest animate-pulse">Entrando al paddock...</p>
  </div>

  <RouterView v-else />
</template>
