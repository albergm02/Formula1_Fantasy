<template>
  <div class="min-h-screen bg-[#15151E] font-sans pb-10">
    <Header />

    <div class="p-6 mt-4">
      <header class="mb-6">
        <h1 class="text-3xl font-black text-[#FF1E00]">Bienvenido, {{ authStore.usuarioGlobal.nombre }}</h1>
        <p class="text-sm text-[#D9D9D9] mt-1">Administra tus ligas, únete a nuevas o crea la tuya propia.</p>
      </header>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'

import { useLigasStore } from '@/stores/storeLigas'
import { useAuthStore } from '@/stores/storeAuth'
import Header from '@/components/Header.vue'

import Card from 'primevue/card'
import DataView from 'primevue/dataview'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'

const authStore = useAuthStore()
const ligasStore = useLigasStore()
const router = useRouter()
const toast = useToast()

const nombreNuevaLiga = ref('')
const codigoUnion = ref('')
const cargando = ref(false)

onMounted(async () => {
  cargando.value = true
  await ligasStore.cargarMisLigas()
  cargando.value = false
})

const crearLiga = async () => {
  if (nombreNuevaLiga.value.trim().length < 3) {
    toast.add({
      severity: 'warn',
      summary: 'Nombre inválido',
      detail: 'El nombre debe tener al menos 3 caracteres',
      life: 3000,
    })
    return
  }

  const resultado = await ligasStore.crearLiga(nombreNuevaLiga.value)
  if (resultado.exito) {
    toast.add({
      severity: 'success',
      summary: '¡Liga creada!',
      detail: resultado.mensaje,
      life: 3000,
    })
    nombreNuevaLiga.value = ''
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error al crear',
      detail: resultado.mensaje,
      life: 3000,
    })
  }
}

const unirseALiga = async () => {
  if (!codigoUnion.value) return
  const resultado = await ligasStore.unirseALiga(codigoUnion.value)

  if (resultado.exito) {
    toast.add({
      severity: 'success',
      summary: '¡Bienvenido!',
      detail: resultado.mensaje,
      life: 3000,
    })
    codigoUnion.value = ''
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error al unirse',
      detail: resultado.mensaje,
      life: 3000,
    })
  }
}

const entrarEnLiga = (ligaId) => {
  router.push({ name: 'inicio', query: { liga: ligaId } })
}
</script>
