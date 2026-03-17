<template>
  <div class="h-screen bg-[#15151E] font-sans pb-10 overflow-hidden">
    <Header />

    <div class="p-4 mt-4 max-w-4xl mx-auto overflow-hidden">
      <div class="flex flex-col gap-6">
        <section class="grid grid-cols-2 gap-4">
          <Button label="CREAR LIGA" icon="pi pi-plus" class="w-full py-3 !bg-[#3C6E71] !border-none"
            @click="mostrarDialogoCrear = true" />
          <Button label="UNIRSE" icon="pi pi-sign-in"
            class="w-full py-3 !bg-transparent !border-2 !border-[#3C6E71] !text-[#3C6E71]"
            @click="mostrarDialogoUnirse = true" />
        </section>

        <!-- SECCIÓN DE LIGAS -->
        <section>
          <div v-if="ligasStore.ligasDetalles.length > 0" class="flex flex-col justify-center w-full">
            <div class="text-center text-[#D9D9D9] font-bold uppercase tracking-wider">
              Ligas disponibles: {{ ligasStore.ligasDetalles.length }}/8
            </div>
            <!-- Componente Carrusel sacado de Primevue -->
            <Carousel :value="ligasStore.ligasDetalles" :numVisible="1" :numScroll="1" orientation="vertical"
              verticalViewPortHeight="200px" containerClass="flex items-center w-full ">
              <!-- Slots mostrando detalles de las participaciones del usuario en cada liga -->
              <template #item="slotProps">
                <div class="p-6 bg-[#15151E] rounded-2xl border-4 border-[#3C6E71] flex flex-col items-center gap-4">
                  <div class="text-center w-full">
                    <h3 class="text-2xl font-black text-[#FF1E00] uppercase mb-2 w-full truncate px-10"
                      :title="slotProps.data.nombre">
                      {{ slotProps.data.nombre }}
                    </h3>

                    <div class="flex justify-center gap-4 text-xs text-[#D9D9D9] mx-auto">
                      <span class="flex items-center gap-1">
                        <i class="pi pi-users text-[#3C6E71]"></i>
                        Participantes:
                        {{ slotProps.data.participantes }}
                      </span>
                      <span class="flex items-center gap-1">
                        <i class="pi pi-key text-[#3C6E71]"></i>
                        Código:
                        {{ slotProps.data.codigo_invitacion }}
                      </span>
                    </div>
                  </div>

                  <Button label="ENTRAR" class="w-full mt-2 !bg-[#FF1E00] !border-none !text-[#FFFFFF]"
                    @click="entrarEnLiga(slotProps.data.id)" />
                </div>
              </template>
            </Carousel>
          </div>

          <div v-else class="flex justify-center mt-10">
            <Message severity="secondary"
              class="!text-center !bg-transparent !border-3 !border-[#D9D9D9] !text-[#D9D9D9]">
              No perteneces a ninguna liga todavía. Crea o únete a una.
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
      closeButton: { class: 'hover:!bg-[#D9D9D9] !text-[#D9D9D9]' },
    }">
      <div class="flex flex-col gap-4">
        <span class="text-[#D9D9D9]"> Puedes crear un máximo de 2 ligas</span>
        <InputText v-model="nombreNuevaLiga" placeholder="Introduzca aquí el nombre"
          class="w-full !bg-[#111111] !text-[#D9D9D9] focus:!border-[#FF1E00]" autofocus />
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
      closeButton: { class: 'hover:!bg-[#D9D9D9] !text-[#D9D9D9]' },
    }">
      <div class="flex flex-col gap-4">
        <span class="text-[#D9D9D9] text-sm">Introduce el código de invitación de 6 dígitos.</span>
        <InputText v-model="codigoUnion" placeholder="Ej: A1B2C3"
          class="w-full uppercase !bg-[#111111] focus:!border-[#3C6E71]" autofocus />
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

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import Carousel from 'primevue/carousel'

const ligasStore = useLigasStore()
const router = useRouter()
const toast = useToast()

const nombreNuevaLiga = ref('')
const codigoUnion = ref('')
const cargando = ref(false)
const mostrarDialogoCrear = ref(false)
const mostrarDialogoUnirse = ref(false)

/* Carga los detalles de las ligas al montar el componente */
onMounted(async () => {
  cargando.value = true
  await ligasStore.cargarMisLigas()
  cargando.value = false
})

/* Función para crear una nueva liga con validaciones y manejo de respuestas */
const crearLiga = async () => {
  // Evita nombres demasiado cortos
  if (nombreNuevaLiga.value.trim().length < 3) {
    toast.add({
      severity: 'warn',
      summary: 'Nombre inválido',
      detail: 'El nombre debe tener al menos 3 caracteres',
      life: 3000,
    })
    return
  }

  // Llama al store para crear la liga y maneja la respuesta
  const resultado = await ligasStore.crearLiga(nombreNuevaLiga.value)
  if (resultado.exito) {
    toast.add({
      severity: 'success',
      summary: '¡Liga creada!',
      detail: resultado.mensaje,
      life: 3000,
    })
    nombreNuevaLiga.value = ''
    mostrarDialogoCrear.value = false
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: resultado.mensaje, life: 3000 })
  }
}

/* Función para unirse a una liga existente usando un código de invitación con validaciones y manejo de respuestas */
const unirseALiga = async () => {
  // Evita códigos vacíos o con formato incorrecto
  if (!codigoUnion.value) return
  // Llama al store para unirse a la liga y maneja la respuesta
  const resultado = await ligasStore.unirseALiga(codigoUnion.value)
  if (resultado.exito) {
    toast.add({
      severity: 'success',
      summary: '¡Bienvenido!',
      detail: resultado.mensaje,
      life: 3000,
    })
    codigoUnion.value = ''
    mostrarDialogoUnirse.value = false
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error al unirse',
      detail: resultado.mensaje,
      life: 3000,
    })
  }
}

/* Función para redirigir al usuario a la página de inicio con la liga seleccionada */
const entrarEnLiga = (ligaId) => {
  router.push({ name: 'inicio', query: { liga: ligaId } })
}
</script>
