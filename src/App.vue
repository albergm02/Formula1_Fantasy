<template>
  <div class="fixed inset-0 -z-30 h-full w-full bg-[#15151E]"></div>

  <Toast position="top-center" />
  <ConfirmDialog
    :pt="{
      root: {
        class:
          '!bg-[#15151E] !border-none',
      },
      title: { class: 'text-[#00E5E5]' },
      content: { class: ' !text-[#D9D9D9]' },
      footer: { class: '!bg-transparent gap-2 flex justify-end' },
      icon: { class: '!text-[#FF1E00]' },
    }"
  ></ConfirmDialog>

  <!-- Sección de carga para cuando esté cargando -->
  <div v-if="!authStore.datosCargados" class="flex flex-col items-center justify-center h-screen w-full gap-3">
    <i class="pi pi-spinner text-4xl text-[#00E5E5] animate-spin"></i>
    <p class="text-[#00E5E5] text-sm font-bold uppercase tracking-widest animate-pulse">Verificando credenciales...</p>
  </div>

  <RouterView v-else />
</template>

<script setup>
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

import { useAuthStore } from './stores/storeAuth'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

const authStore = useAuthStore()
const auth = getAuth()
const router = useRouter()

onMounted(() => {
  /* Observa cambios de sesión */
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (!authStore.usuarioGlobal.emailAuth) {
        await authStore.initializeUserData(user.email, user.displayName)
      }
    } else {
      authStore.cerrarSesion()
      if (router.currentRoute.value.path !== '/' && router.currentRoute.value.path !== 'registro')
        router.push('/')
    }
  })
})
</script>
