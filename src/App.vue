<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

import { usarStoreAutenticacion } from '@/stores/storeAutenticacion'
import { usarStorePerfil } from '@/stores/storePerfil'
import { usarStoreLigas } from '@/stores/storeLigas'

const storeAutenticacion = usarStoreAutenticacion()
const storePerfil = usarStorePerfil()
const storeLigas = usarStoreLigas()
const router = useRouter()

let cancelarObservadorAutenticacion = () => { }
let cancelarEscuchaPerfil = () => { }

onMounted(() => {
  cancelarObservadorAutenticacion = storeAutenticacion.observarEstadoSesion((usuario) => {
    if (!usuario) {
      cancelarEscuchaPerfil()
      cancelarEscuchaPerfil = () => { }
      storeAutenticacion.limpiarSesion()
      const rutaActual = router.currentRoute.value.path
      const estaEnRutaPublica = rutaActual === '/' || rutaActual === '/registro'
      if (!estaEnRutaPublica) router.push('/')
    } else {
      cancelarEscuchaPerfil()
      cancelarEscuchaPerfil = storePerfil.observarPerfil(usuario.uid, async (datosPerfil) => {
        if (!storeAutenticacion.datosCargados) return

        const idsNuevos = datosPerfil.ligasIds || []
        const idsAnteriores = storePerfil.usuarioActual.idsLigas
        const ligasEliminadas = idsAnteriores.filter((id) => !idsNuevos.includes(id))

        if (ligasEliminadas.length === 0) return

        storePerfil.actualizarIdsLigas(idsNuevos)
        await storeLigas.cargarLigasUsuario()

        if (ligasEliminadas.includes(storeLigas.idLigaActiva)) {
          storeLigas.idLigaActiva = null
          router.push({ name: 'ligas' })
        }
      })
    }
  })
})

onUnmounted(() => {
  cancelarObservadorAutenticacion()
  cancelarEscuchaPerfil()
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

  <div v-if="!storeAutenticacion.datosCargados" class="flex flex-col items-center justify-center h-screen w-full gap-3">
    <i class="text-4xl text-[#D4A843] pi pi-spinner animate-spin"></i>
    <p class="text-[#D4A843] text-sm font-bold uppercase tracking-widest animate-pulse">Cargando...</p>
  </div>

  <RouterView v-else />
</template>
