<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

import { usarStoreLigas } from '@/stores/storeLigas'
import { usarStorePerfil } from '@/stores/storePerfil'

import Cabecera from '@/components/Cabecera.vue'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import DataView from 'primevue/dataview'

const storeLigas = usarStoreLigas()
const storePerfil = usarStorePerfil()
const router = useRouter()
const notificacion = useToast()
const confirmar = useConfirm()

const nombreNuevaLiga = ref('')
const codigoUnion = ref('')
const ligaSeleccionada = ref(null)

const cargando = ref(false)
const cargandoAccion = ref(false)
const cargandoParticipantes = ref(false)

const dialogoCrearVisible = ref(false)
const dialogoUnirseVisible = ref(false)
const dialogoOpcionesVisible = ref(false)
const dialogoParticipantesVisible = ref(false)

const participantesLiga = ref([])

onMounted(async () => {
  cargando.value = true
  await storeLigas.cargarLigasUsuario()
  cargando.value = false
})

const abrirOpcionesLiga = (liga) => {
  ligaSeleccionada.value = liga
  dialogoOpcionesVisible.value = true
}

const handleCrearLiga = async () => {
  if (cargandoAccion.value) return

  const nombreLigaNormalizado = nombreNuevaLiga.value.trim()

  if (nombreLigaNormalizado.length < 3) {
    notificacion.add({ severity: 'warn', summary: 'Nombre inválido', detail: 'El nombre debe tener al menos 3 carácteres.' })
    return
  }
  if (nombreLigaNormalizado.length > 12) {
    notificacion.add({ severity: 'warn', summary: 'Nombre inválido', detail: 'El nombre no puede exceder los 12 carácteres.' })
    return
  }

  cargandoAccion.value = true
  const resultado = await storeLigas.crearLiga(nombreLigaNormalizado)
  if (resultado.success) {
    notificacion.add({ severity: 'success', summary: '¡Liga creada!', detail: resultado.message })
    nombreNuevaLiga.value = ''
    dialogoCrearVisible.value = false
  } else {
    notificacion.add({ severity: 'error', summary: 'Error', detail: resultado.message })
  }
  cargandoAccion.value = false
}

const handleUnirseLiga = async () => {
  if (cargandoAccion.value) return

  const codigoUnionNormalizado = codigoUnion.value.trim().toUpperCase()

  if (!codigoUnionNormalizado) return

  cargandoAccion.value = true
  const resultado = await storeLigas.unirseALiga(codigoUnionNormalizado)
  codigoUnion.value = ''
  dialogoUnirseVisible.value = false
  if (resultado.success) notificacion.add({ severity: 'success', summary: '¡Bienvenido!', detail: resultado.message })
  else notificacion.add({ severity: 'error', summary: 'Error al unirse', detail: resultado.message })
  cargandoAccion.value = false
}

const abrirLiga = (idLiga) => {
  storeLigas.idLigaActiva = idLiga
  router.push({ name: 'inicio', query: { liga: idLiga } })
}

async function copiarCodigoLiga(codigo) {
  await navigator.clipboard.writeText(codigo)
  notificacion.add({ severity: 'success', summary: 'Código copiado', detail: `"${codigo}" copiado al portapapeles.`, life: 3000 })
}

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

const abrirGestionParticipantes = async () => {
  dialogoOpcionesVisible.value = false
  cargandoParticipantes.value = true
  dialogoParticipantesVisible.value = true
  try {
    participantesLiga.value = await storeLigas.cargarParticipantesLiga(ligaSeleccionada.value.id)
  } catch {
    notificacion.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la lista de participantes.' })
  } finally {
    cargandoParticipantes.value = false
  }
}

const handleExpulsarParticipante = (participante) => {
  confirmar.require({
    message: `¿Seguro que quieres expulsar a ${participante.nombre_usuario} de la liga?`,
    header: 'CONFIRMACIÓN DE EXPULSIÓN',
    acceptLabel: 'Expulsar',
    rejectClass: '!bg-transparent !border-none !text-white',
    acceptClass: '!bg-[#E10600] !border-none !text-white',
    accept: async () => {
      cargandoAccion.value = true
      const resultado = await storeLigas.expulsarParticipante(ligaSeleccionada.value.id, participante.email_usuario)
      cargandoAccion.value = false

      if (resultado.success) {
        notificacion.add({ severity: 'success', summary: 'Participante expulsado', detail: resultado.message })
        participantesLiga.value = participantesLiga.value.filter((p) => p.email_usuario !== participante.email_usuario)
        await storeLigas.cargarLigasUsuario()
      } else {
        notificacion.add({ severity: 'error', summary: 'Error al expulsar', detail: resultado.message })
      }
    },
  })
}

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
        <section class="grid grid-cols-2 gap-4">
          <Button label="CREAR LIGA" icon="pi pi-plus"
            class="w-full py-3 !bg-[#D4A843] !border-none font-black tracking-widest !text-[#1A1A1F]"
            @click="dialogoCrearVisible = true" />
          <Button label="UNIRSE" icon="pi pi-sign-in"
            class="w-full py-3 !bg-transparent !border-2 !border-[#D4A843] font-black tracking-widest !text-[#D4A843]"
            @click="dialogoUnirseVisible = true" />
        </section>

        <section>
          <div v-if="storeLigas.detallesLigas.length > 0" class="flex flex-col justify-center w-full">
            <div class="mb-4 text-center font-bold uppercase tracking-wider text-[#F0ECEC]">
              Ligas disponibles: {{ storeLigas.detallesLigas.length }}/5
            </div>

            <DataView :value="storeLigas.detallesLigas" :pt="{ content: { class: '!bg-transparent' } }">
              <template #list="slotProps">
                <div class="flex flex-col w-full gap-4">
                  <div v-for="(item, index) in slotProps.items" :key="index" @click="abrirLiga(item.id)"
                    class="flex items-center justify-between p-4 bg-[#1A1A1F] rounded-lg">
                    <div class="flex flex-col gap-1 w-2/3">
                      <h3 class="pr-2 text-xl font-black uppercase truncate text-[#E10600]" :title="item.nombre">
                        {{ item.nombre }}
                      </h3>
                      <div class="flex flex-wrap gap-3 text-xs font-medium">
                        <span class="flex items-center gap-1 text-zinc-400">
                          <i class="pi pi-users text-[#D4A843] text-[10px]"></i> {{ item.participantes }}
                        </span>
                        <span class="flex items-center gap-1 text-zinc-400 font-mono tracking-widest">
                          <i class="pi pi-key text-[#D4A843] text-[10px]"></i> {{ item.codigo_invitacion }}
                        </span>
                      </div>
                    </div>

                    <div class="flex gap-2 justify-end">
                      <Button icon="pi pi-copy" class="!bg-[#121218] !border !border-[#D4A843] !text-[#D4A843]"
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

    <Dialog v-model:visible="dialogoCrearVisible" modal header="CREAR CAMPEONATO"
      :style="{ width: '90vw', maxWidth: '400px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }">
      <div class="flex flex-col gap-4">
        <span class="text-[#F0ECEC]">Introduzca el nombre de la nueva liga. (Máximo 12 caracteres)</span>
        <InputText v-model="nombreNuevaLiga" placeholder="Introduzca aquí el nombre..." maxlength="12"
          class="w-full !bg-[#121218] !text-[#F0ECEC] focus:!border-[#D4A843]" autofocus />
        <div class="flex justify-end gap-2 mt-2">
          <Button label="Cancelar" @click="dialogoCrearVisible = false"
            class="!bg-transparent !border-none !text-[#F0ECEC]" />
          <Button label="Crear" @click="handleCrearLiga" :loading="cargandoAccion" :disabled="cargandoAccion"
            class="!px-10 !bg-[#D4A843] !border-none font-bold" />
        </div>
      </div>
    </Dialog>

    <Dialog v-model:visible="dialogoUnirseVisible" modal header="UNIRSE A LIGA"
      :style="{ width: '90vw', maxWidth: '400px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }">
      <div class="flex flex-col gap-4">
        <span class="text-sm text-[#F0ECEC]">Introduce el código de invitación de 8 dígitos.</span>
        <InputText v-model="codigoUnion" placeholder="Ej: A1B2C3D4" maxlength="8"
          class="w-full !bg-[#121218] uppercase focus:!border-[#D4A843]" autofocus />
        <div class="flex justify-end gap-2 mt-2">
          <Button label="Cancelar" @click="dialogoUnirseVisible = false"
            class="!bg-transparent !border-none !text-[#F0ECEC]" />
          <Button label="Unirse" @click="handleUnirseLiga" :loading="cargandoAccion" :disabled="cargandoAccion"
            class="!px-10 !bg-[#D4A843] !border-none font-bold !text-[#1A1A1F]" />
        </div>
      </div>
    </Dialog>

    <Dialog v-model:visible="dialogoOpcionesVisible" modal header="AJUSTES DE LIGA"
      :style="{ width: '90vw', maxWidth: '400px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }">
      <div v-if="ligaSeleccionada" class="flex flex-col gap-4">
        <p class="mb-2 text-center text-sm text-[#F0ECEC]">
          ¿Qué deseas hacer con la liga <strong class="text-white">{{ ligaSeleccionada.nombre }}</strong>?
        </p>

        <Button label="ABANDONAR LIGA" class="w-full !bg-[#F0ECEC] !border-none font-bold !text-black"
          @click="handleAbandonarLiga" :loading="cargandoAccion" />
        <template v-if="ligaSeleccionada.correoOrganizador === storePerfil.usuarioActual.correoAutenticacion">
          <Button label="GESTIONAR PARTICIPANTES" class="w-full !bg-[#D4A843] !border-none font-bold !text-[#1A1A1F]"
            @click="abrirGestionParticipantes" :loading="cargandoAccion" />
          <Button label="ELIMINAR LIGA" class="w-full !bg-[#E10600] !border-none font-bold !text-white"
            @click="handleEliminarLiga" :loading="cargandoAccion" />
        </template>
      </div>
    </Dialog>

    <Dialog v-model:visible="dialogoParticipantesVisible" modal header="PARTICIPANTES"
      :style="{ width: '90vw', maxWidth: '400px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }">
      <div class="flex flex-col gap-3 min-w-64">
        <div v-if="cargandoParticipantes" class="text-center text-[#F0ECEC] py-4">Cargando...</div>
        <div v-else-if="participantesLiga.length === 0" class="text-center text-[#F0ECEC] py-4">No hay participantes.
        </div>
        <div v-else v-for="participante in participantesLiga" :key="participante.email_usuario"
          class="flex items-center justify-between p-3 bg-[#1A1A1F] rounded-lg">
          <div class="flex flex-col">
            <span class="font-black text-white uppercase text-sm">{{ participante.nombre_usuario }}</span>
            <span class="text-[10px] text-[#D4A843] uppercase font-bold">{{ participante.rol }}</span>
          </div>
          <Button v-if="participante.email_usuario !== storePerfil.usuarioActual.correoAutenticacion"
            icon="pi pi-user-minus" class="!bg-[#E10600] !border-none !text-white" :loading="cargandoAccion"
            @click="handleExpulsarParticipante(participante)" />
        </div>
      </div>
    </Dialog>
  </div>
</template>
