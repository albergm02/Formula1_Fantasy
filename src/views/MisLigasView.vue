<template>
  <div class="min-h-screen bg-[#15151E] font-sans pb-10">
    <Header />

    <div class="p-4 mt-4 max-w-4xl mx-auto">
      <div class="flex flex-col gap-6">

        <section class="grid grid-cols-2 gap-4">
          <Button label="CREAR LIGA" icon="pi pi-plus"
            class="w-full py-3 !bg-[#00E5E5] !text-[#15151E] font-black tracking-widest !border-none hover:!bg-[#00c4c4] transition-colors"
            @click="mostrarDialogoCrear = true" />
          <Button label="UNIRSE" icon="pi pi-sign-in"
            class="w-full py-3 !bg-transparent !border-2 !border-[#00E5E5] !text-[#00E5E5] font-black tracking-widest hover:!bg-[#00E5E5]/10 transition-colors"
            @click="mostrarDialogoUnirse = true" />
        </section>

        <section>
          <div v-if="ligasStore.ligasDetalles.length > 0" class="flex flex-col justify-center w-full">
            <div class="text-center text-[#D9D9D9] font-bold uppercase tracking-wider mb-4">
              Ligas disponibles: {{ ligasStore.ligasDetalles.length }}/8
            </div>

            <DataView :value="ligasStore.ligasDetalles" :pt="{ content: { class: '!bg-transparent' } }">
              <template #list="slotProps">
                <div class="flex flex-col gap-4 w-full">
                  <div v-for="(item, index) in slotProps.items" :key="index"
                    class="p-4 bg-[#15151E] rounded-xl border border-[#00E5E5]/30 flex items-center justify-between hover:border-[#00E5E5] transition-colors shadow-lg">

                    <div class="flex flex-col gap-1 w-2/3">
                      <h3 class="text-xl font-black text-[#FF1E00] uppercase truncate pr-2" :title="item.nombre">
                        {{ item.nombre }}
                      </h3>
                      <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#D9D9D9] font-medium opacity-80">
                        <span class="flex items-center gap-1">
                          <i class="pi pi-users text-[#00E5E5]"></i> {{ item.participantes }}
                        </span>
                        <span class="flex items-center gap-1">
                          <i class="pi pi-key text-[#00E5E5]"></i> {{ item.codigo_invitacion }}
                        </span>
                      </div>
                    </div>

                    <div class="flex gap-2 w-1/3 justify-end shrink-0">
                      <Button icon="pi pi-cog"
                        class="!bg-[#111111] !border !border-[#00E5E5]/50 !text-[#00E5E5] hover:!bg-[#00E5E5]/10 !w-10 !h-10 shrink-0"
                        @click="abrirOpciones(item)" />
                      <Button icon="pi pi-flag-fill"
                        class="!bg-[#FF1E00] !border-none !text-[#FFFFFF] !w-10 !h-10 hover:!bg-[#D01800] shadow-[0_0_15px_rgba(255,30,0,0.2)] shrink-0"
                        @click="entrarEnLiga(item.id)" />
                    </div>

                  </div>
                </div>
              </template>
            </DataView>

          </div>

          <div v-else class="flex justify-center mt-10">
            <Message severity="secondary"
              class="!text-center !bg-transparent !border !border-[#D9D9D9]/20 !text-[#D9D9D9]">
              No perteneces a ninguna liga todavía. Crea o únete a una.
            </Message>
          </div>
        </section>
      </div>
    </div>

    <Dialog v-model:visible="mostrarDialogoCrear" modal header="CREAR CAMPEONATO" :pt="{
      root: { class: '!bg-[#15151E] !border-none mx-4 w-full max-w-sm' },
      header: { class: '!bg-[#15151E] !rounded' },
      title: { class: 'font-bold tracking-widest text-[#FF1E00]' },
      content: { class: '!bg-[#15151E] pt-4' },
      closeButton: { class: 'hover:!bg-[#D9D9D9] !text-[#D9D9D9]' },
    }">
      <div class="flex flex-col gap-4">
        <span class="text-[#D9D9D9]"> Puedes crear un máximo de 8 ligas</span>
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

    <Dialog v-model:visible="mostrarDialogoUnirse" modal header="UNIRSE A LIGA" :pt="{
      root: { class: '!bg-[#15151E] !border-none mx-4 w-full max-w-sm' },
      header: { class: '!bg-[#15151E] !rounded ' },
      title: { class: 'font-bold tracking-widest text-[#00E5E5]' },
      content: { class: '!bg-[#15151E] pt-4' },
      closeButton: { class: 'hover:!bg-[#D9D9D9] !text-[#D9D9D9]' },
    }">
      <div class="flex flex-col gap-4">
        <span class="text-[#D9D9D9] text-sm">Introduce el código de invitación de 6 dígitos.</span>
        <InputText v-model="codigoUnion" placeholder="Ej: A1B2C3"
          class="w-full uppercase !bg-[#111111] focus:!border-[#00E5E5]" autofocus />
        <div class="flex justify-end gap-2 mt-2">
          <Button label="Cancelar" @click="mostrarDialogoUnirse = false"
            class="!bg-transparent !border-none !text-[#D9D9D9] hover:!text-white" />
          <Button label="Unirse" @click="unirseALiga"
            class="!bg-[#00E5E5] !text-[#15151E] !border-none !px-10 font-bold hover:!bg-[#00c4c4]" />
        </div>
      </div>
    </Dialog>

    <Dialog v-model:visible="mostrarDialogoOpciones" modal header="AJUSTES DE LIGA" :pt="{
      root: { class: '!bg-[#15151E] !border-none mx-4 w-full max-w-sm' },
      header: { class: '!bg-[#15151E] !rounded' },
      title: { class: 'font-bold tracking-widest text-[#D9D9D9]' },
      content: { class: '!bg-[#15151E] pt-4 pb-6' },
      closeButton: { class: 'hover:!bg-[#D9D9D9] !text-[#D9D9D9]' },
    }">
      <div v-if="ligaSeleccionada" class="flex flex-col gap-4">

        <p class="text-center text-[#D9D9D9] text-sm mb-2">
          ¿Qué deseas hacer con la liga <strong class="text-white">{{ ligaSeleccionada.nombre }}</strong>?
        </p>

        <Button label="ABANDONAR LIGA" icon="pi pi-sign-out"
          class="w-full !bg-[#D9D9D9] !border-none !text-black font-bold"
          @click="ejecutarAbandonar" :loading="cargandoAccion" />

        <Button v-if="ligaSeleccionada.admin === authStore.usuarioGlobal.emailAuth" label="ELIMINAR LIGA"
          icon="pi pi-trash" class="w-full !bg-[#FF1E00] !border-none !text-white font-bold"
          @click="ejecutarEliminar" :loading="cargandoAccion" />

      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from "primevue/useconfirm";

import { useLigasStore } from '@/stores/storeLigas'
import { useAuthStore } from '@/stores/storeAuth'
import Header from '@/components/Header.vue'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import DataView from 'primevue/dataview'

const ligasStore = useLigasStore()
const authStore = useAuthStore()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm();

const nombreNuevaLiga = ref('')
const codigoUnion = ref('')
const cargando = ref(false)
const mostrarDialogoCrear = ref(false)
const mostrarDialogoUnirse = ref(false)

const mostrarDialogoOpciones = ref(false)
const ligaSeleccionada = ref(null)
const cargandoAccion = ref(false)

const abrirOpciones = (liga) => {
  ligaSeleccionada.value = liga
  mostrarDialogoOpciones.value = true
}

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
  } else if (nombreNuevaLiga.value.trim().length > 15) {
    toast.add({
      severity: 'warn',
      summary: 'Límite alcanzado',
      detail: 'El nombre no puede exceder los 15 caracteres',
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

const ejecutarAbandonar = () => {
  confirm.require({
    message: `¿Estás seguro de que quieres abandonar el campeonato "${ligaSeleccionada.value.nombre}"?`,
    header: 'CONFIRMACIÓN DE SALIDA',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Abandonar',
    rejectClass: '!bg-transparent !border-none !text-white',
    acceptClass: '!bg-[#00E5E5] !border-none !text-[#15151E]',
    backgroundColor: '[#15151E]',
    accept: async () => {

      cargandoAccion.value = true;
      const resultado = await ligasStore.abandonarLiga(ligaSeleccionada.value.id);
      cargandoAccion.value = false;

      if (resultado.exito) {
        toast.add({ severity: 'success', summary: 'Coche fuera de pista', detail: resultado.mensaje, life: 3000 });
        mostrarDialogoOpciones.value = false;
      }
    }
  });
};

const ejecutarEliminar = () => {
  confirm.require({
    message: 'Todos los participantes serán expulsados y los datos serán borrados permanentemente.',
    header: 'ELIMINAR LIGA',
    icon: 'pi pi-trash',
    acceptLabel: 'Eliminar para todos',
    rejectClass: '!bg-transparent !border-none !text-white',
    acceptClass: '!bg-[#FF1E00] !border-none !text-white',
    accept: async () => {
      cargandoAccion.value = true;
      const resultado = await ligasStore.eliminarLiga(ligaSeleccionada.value.id);
      cargandoAccion.value = false;

      if (resultado.exito) {
        toast.add({ severity: 'success', summary: 'Campeonato finalizado', detail: resultado.mensaje, life: 3000 });
        mostrarDialogoOpciones.value = false;
      }
    }
  });
};
</script>