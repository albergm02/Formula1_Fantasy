<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

/* Stores */
import { usarStoreLigas } from '@/stores/storeLigas'
import { usarStoreAutenticacion } from '@/stores/storeAutenticacion'

/* Componentes UI */
import Cabecera from '@/components/Cabecera.vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import DataView from 'primevue/dataview'

const ligasStore = usarStoreLigas()
const storeAutenticacion = usarStoreAutenticacion()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

/* Estados */
const nombreNuevaLiga = ref('')
const codigoUnion = ref('')
const cargando = ref(false)
const dialogoCrearVisible = ref(false)
const dialogoUnirseVisible = ref(false)
const dialogoOpcionesVisible = ref(false)
const ligaSeleccionada = ref(null)
const cargandoAccion = ref(false)

/* Abre el menÃº de opciones de una liga seleccionada */
const abrirOpcionesLiga = (league) => {
  ligaSeleccionada.value = league
  dialogoOpcionesVisible.value = true
}

/* Al montar, cargamos las ligas del usuario */
onMounted(async () => {
  cargando.value = true
  await ligasStore.cargarLigasUsuario()
  cargando.value = false
})

/* Handler Crear liga */
const manejarCrearLiga = async () => {
  const nombreLigaNormalizado = nombreNuevaLiga.value.trim()

  // Validaciones de longitud del nombre
  if (nombreLigaNormalizado.length < 3) {
    toast.add({ severity: 'warn', summary: 'Nombre invÃ¡lido', detail: 'El nombre debe tener al menos 3 caracteres' })
    return
  }

  if (nombreLigaNormalizado.length > 15) {
    toast.add({ severity: 'warn', summary: 'LÃ­mite alcanzado', detail: 'El nombre no puede exceder los 15 caracteres' })
    return
  }

  const result = await ligasStore.crearLiga(nombreLigaNormalizado)
  if (result.success) {
    toast.add({ severity: 'success', summary: 'Â¡Liga creada!', detail: result.message })
    nombreNuevaLiga.value = ''
    dialogoCrearVisible.value = false
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: result.message })
  }
}

/* Handler Unirse a liga con cÃ³digo de invitaciÃ³n */
const manejarUnirseLiga = async () => {
  const codigoUnionNormalizado = codigoUnion.value.trim().toUpperCase()

  if (!codigoUnionNormalizado) {
    return
  }

  const result = await ligasStore.unirseALiga(codigoUnionNormalizado)
  if (result.success) {
    toast.add({ severity: 'success', summary: 'Â¡Bienvenido!', detail: result.message })
    codigoUnion.value = ''
    dialogoUnirseVisible.value = false
  } else {
    toast.add({ severity: 'error', summary: 'Error al unirse', detail: result.message })
  }
}

/* Navega al dashboard de una liga concreta */
const abrirLiga = (leagueId) => {
  ligasStore.idLigaActiva = leagueId
  router.push({ name: 'inicio', query: { liga: leagueId } })
}

/* Handler Abandonar liga: pide confirmaciÃ³n antes de salir */
const manejarAbandonarLiga = () => {
  confirm.require({
    icon: 'pi pi-exclamation-triangle',
    message: `Â¿EstÃ¡s seguro de que quieres abandonar el campeonato "${ligaSeleccionada.value.nombre}"?`,
    header: 'CONFIRMACIÃ“N DE SALIDA',
    acceptLabel: 'Abandonar',
    rejectClass: '!bg-transparent !border-none !text-white',
    acceptClass: '!bg-[#D4A843] !border-none !text-[#1A1A1F]',
    accept: async () => {
      cargandoAccion.value = true
      const result = await ligasStore.abandonarLiga(ligaSeleccionada.value.id)
      cargandoAccion.value = false

      if (result.success) {
        toast.add({ severity: 'success', summary: 'Coche fuera de pista', detail: result.message })
        dialogoOpcionesVisible.value = false
      } else {
        toast.add({ severity: 'error', summary: 'Error al abandonar', detail: result.message })
      }
    },
  })
}

/* Handler Eliminar liga: acciÃ³n destructiva, borra la liga para todos */
const manejarEliminarLiga = () => {
  confirm.require({
    icon: 'pi pi-trash',
    message: 'Todos los participantes serÃ¡n expulsados y los datos serÃ¡n borrados permanentemente.',
    header: 'ELIMINAR LIGA',
    acceptLabel: 'Eliminar para todos',
    rejectClass: '!bg-transparent !border-none !text-white',
    acceptClass: '!bg-[#E10600] !border-none !text-white',
    accept: async () => {
      cargandoAccion.value = true
      const result = await ligasStore.eliminarLiga(ligaSeleccionada.value.id)
      cargandoAccion.value = false

      if (result.success) {
        toast.add({ severity: 'success', summary: 'Campeonato finalizado', detail: result.message })
        dialogoOpcionesVisible.value = false
      } else {
        toast.add({ severity: 'error', summary: 'Error al eliminar', detail: result.message })
      }
    },
  })
}
</script>

<!-------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!-------------------------------------------------------------------------------------------------------------------------->

<template>
  <div class="min-h-screen bg-[#1A1A1F] font-sans pb-10">
    <Cabecera />

    <div class="p-4 mt-4 max-w-4xl mx-auto">
      <div class="flex flex-col gap-6">

        <!-- Botones de crear y unirse a liga -->
        <section class="grid grid-cols-2 gap-4">
          <Button label="CREAR LIGA" icon="pi pi-plus"
            class="w-full py-3 !bg-[#D4A843] !text-[#1A1A1F] font-black tracking-widest !border-none"
            @click="dialogoCrearVisible = true" />
          <Button label="UNIRSE" icon="pi pi-sign-in"
            class="w-full py-3 !bg-transparent !border-2 !border-[#D4A843] !text-[#D4A843] font-black tracking-widest"
            @click="dialogoUnirseVisible = true" />
        </section>

        <!-- Listado de ligas del usuario -->
        <section>
          <div v-if="ligasStore.detallesLigas.length > 0" class="flex flex-col justify-center w-full">
            <div class="text-center text-[#F0ECEC] font-bold uppercase tracking-wider mb-4">
              Ligas disponibles: {{ ligasStore.detallesLigas.length }}/8
            </div>

            <DataView :value="ligasStore.detallesLigas" :pt="{ content: { class: '!bg-transparent' } }">
              <template #list="slotProps">
                <div class="flex flex-col gap-4 w-full">
                  <div v-for="(item, index) in slotProps.items" :key="index"
                    class="p-4 bg-[#1A1A1F] rounded-xl border border-[#D4A843]/30 flex items-center justify-between">
                    <div class="flex flex-col gap-1 w-2/3">
                      <h3 class="text-xl font-black text-[#E10600] uppercase truncate pr-2" :title="item.nombre">
                        {{ item.nombre }}
                      </h3>
                      <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#F0ECEC] font-medium opacity-80">
                        <span class="flex items-center gap-1">
                          <i class="pi pi-users text-[#D4A843]"></i> {{ item.participantes }}
                        </span>
                        <span class="flex items-center gap-1">
                          <i class="pi pi-key text-[#D4A843]"></i> {{ item.codigo_invitacion }}
                        </span>
                      </div>
                    </div>

                    <div class="flex gap-2 justify-end">
                      <Button icon="pi pi-cog" class="!bg-[#121218] !border !border-[#D4A843] !text-[#D4A843]"
                        @click="abrirOpcionesLiga(item)" />
                      <Button icon="pi pi-flag-fill" class="!bg-[#E10600] !border-none !text-[#FFFFFF] !w-10 !h-10"
                        @click="abrirLiga(item.id)" />
                    </div>
                  </div>
                </div>
              </template>
            </DataView>
          </div>

          <div v-else-if="!cargando" class="flex justify-center mt-10">
            <Message severity="secondary"
              class="!text-center !bg-transparent !border !border-[#F0ECEC]/20 !text-[#F0ECEC]">
              No perteneces a ninguna liga todavÃ­a. Crea o Ãºnete a una.
            </Message>
          </div>
        </section>
      </div>
    </div>

    <Dialog v-model:visible="dialogoCrearVisible" modal header="CREAR CAMPEONATO" :pt="{
      root: { class: '!bg-[#1A1A1F] !border-none mx-4 w-full max-w-sm' },
      header: { class: '!bg-[#1A1A1F] !rounded' },
      title: { class: 'font-bold tracking-widest text-[#E10600]' },
      content: { class: '!bg-[#1A1A1F] pt-4' },
      closeButton: { class: 'hover:!bg-[#F0ECEC] !text-[#F0ECEC]' },
    }">
      <div class="flex flex-col gap-4">
        <span class="text-[#F0ECEC]"> Puedes crear un mÃ¡ximo de 8 ligas</span>
        <InputText v-model="nombreNuevaLiga" placeholder="Introduzca aquÃ­ el nombre"
          class="w-full !bg-[#121218] !text-[#F0ECEC] focus:!border-[#E10600]" autofocus />
        <div class="flex justify-end gap-2 mt-2">
          <Button label="Cancelar" @click="dialogoCrearVisible = false"
            class="!bg-transparent !border-none !text-[#F0ECEC] hover:!text-white" />
          <Button label="Crear" @click="manejarCrearLiga"
            class="!bg-[#E10600] !border-none !px-10 font-bold hover:!bg-[#C00500]" />
        </div>
      </div>
    </Dialog>

    <Dialog v-model:visible="dialogoUnirseVisible" modal header="UNIRSE A LIGA" :pt="{
      root: { class: '!bg-[#1A1A1F] !border-none mx-4 w-full max-w-sm' },
      header: { class: '!bg-[#1A1A1F] !rounded ' },
      title: { class: 'font-bold tracking-widest text-[#D4A843]' },
      content: { class: '!bg-[#1A1A1F] pt-4' },
      closeButton: { class: 'hover:!bg-[#F0ECEC] !text-[#F0ECEC]' },
    }">
      <div class="flex flex-col gap-4">
        <span class="text-[#F0ECEC] text-sm">Introduce el cÃ³digo de invitaciÃ³n de 6 dÃ­gitos.</span>
        <InputText v-model="codigoUnion" placeholder="Ej: A1B2C3"
          class="w-full uppercase !bg-[#121218] focus:!border-[#D4A843]" autofocus />
        <div class="flex justify-end gap-2 mt-2">
          <Button label="Cancelar" @click="dialogoUnirseVisible = false"
            class="!bg-transparent !border-none !text-[#F0ECEC] hover:!text-white" />
          <Button label="Unirse" @click="manejarUnirseLiga"
            class="!bg-[#D4A843] !text-[#1A1A1F] !border-none !px-10 font-bold hover:!bg-[#C09638]" />
        </div>
      </div>
    </Dialog>

    <Dialog v-model:visible="dialogoOpcionesVisible" modal header="AJUSTES DE LIGA" :pt="{
      root: { class: '!bg-[#1A1A1F] !border-none mx-4 w-full max-w-sm' },
      header: { class: '!bg-[#1A1A1F] !rounded' },
      title: { class: 'font-bold tracking-widest text-[#F0ECEC]' },
      content: { class: '!bg-[#1A1A1F] pt-4 pb-6' },
      closeButton: { class: 'hover:!bg-[#F0ECEC] !text-[#F0ECEC]' },
    }">
      <div v-if="ligaSeleccionada" class="flex flex-col gap-4">
        <p class="text-center text-[#F0ECEC] text-sm mb-2">
          Â¿QuÃ© deseas hacer con la liga <strong class="text-white">{{ ligaSeleccionada.nombre }}</strong>?
        </p>

        <Button label="ABANDONAR LIGA" icon="pi pi-sign-out"
          class="w-full !bg-[#F0ECEC] !border-none !text-black font-bold" @click="manejarAbandonarLiga"
          :loading="cargandoAccion" />

        <Button v-if="ligaSeleccionada.admin === storeAutenticacion.usuarioActual.correoAutenticacion" label="ELIMINAR LIGA" icon="pi pi-trash"
          class="w-full !bg-[#E10600] !border-none !text-white font-bold" @click="manejarEliminarLiga"
          :loading="cargandoAccion" />
      </div>
    </Dialog>
  </div>
</template>


