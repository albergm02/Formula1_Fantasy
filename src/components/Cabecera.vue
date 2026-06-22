<script setup>
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usarStorePerfil } from '@/stores/storePerfil'
import { usarStoreGaraje } from '@/stores/storeGaraje'
import { usarStoreMercado } from '@/stores/storeMercado'
import { usarStoreAutenticacion } from '@/stores/storeAutenticacion'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'

const router = useRouter()
const ruta = useRoute()
const storePerfil = usarStorePerfil()
const storeGaraje = usarStoreGaraje()
const storeMercado = usarStoreMercado()
const storeAutenticacion = usarStoreAutenticacion()

const dialogoCerrarSesion = ref(false)

const abrirConfirmacionCerrarSesion = () => {
  dialogoCerrarSesion.value = true
}

const confirmarCerrarSesion = async () => {
  dialogoCerrarSesion.value = false
  await storeAutenticacion.cerrarSesion()
  router.push({ name: 'login' })
}

const irADashboard = () => {
  const idLiga = storeGaraje.idLigaActiva || ruta.query.liga || null
  if (idLiga) {
    router.push({ name: 'inicio', query: { liga: idLiga } })
  } else {
    router.push({ name: 'ligas' })
  }
}

const ocultarResumenEquipo = computed(() => ruta.name === 'ligas' || ruta.name === 'perfil' || ruta.name === 'jornada')
</script>

<template>
  <header class="w-full px-4 py-4 flex justify-between sticky top-0 z-40 bg-[#1A1A1F] border-b border-[#E10600]">
    <div class="flex items-center gap-3">
      <img src="/logo.png" class="h-11 w-11 object-contain cursor-pointer" @click="irADashboard" />
      <div class="text-left">
        <p class="text-white font-bold uppercase text-base">{{ storePerfil.usuarioActual.nombreVisible }}</p>
        <p v-if="!ocultarResumenEquipo" class="mt-0.5 text-xs text-white">
          Pts: <strong class="text-[#D4A843]">{{ storeGaraje.puntos }}</strong> |
          <span class="text-emerald-500 font-bold">{{ Number(storeGaraje.presupuesto || 0).toFixed(2) }}M</span>
          <span v-if="storeMercado.totalPujasComprometidas > 0" class="text-[#D4A843] font-bold">
            (-{{ storeMercado.totalPujasComprometidas.toFixed(2) }}M)
          </span>
        </p>
      </div>
    </div>

    <div class="flex items-center gap-1">
      <Button @click="router.push({ name: 'ligas' })" icon="pi pi-trophy" text class="!text-zinc-400 !text-xl" />
      <Button @click="router.push({ name: 'perfil' })" icon="pi pi-user" text class="!text-zinc-400 !text-xl" />
      <Button @click="abrirConfirmacionCerrarSesion" icon="pi pi-sign-out" text class="!text-zinc-400 !text-xl" />
    </div>
  </header>

  <Dialog
    v-model:visible="dialogoCerrarSesion"
    modal
    header="CERRAR SESIÓN"
    :style="{ width: '90vw', maxWidth: '300px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }"
  >
    <div class="space-y-4">
      <p class="text-sm text-zinc-300 text-center">¿Seguro que quieres cerrar la sesión?</p>
      <button
        @click="confirmarCerrarSesion"
        class="w-full py-3 bg-[#E10600]/70 border border-[#E10600] text-white font-black uppercase tracking-widest"
      >
        CERRAR SESIÓN
      </button>
      <button @click="dialogoCerrarSesion = false" class="w-full py-2 text-zinc-400 text-xs font-bold uppercase tracking-widest">
        CANCELAR
      </button>
    </div>
  </Dialog>
</template>
