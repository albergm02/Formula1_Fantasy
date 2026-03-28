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
const enrutador = useRouter()
const notificacion = useToast()
const confirmar = useConfirm()

const nombreNuevaLiga = ref('')
const codigoUnion = ref('')
const cargando = ref(false)
const dialogoCrearVisible = ref(false)
const dialogoUnirseVisible = ref(false)
const dialogoOpcionesVisible = ref(false)
const ligaSeleccionada = ref(null)
const cargandoAccion = ref(false)

const abrirOpcionesLiga = (liga) => {
  ligaSeleccionada.value = liga
  dialogoOpcionesVisible.value = true
}

onMounted(async () => {
  cargando.value = true
  await storeLigas.cargarLigasUsuario()
  cargando.value = false
})

const manejarCrearLiga = async () => {
  const nombreLigaNormalizado = nombreNuevaLiga.value.trim()

  if (nombreLigaNormalizado.length < 3) {
    notificacion.add({ severity: 'warn', summary: 'Nombre inválido', detail: 'El nombre debe tener al menos 3 caracteres' })
    return
  }

  if (nombreLigaNormalizado.length > 15) {
    notificacion.add({ severity: 'warn', summary: 'Límite alcanzado', detail: 'El nombre no puede exceder los 15 caracteres' })
    return
  }

  const resultado = await storeLigas.crearLiga(nombreLigaNormalizado)
  if (resultado.success) {
    notificacion.add({ severity: 'success', summary: '¡Liga creada!', detail: resultado.message })
    nombreNuevaLiga.value = ''
    dialogoCrearVisible.value = false
  } else {
    notificacion.add({ severity: 'error', summary: 'Error', detail: resultado.message })
  }
}

const manejarUnirseLiga = async () => {
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

const abrirLiga = (idLiga) => {
  storeLigas.idLigaActiva = idLiga
  enrutador.push({ name: 'inicio', query: { liga: idLiga } })
}

const manejarAbandonarLiga = () => {
  confirmar.require({
    icon: 'pi pi-exclamation-triangle',
    message: `¿Estás seguro de que quieres abandonar el campeonato "${ligaSeleccionada.value.nombre}"?`,
    header: 'CONFIRMACIÓN DE SALIDA',
    acceptLabel: 'Abandonar',
    rejectClass: '!bg-transparent !border-none !text-white',
    acceptClass: '!bg-[#D4A843] !border-none !text-[#1A1A1F]',
    accept: async () => {
      cargandoAccion.value = true
      const resultado = await storeLigas.abandonarLiga(ligaSeleccionada.value.id)
      cargandoAccion.value = false

      if (resultado.success) {
        notificacion.add({ severity: 'success', summary: 'Coche fuera de pista', detail: resultado.message })
        dialogoOpcionesVisible.value = false
      } else {
        notificacion.add({ severity: 'error', summary: 'Error al abandonar', detail: resultado.message })
      }
    },
  })
}

const manejarEliminarLiga = () => {
  confirmar.require({
    icon: 'pi pi-trash',
    message: 'Todos los participantes serán expulsados y los datos serán borrados permanentemente.',
    header: 'ELIMINAR LIGA',
    acceptLabel: 'Eliminar para todos',
    rejectClass: '!bg-transparent !border-none !text-white',
    acceptClass: '!bg-[#E10600] !border-none !text-white',
    accept: async () => {
      cargandoAccion.value = true
      const resultado = await storeLigas.eliminarLiga(ligaSeleccionada.value.id)
      cargandoAccion.value = false

      if (resultado.success) {
        notificacion.add({ severity: 'success', summary: 'Campeonato finalizado', detail: resultado.message })
        dialogoOpcionesVisible.value = false
      } else {
        notificacion.add({ severity: 'error', summary: 'Error al eliminar', detail: resultado.message })
      }
    },
  })
}
</script>

<!-------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!-------------------------------------------------------------------------------------------------------------------------->

<template>
  <div class="min-h-screen pb-10 bg-[#1A1A1F] font-sans">
    <Cabecera />

    <div class="p-4 mt-4 max-w-4xl mx-auto">
      <div class="flex flex-col gap-6">

        <!-- Botones de crear y unirse a liga -->
        <section class="grid grid-cols-2 gap-4">
          <Button label="CREAR LIGA" icon="pi pi-plus"
            class="w-full py-3 !bg-[#D4A843] !text-[#1A1A1F] font-black tracking-widest !border-none"
            @click="dialogoCrearVisible = true" />
          <Button label="UNIRSE" icon="pi pi-sign-in"
            class="w-full py-3 !bg-transparent !text-[#D4A843] font-black tracking-widest !border-2 !border-[#D4A843]"
            @click="dialogoUnirseVisible = true" />
        </section>

        <!-- Listado de ligas del usuario -->
        <section>
          <div v-if="storeLigas.detallesLigas.length > 0" class="flex flex-col justify-center w-full">
            <div class="mb-4 text-center text-[#F0ECEC] font-bold uppercase tracking-wider">
              Ligas disponibles: {{ storeLigas.detallesLigas.length }}/8
            </div>

            <DataView :value="storeLigas.detallesLigas" :pt="{ content: { class: '!bg-transparent' } }">
              <template #list="slotProps">
                <div class="flex flex-col gap-4 w-full">
                  <div v-for="(item, index) in slotProps.items" :key="index"
                    class="p-4 flex items-center justify-between bg-[#1A1A1F] rounded-xl border border-[#D4A843]/30">
                    <div class="flex flex-col gap-1 w-2/3">
                      <h3 class="pr-2 text-xl font-black text-[#E10600] uppercase truncate" :title="item.nombre">
                        {{ item.nombre }}
                      </h3>
                      <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#F0ECEC] font-medium opacity-80">
                        <span class="flex items-center gap-1">
                          <i class="text-[#D4A843] pi pi-users"></i> {{ item.participantes }}
                        </span>
                        <span class="flex items-center gap-1">
                          <i class="text-[#D4A843] pi pi-key"></i> {{ item.codigo_invitacion }}
                        </span>
                      </div>
                    </div>

                    <div class="flex gap-2 justify-end">
                      <Button icon="pi pi-cog" class="!bg-[#121218] !text-[#D4A843] !border !border-[#D4A843]"
                        @click="abrirOpcionesLiga(item)" />
                      <Button icon="pi pi-flag-fill" class="!w-10 !h-10 !bg-[#E10600] !text-[#FFFFFF] !border-none"
                        @click="abrirLiga(item.id)" />
                    </div>
                  </div>
                </div>
              </template>
            </DataView>
          </div>

          <div v-else-if="!cargando" class="flex justify-center mt-10">
            <Message severity="secondary"
              class="!bg-transparent !text-center !text-[#F0ECEC] !border !border-[#F0ECEC]/20">
              No perteneces a ninguna liga todavía. Crea o únete a una.
            </Message>
          </div>
        </section>
      </div>
    </div>

    <Dialog v-model:visible="dialogoCrearVisible" modal header="CREAR CAMPEONATO"
      :headerStyle="{ backgroundColor: '#1A1A1F', color: '#E10600', borderBottom: '1px solid #2A2A32', fontWeight: 'bold', letterSpacing: '0.1em' }"
      :contentStyle="{ backgroundColor: '#1A1A1F', padding: '1.5rem' }"
      :style="{ width: '90vw', maxWidth: '400px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }">
      <div class="flex flex-col gap-4">
        <span class="text-[#F0ECEC]"> Puedes crear un máximo de 8 ligas</span>
        <InputText v-model="nombreNuevaLiga" placeholder="Introduzca aquí el nombre"
          class="w-full !bg-[#121218] !text-[#F0ECEC] focus:!border-[#E10600]" autofocus />
        <div class="flex justify-end gap-2 mt-2">
          <Button label="Cancelar" @click="dialogoCrearVisible = false"
            class="!bg-transparent !text-[#F0ECEC] !border-none hover:!text-white" />
          <Button label="Crear" @click="manejarCrearLiga"
            class="!px-10 !bg-[#E10600] font-bold !border-none hover:!bg-[#C00500]" />
        </div>
      </div>
    </Dialog>

    <Dialog v-model:visible="dialogoUnirseVisible" modal header="UNIRSE A LIGA"
      :headerStyle="{ backgroundColor: '#1A1A1F', color: '#D4A843', borderBottom: '1px solid #2A2A32', fontWeight: 'bold', letterSpacing: '0.1em' }"
      :contentStyle="{ backgroundColor: '#1A1A1F', padding: '1.5rem' }"
      :style="{ width: '90vw', maxWidth: '400px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }">
      <div class="flex flex-col gap-4">
        <span class="text-[#F0ECEC] text-sm">Introduce el código de invitación de 6 dígitos.</span>
        <InputText v-model="codigoUnion" placeholder="Ej: A1B2C3"
          class="w-full !bg-[#121218] uppercase focus:!border-[#D4A843]" autofocus />
        <div class="flex justify-end gap-2 mt-2">
          <Button label="Cancelar" @click="dialogoUnirseVisible = false"
            class="!bg-transparent !text-[#F0ECEC] !border-none hover:!text-white" />
          <Button label="Unirse" @click="manejarUnirseLiga"
            class="!px-10 !bg-[#D4A843] !text-[#1A1A1F] font-bold !border-none hover:!bg-[#C09638]" />
        </div>
      </div>
    </Dialog>

    <Dialog v-model:visible="dialogoOpcionesVisible" modal header="AJUSTES DE LIGA"
      :headerStyle="{ backgroundColor: '#1A1A1F', color: 'white', borderBottom: '1px solid #2A2A32', fontWeight: 'bold', letterSpacing: '0.1em' }"
      :contentStyle="{ backgroundColor: '#1A1A1F', padding: '1.5rem' }"
      :style="{ width: '90vw', maxWidth: '400px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }">
      <div v-if="ligaSeleccionada" class="flex flex-col gap-4">
        <p class="mb-2 text-center text-[#F0ECEC] text-sm">
          ¿Qué deseas hacer con la liga <strong class="text-white">{{ ligaSeleccionada.nombre }}</strong>?
        </p>

        <Button label="ABANDONAR LIGA" icon="pi pi-sign-out"
          class="w-full !bg-[#F0ECEC] !text-black font-bold !border-none" @click="manejarAbandonarLiga"
          :loading="cargandoAccion" />

        <Button v-if="ligaSeleccionada.admin === storeAutenticacion.usuarioActual.correoAutenticacion"
          label="ELIMINAR LIGA" icon="pi pi-trash" class="w-full !bg-[#E10600] !text-white font-bold !border-none"
          @click="manejarEliminarLiga" :loading="cargandoAccion" />
      </div>
    </Dialog>
  </div>
</template>
