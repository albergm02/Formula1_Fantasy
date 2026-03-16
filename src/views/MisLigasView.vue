<template>
  <div class="min-h-screen bg-[#15151E] font-sans pb-10">
    <Header />

    <div class="p-4 mt-4 max-w-4xl mx-auto">
      <div class="flex flex-col gap-6">

        <section class="grid grid-cols-2 gap-4">
          <Button label="CREAR LIGA" icon="pi pi-plus"
            class="w-full py-3 !bg-[#3C6E71] !border-none font-bold text-sm tracking-wider shadow-md hover:!bg-[#2d5456] transition-colors"
            @click="mostrarDialogoCrear = true" />
          <Button label="UNIRSE" icon="pi pi-sign-in"
            class="w-full py-3 !bg-transparent !border-2 !border-[#3C6E71] !text-[#3C6E71] font-bold text-sm tracking-wider hover:!bg-[#3C6E71]/10 transition-colors"
            @click="mostrarDialogoUnirse = true" />
        </section>

        <section>
          <DataView v-if="ligasStore.ligasDetalles.length > 0" :value="ligasStore.ligasDetalles"
            :pt="{ content: { class: '!bg-transparent' } }">
            <template #list="slotProps">
              <div class="flex flex-col gap-3 w-full">
                <div v-for="liga in slotProps.items" :key="liga.id"
                  class="flex justify-between items-center bg-[#15151E] border border-[#3C6E71]/30 p-4 rounded-xl shadow-sm hover:border-[#3C6E71] transition-all">
                  <div class="flex flex-col">
                    <h3 class="text-xl font-bold text-[#FFFFFF] leading-tight">{{ liga.nombre }}</h3>
                    <div class="flex gap-4 mt-1 text-xs text-[#D9D9D9] font-medium">
                      <span class="flex items-center gap-1">
                        <i class="pi pi-users text-[#3C6E71] text-xs"></i> {{ liga.participantes }} Pilotos
                      </span>
                      <span class="flex items-center gap-1">
                        <i class="pi pi-key text-[#3C6E71] text-xs"></i> {{ liga.codigo_invitacion }}
                      </span>
                    </div>
                  </div>

                  <Button label="ENTRAR" icon="pi pi-chevron-right" iconPos="right"
                    class="!bg-[#FF1E00] !border-none !text-[#FFFFFF] font-bold text-sm px-4 py-2 hover:!bg-[#D01800] shadow-md transition-colors"
                    @click="entrarEnLiga(liga.id)" />
                </div>
              </div>
            </template>
          </DataView>

          <div v-else class="flex justify-center mt-4">
            <Message severity="secondary"
              class="!text-center !bg-transparent !border !border-[#D9D9D9]/20 !text-[#D9D9D9]">
              No perteneces a ninguna liga todavía.
            </Message>
          </div>
        </section>
      </div>
    </div>

    <!-- DIALOGO CREAR LIGA -->
    <Dialog v-model:visible="mostrarDialogoCrear" modal header="CREAR CAMPEONATO" :pt="{
      root: { class: '!bg-[#15151E] !border-none' },
      header: { class: '!bg-[#15151E] !rounded' },
      title: { class: 'font-bold tracking-widest text-[#FF1E00]' },
      content: { class: '!bg-[#15151E] pt-4' },
      closeButton: { class: 'hover:!bg-[#D9D9D9] !text-[#D9D9D9]' }
    }">
      <div class="flex flex-col gap-4">
        <span class="pi pi-exclamation-triangle text-[#D9D9D9]"> Máximo de 3 ligas por usuario</span>
        <InputText v-model="nombreNuevaLiga" placeholder="Introduzca aquí el nombre"
          class="w-full !bg-[#15151E] !text-[#D9D9D9] focus:!border-[#FF1E00]" autofocus />
        <div class="flex justify-end gap-2 mt-2">
          <Button label="Cancelar" @click="mostrarDialogoCrear = false"
            class="!bg-transparent !border-none !text-[#D9D9D9] hover:!text-white" />
          <Button label="Crear" @click="crearLiga"
            class="!bg-[#FF1E00] !border-none !px-10 font-bold hover:!bg-[#D01800]" />
        </div>
      </div>
    </Dialog>

    <!-- DIALOGO UNIRSE A LIGA -->
    <Dialog v-model:visible="mostrarDialogoUnirse" modal header="UNIRSE A LIGA" :pt="{
      root: { class: '!bg-[#15151E] !border-none' },
      header: { class: '!bg-[#15151E] !rounded ' },
      title: { class: 'font-bold tracking-widest text-[#3C6E71]' },
      content: { class: '!bg-[#15151E] pt-4' },
      closeButton: { class: 'hover:!bg-[#D9D9D9] !text-[#D9D9D9]' }
    }">
      <div class="flex flex-col gap-4">
        <span class="text-[#D9D9D9] text-sm">Introduce el código de invitación de 6 dígitos.</span>
        <InputText v-model="codigoUnion" placeholder="Ej: A1B2C3"
          class="w-full uppercase !bg-[#15151E] focus:!border-[#3C6E71]" autofocus />
        <div class="flex justify-end gap-2 mt-2">
          <Button label="Cancelar" @click="mostrarDialogoUnirse = false"
            class="!bg-transparent !border-none !text-[#D9D9D9] hover:!text-white" />
          <Button label="Unirse" @click="unirseALiga"
            class="!bg-[#3C6E71] !border-none !px-10 font-bold hover:!bg-[#2d5456]" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'

import { useLigasStore } from '@/stores/storeLigas'
import Header from '@/components/Header.vue'

import DataView from 'primevue/dataview'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'

const ligasStore = useLigasStore()
const router = useRouter()
const toast = useToast()

const nombreNuevaLiga = ref('')
const codigoUnion = ref('')
const cargando = ref(false)
const mostrarDialogoCrear = ref(false)
const mostrarDialogoUnirse = ref(false)

onMounted(async () => {
  cargando.value = true
  await ligasStore.cargarMisLigas()
  cargando.value = false
})

const crearLiga = async () => {
  if (nombreNuevaLiga.value.trim().length < 3) {
    toast.add({ severity: 'warn', summary: 'Nombre inválido', detail: 'El nombre debe tener al menos 3 caracteres', life: 3000 })
    return
  }

  const resultado = await ligasStore.crearLiga(nombreNuevaLiga.value)
  if (resultado.exito) {
    toast.add({ severity: 'success', summary: '¡Liga creada!', detail: resultado.mensaje, life: 3000 })
    nombreNuevaLiga.value = ''
    mostrarDialogoCrear.value = false

  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: resultado.mensaje, life: 3000 })
  }
}

const unirseALiga = async () => {
  if (!codigoUnion.value) return
  const resultado = await ligasStore.unirseALiga(codigoUnion.value)

  if (resultado.exito) {
    toast.add({ severity: 'success', summary: '¡Bienvenido!', detail: resultado.mensaje, life: 3000 })
    codigoUnion.value = ''
    mostrarDialogoUnirse.value = false

  } else {
    toast.add({ severity: 'error', summary: 'Error al unirse', detail: resultado.mensaje, life: 3000 })
  }
}

const entrarEnLiga = (ligaId) => {
  router.push({ name: 'inicio', query: { liga: ligaId } })
}
</script>
