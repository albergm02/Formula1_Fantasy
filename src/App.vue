<template>
  <div class="fixed inset-0 -z-30 h-full w-full bg-[#1A1A1F]"></div>

  <Toast position="top-center" />
  <ConfirmDialog :pt="{
    root: {
      class:
        '!bg-[#1A1A1F] !border-none',
    },
    title: { class: 'text-[#D4A843]' },
    content: { class: ' !text-[#F0ECEC]' },
    footer: { class: '!bg-transparent gap-2 flex justify-end' },
    icon: { class: '!text-[#E10600]' },
  }"></ConfirmDialog>

  <!-- SecciÃ³n de carga para cuando estÃ© cargando -->
  <div v-if="!storeAutenticacion.datosCargados" class="flex flex-col items-center justify-center h-screen w-full gap-3">
    <i class="pi pi-spinner text-4xl text-[#D4A843] animate-spin"></i>
    <p class="text-[#D4A843] text-sm font-bold uppercase tracking-widest animate-pulse">Verificando credenciales...</p>
  </div>

  <RouterView v-else />
</template>

<script setup>
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

import { usarStoreAutenticacion } from './stores/storeAutenticacion'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

const storeAutenticacion = usarStoreAutenticacion()
const auth = getAuth()
const router = useRouter()

onMounted(() => {
  /* Observa cambios de sesiÃ³n: solo gestiona el cierre de sesiÃ³n */
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      storeAutenticacion.limpiarSesion()
      if (router.currentRoute.value.path !== '/' && router.currentRoute.value.path !== 'registro')
        router.push('/')
    }
  })
})
</script>


