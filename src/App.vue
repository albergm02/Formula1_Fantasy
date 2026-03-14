<template>
  <div class="fixed inset-0 -z-10 h-full w-full bg-[#0c0c12]">
    <div class="absolute inset-0 bg-zinc-900/70"></div>
  </div>

  <Toast position="top-center" />
  <ConfirmDialog />

  <!-- Sección de carga para cuando esté cargando -->
  <div v-if="!partida.datosCargados" class="flex h-screen w-full items-center justify-center">
    <i class="pi pi-spin pi-spinner text-3xl text-emerald-500"></i>
    <p class="text-sm font-bold text-white uppercase">Verificando credenciales...</p>
  </div>

  <!-- v-else para mostrar el contenido principal cuando no se está cargando -->
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
      await authStore.iniciarDatosGlobales(user.email, user.displayName)
    } else {
      authStore.cerrarSesion()
      router.push('/')
    }
  })
})
</script>
