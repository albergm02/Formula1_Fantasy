<script setup>
import { useRouter } from 'vue-router'
import { onMounted } from 'vue';
import { RouterView } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

import { useFantasyStore } from '@/stores/storeFantasy'
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const partida = useFantasyStore()
const auth = getAuth()
const router = useRouter()

onMounted(() => {
  /* Observo cambios de sesión */
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      /* 1. SI HAY USUARIO: Guardamos su email en el store para usarlo como ID en Firebase, 
      inicializamos los datos del usuario desde Firebase y lo mandamos al inicio */
      partida.usuario.emailAuth = user.email
      await partida.inicializarDatos(user.email)
    } else {
      /* 2. SI NO HAY USUARIO: Limpiamos el email del store, 
      marcamos los datos como cargados para evitar el bucle de carga, 
      y redirigimos al login */
      partida.usuario.emailAuth = ''
      partida.datosCargados = true
      router.push('/') 
    }
  })
})
</script>

<template>
  <!-- Fondo de pantalla fijo con overlay oscuro para mejorar la legibilidad -->
  <div
    class="fixed inset-0 -z-10 h-full w-full bg-[url('/background.jpg')] bg-cover bg-center bg-no-repeat"
  >
    <div class="absolute inset-0 bg-zinc-900/70"></div>
  </div>

  <Toast position="top-center" />
  <ConfirmDialog />

  <!-- Sección de carga para cuando esté cargando -->
  <div v-if="!partida.datosCargados" class="flex h-screen w-full items-center justify-center">
    <p class="text-sm font-bold text-white">Cargando...</p>
  </div>

  <!-- v-else para mostrar el contenido principal cuando no se está cargando -->
  <RouterView v-else />

</template>

<style scoped></style>
