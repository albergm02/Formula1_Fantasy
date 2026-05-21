<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

import { usarStoreLigas } from '@/stores/storeLigas'
import { usarStoreAutenticacion } from '@/stores/storeAutenticacion'

import Cabecera from '@/components/Cabecera.vue'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import DataView from 'primevue/dataview'

const storeLigas = usarStoreLigas()
const storeAutenticacion = usarStoreAutenticacion()
const router = useRouter()
const notificacion = useToast()
const confirmar = useConfirm()

const nombreNuevaLiga = ref('')
const codigoUnion = ref('')
const ligaSeleccionada = ref(null)

const cargando = ref(false)
const cargandoAccion = ref(false)

const dialogoCrearVisible = ref(false)
const dialogoUnirseVisible = ref(false)
const dialogoOpcionesVisible = ref(false)


onMounted(async () => {
  cargando.value = true
  await storeLigas.cargarLigasUsuario()
  cargando.value = false
})

/* Abrir diálogo de opciones para la liga seleccionada */
const abrirOpcionesLiga = (liga) => {
  ligaSeleccionada.value = liga
  dialogoOpcionesVisible.value = true
}

/* Manejar la creación de una nueva liga */
const handleCrearLiga = async () => {
  // Corto el nombre para eliminar espacios al inicio y al final por si acaso
  const nombreLigaNormalizado = nombreNuevaLiga.value.trim()

  // Validaciones básicas de longitud del nombre
  if (nombreLigaNormalizado.length < 3) {
    notificacion.add({ severity: 'warn', summary: 'Nombre inválido', detail: 'El nombre debe tener al menos 3 carácteres.' })
    return
  }
  if (nombreLigaNormalizado.length > 12) {
    notificacion.add({ severity: 'warn', summary: 'Nombre inválido', detail: 'El nombre no puede exceder los 12 carácteres.' })
    return
  }

  // Llamo al store para crear la liga y manejo la respuesta
  const resultado = await storeLigas.crearLiga(nombreLigaNormalizado)
  if (resultado.success) {
    notificacion.add({ severity: 'success', summary: '¡Liga creada!', detail: resultado.message })
    nombreNuevaLiga.value = ''
    dialogoCrearVisible.value = false
  } else {
    notificacion.add({ severity: 'error', summary: 'Error', detail: resultado.message })
  }
}

/* Manejar la acción de unirse a una liga mediante código de invitación */
const handleUnirseLiga = async () => {
  const codigoUnionNormalizado = codigoUnion.value.trim().toUpperCase()

  if (!codigoUnionNormalizado) {
    return
  }

  const resultado = await storeLigas.unirseALiga(codigoUnionNormalizado)
  if (resultado.success) {
    notificacion.add({ severity: 'success', summary: '¡Bienvenido!', detail: resultado.message })
    codigoUnion.value = ''
    dialogoUnirseVisible.value = false
  } else {
    notificacion.add({ severity: 'error', summary: 'Error al unirse', detail: resultado.message })
  }
}

/* Abrir la liga seleccionada y redirigir a la pantalla principal con la liga activa */
const abrirLiga = (idLiga) => {
  storeLigas.idLigaActiva = idLiga
  router.push({ name: 'inicio', query: { liga: idLiga } })
}

/* Copiar el código de invitación de la liga al portapapeles y mostrar una notificación */
async function copiarCodigoLiga(codigo) {
  await navigator.clipboard.writeText(codigo)
  notificacion.add({
    severity: 'success',
    summary: 'Código copiado',
    detail: `"${codigo}" copiado al portapapeles.`,
    life: 3000,
  })
}

/* Manejar la acción de abandonar la liga seleccionada con confirmación previa */
const handleAbandonarLiga = () => {
  confirmar.require({
    message: `¿Estás seguro de que quieres abandonar la liga "${ligaSeleccionada.value.nombre}"?`,
    header: 'CONFIRMACIÓN DE ABANDONO',
    acceptLabel: 'Abandonar',
    rejectClass: '!bg-transparent !border-none !text-white',
    acceptClass: '!bg-[#D4A843] !border-none !text-[#1A1A1F]',
    accept: async () => {
      cargandoAccion.value = true
      const resultado = await storeLigas.abandonarLiga(ligaSeleccionada.value.id)
      cargandoAccion.value = false

      if (resultado.success) {
        notificacion.add({ severity: 'success', summary: 'Abandonaste la liga.', detail: resultado.message })
        dialogoOpcionesVisible.value = false
      } else {
        notificacion.add({ severity: 'error', summary: 'Error al abandonar.', detail: resultado.message })
      }
    },
  })
}

/* Manejar la acción de eliminar la liga seleccionada con confirmación previa. 
Solo el admin puede eliminar la liga. */
const handleEliminarLiga = () => {
  confirmar.require({
    message: `¿Estás seguro de que quieres eliminar la liga "${ligaSeleccionada.value.nombre}"? Todos los participantes serán expulsados y los datos serán borrados permanentemente.`,
    header: 'ELIMINAR LIGA',
    acceptLabel: 'Eliminar para todos',
    rejectClass: '!bg-transparent !border-none !text-white',
    acceptClass: '!bg-[#E10600] !border-none !text-white',
    accept: async () => {
      cargandoAccion.value = true
      const resultado = await storeLigas.eliminarLiga(ligaSeleccionada.value.id)
      cargandoAccion.value = false

      if (resultado.success) {
        notificacion.add({ severity: 'success', summary: 'Liga eliminada.', detail: resultado.message })
        dialogoOpcionesVisible.value = false
      } else {
        notificacion.add({ severity: 'error', summary: 'Error al eliminar.', detail: resultado.message })
      }
    },
  })
}
</script>


<template>
  <div class="min-h-screen pb-10 font-sans">
    <Cabecera />

    <div class="p-4 mt-4 max-w-4xl mx-auto">
      <div class="flex flex-col gap-6">

        <!-- Botones de crear y unirse a liga -->
        <section class="grid grid-cols-2 gap-4">
          <Button label="CREAR LIGA" icon="pi pi-plus"
            class="w-full py-3 !bg-[#D4A843] !border-none font-black tracking-widest !text-[#1A1A1F]"
            @click="dialogoCrearVisible = true" />
          <Button label="UNIRSE" icon="pi pi-sign-in"
            class="w-full py-3 !bg-transparent !border-2 !border-[#D4A843] font-black tracking-widest !text-[#D4A843]"
            @click="dialogoUnirseVisible = true" />
        </section>

        <!-- Listado de ligas del usuario -->
        <section>
          <div v-if="storeLigas.detallesLigas.length > 0" class="flex flex-col justify-center w-full">
            <div class="mb-4 text-center font-bold uppercase tracking-wider text-[#F0ECEC]">
              Ligas disponibles: {{ storeLigas.detallesLigas.length }}/5
            </div>

            <!-- DataView de ligas -->
            <DataView :value="storeLigas.detallesLigas" :pt="{ content: { class: '!bg-transparent' } }">
              <template #list="slotProps">
                <div class="flex flex-col w-full gap-4">
                  <div v-for="(item, index) in slotProps.items" :key="index" @click="abrirLiga(item.id)"
                    class="flex items-center justify-between p-4 bg-[#1A1A1F] rounded-lg">
                    <div class="flex flex-col gap-1 w-2/3">
                      <h3 class="pr-2 text-xl font-black uppercase truncate text-[#E10600]" :title="item.nombre">
                        {{ item.nombre }}
                      </h3>
                      <div class="flex flex-wrap gap-2 text-xs font-medium">
                        <span class="flex items-center gap-1">
                          <i class="pi pi-users text-[#D4A843]"></i> {{ item.participantes }}
                        </span>
                        <span class="flex items-center gap-1">
                          <i class="pi pi-key text-[#D4A843]"></i> {{ item.codigo_invitacion }}
                        </span>
                      </div>
                    </div>

                    <div class="flex gap-2 justify-end">
                      <Button icon="pi pi-copy" class=" !bg-[#121218] !border !border-[#D4A843] !text-[#D4A843]"
                        @click.stop="copiarCodigoLiga(item.codigo_invitacion)" />
                      <Button icon="pi pi-cog" class="!bg-[#121218] !border !border-[#D4A843] !text-[#D4A843]"
                        @click.stop="abrirOpcionesLiga(item)" />
                      <Button icon="pi pi-play" class="!bg-[#121218] !border !border-[#D4A843] !text-[#D4A843]"
                        @click.stop="abrirLiga(item.id)" />
                    </div>
                  </div>
                </div>
              </template>
            </DataView>
          </div>

          <div v-else-if="!cargando" class="flex justify-center mt-10">
            <Message severity="secondary"
              class="!bg-transparent !border !border-[#F0ECEC]/20 !text-center !text-[#F0ECEC]">
              No perteneces a ninguna liga todavía. Crea o únete a una.
            </Message>
          </div>
        </section>
      </div>
    </div>

    <Dialog v-model:visible="dialogoCrearVisible" modal header="CREAR CAMPEONATO">
      <div class="flex flex-col gap-4">
        <span class="text-[#F0ECEC]">Introduzca el nombre de la nueva liga.</span>
        <InputText v-model="nombreNuevaLiga" placeholder="Introduzca aquí el nombre..."
          class="w-full !bg-[#121218] !text-[#F0ECEC] focus:!border-[#D4A843]" autofocus />
        <div class="flex justify-end gap-2 mt-2">
          <Button label="Cancelar" @click="dialogoCrearVisible = false"
            class="!bg-transparent !border-none !text-[#F0ECEC]" />
          <Button label="Crear" @click="handleCrearLiga" class="!px-10 !bg-[#D4A843] !border-none font-bold" />
        </div>
      </div>
    </Dialog>

    <Dialog v-model:visible="dialogoUnirseVisible" modal header="UNIRSE A LIGA">
      <div class="flex flex-col gap-4">
        <span class="text-sm text-[#F0ECEC]">Introduce el código de invitación de 6 dígitos.</span>
        <InputText v-model="codigoUnion" placeholder="Ej: A1B2C3"
          class="w-full !bg-[#121218] uppercase focus:!border-[#D4A843]" autofocus />
        <div class="flex justify-end gap-2 mt-2">
          <Button label="Cancelar" @click="dialogoUnirseVisible = false"
            class="!bg-transparent !border-none !text-[#F0ECEC]" />
          <Button label="Unirse" @click="handleUnirseLiga"
            class="!px-10 !bg-[#D4A843] !border-none font-bold !text-[#1A1A1F]" />
        </div>
      </div>
    </Dialog>

    <Dialog v-model:visible="dialogoOpcionesVisible" modal header="AJUSTES DE LIGA">
      <div v-if="ligaSeleccionada" class="flex flex-col gap-4">
        <p class="mb-2 text-center text-sm text-[#F0ECEC]">
          ¿Qué deseas hacer con la liga <strong class="text-white">{{ ligaSeleccionada.nombre }}</strong>?
        </p>

        <Button label="ABANDONAR LIGA" class="w-full !bg-[#F0ECEC] !border-none font-bold !text-black"
          @click="handleAbandonarLiga" :loading="cargandoAccion" />
        <!-- Aqui compruebo que la liga seleccionada pertenece al administrador o no -->
        <Button v-if="ligaSeleccionada.admin === storeAutenticacion.usuarioActual.correoAutenticacion"
          label="ELIMINAR LIGA" class="w-full !bg-[#E10600] !border-none font-bold !text-white"
          @click="handleEliminarLiga" :loading="cargandoAccion" />
      </div>
    </Dialog>
  </div>
</template>
