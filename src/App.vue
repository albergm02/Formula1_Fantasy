<template>
  <div class="fixed inset-0 -z-30 h-full w-full bg-[#15151E]"></div>

  <Toast position="top-center" />
  <ConfirmDialog />

  <!-- Sección de carga para cuando esté cargando -->
  <div v-if="!authStore.datosCargados" class="flex h-screen w-full items-center justify-center">
    <i class="pi pi-spin pi-spinner text-3xl text-emerald-500"></i>
    <p class="text-sm font-bold text-white uppercase">Verificando credenciales...</p>
  </div>

  <RouterView v-else />

</template>

<script setup>
import { useRouter } from 'vue-router'
import { onMounted } from 'vue';
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

import { useAuthStore } from './stores/storeAuth';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const authStore = useAuthStore()
const auth = getAuth()
const router = useRouter()


onMounted(() => {
  /* Observa cambios de sesión */
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (!authStore.usuarioGlobal.emailAuth) {
        await authStore.iniciarDatosGlobales(user.email, user.displayName)
      }
    } else {
      authStore.cerrarSesion()
      if (router.currentRoute.value.path !== '/' && router.currentRoute.value.path !== 'registro') router.push('/')
    }
  })
})
</script>
