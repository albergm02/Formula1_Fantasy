<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

/* Stores */
import { useLigasStore } from '@/stores/storeLeagues'
import { useAuthStore } from '@/stores/storeAuth'

/* Componentes UI */
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
const confirm = useConfirm()

/* Estados */
const newLeagueName = ref('')
const joinCode = ref('')
const isLoading = ref(false)
const isCreateDialogVisible = ref(false)
const isJoinDialogVisible = ref(false)
const isOptionsDialogVisible = ref(false)
const selectedLeague = ref(null)
const isActionLoading = ref(false)

/* Abre el menú de opciones de una liga seleccionada */
const openLeagueOptions = (league) => {
  selectedLeague.value = league
  isOptionsDialogVisible.value = true
}

/* Al montar, cargamos las ligas del usuario */
onMounted(async () => {
  isLoading.value = true
  await ligasStore.loadUserLeagues()
  isLoading.value = false
})

/* Handler Crear liga */
const handleCreateLeague = async () => {
  const normalizedLeagueName = newLeagueName.value.trim()

  // Validaciones de longitud del nombre
  if (normalizedLeagueName.length < 3) {
    toast.add({ severity: 'warn', summary: 'Nombre inválido', detail: 'El nombre debe tener al menos 3 caracteres' })
    return
  }

  if (normalizedLeagueName.length > 15) {
    toast.add({ severity: 'warn', summary: 'Límite alcanzado', detail: 'El nombre no puede exceder los 15 caracteres' })
    return
  }

  const result = await ligasStore.createLeague(normalizedLeagueName)
  if (result.success) {
    toast.add({ severity: 'success', summary: '¡Liga creada!', detail: result.message })
    newLeagueName.value = ''
    isCreateDialogVisible.value = false
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: result.message })
  }
}

/* Handler Unirse a liga con código de invitación */
const handleJoinLeague = async () => {
  const normalizedJoinCode = joinCode.value.trim().toUpperCase()

  if (!normalizedJoinCode) {
    return
  }

  const result = await ligasStore.joinLeague(normalizedJoinCode)
  if (result.success) {
    toast.add({ severity: 'success', summary: '¡Bienvenido!', detail: result.message })
    joinCode.value = ''
    isJoinDialogVisible.value = false
  } else {
    toast.add({ severity: 'error', summary: 'Error al unirse', detail: result.message })
  }
}

/* Navega al dashboard de una liga concreta */
const openLeague = (leagueId) => {
  ligasStore.activeLeagueId = leagueId
  router.push({ name: 'inicio', query: { liga: leagueId } })
}

/* Handler Abandonar liga: pide confirmación antes de salir */
const handleLeaveLeague = () => {
  confirm.require({
    icon: 'pi pi-exclamation-triangle',
    message: `¿Estás seguro de que quieres abandonar el campeonato "${selectedLeague.value.nombre}"?`,
    header: 'CONFIRMACIÓN DE SALIDA',
    acceptLabel: 'Abandonar',
    rejectClass: '!bg-transparent !border-none !text-white',
    acceptClass: '!bg-[#D4A843] !border-none !text-[#1A1A1F]',
    accept: async () => {
      isActionLoading.value = true
      const result = await ligasStore.leaveLeague(selectedLeague.value.id)
      isActionLoading.value = false

      if (result.success) {
        toast.add({ severity: 'success', summary: 'Coche fuera de pista', detail: result.message })
        isOptionsDialogVisible.value = false
      } else {
        toast.add({ severity: 'error', summary: 'Error al abandonar', detail: result.message })
      }
    },
  })
}

/* Handler Eliminar liga: acción destructiva, borra la liga para todos */
const handleDeleteLeague = () => {
  confirm.require({
    icon: 'pi pi-trash',
    message: 'Todos los participantes serán expulsados y los datos serán borrados permanentemente.',
    header: 'ELIMINAR LIGA',
    acceptLabel: 'Eliminar para todos',
    rejectClass: '!bg-transparent !border-none !text-white',
    acceptClass: '!bg-[#E10600] !border-none !text-white',
    accept: async () => {
      isActionLoading.value = true
      const result = await ligasStore.deleteLeague(selectedLeague.value.id)
      isActionLoading.value = false

      if (result.success) {
        toast.add({ severity: 'success', summary: 'Campeonato finalizado', detail: result.message })
        isOptionsDialogVisible.value = false
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
    <Header />

    <div class="p-4 mt-4 max-w-4xl mx-auto">
      <div class="flex flex-col gap-6">

        <!-- Botones de crear y unirse a liga -->
        <section class="grid grid-cols-2 gap-4">
          <Button label="CREAR LIGA" icon="pi pi-plus"
            class="w-full py-3 !bg-[#D4A843] !text-[#1A1A1F] font-black tracking-widest !border-none"
            @click="isCreateDialogVisible = true" />
          <Button label="UNIRSE" icon="pi pi-sign-in"
            class="w-full py-3 !bg-transparent !border-2 !border-[#D4A843] !text-[#D4A843] font-black tracking-widest"
            @click="isJoinDialogVisible = true" />
        </section>

        <!-- Listado de ligas del usuario -->
        <section>
          <div v-if="ligasStore.leagueDetails.length > 0" class="flex flex-col justify-center w-full">
            <div class="text-center text-[#F0ECEC] font-bold uppercase tracking-wider mb-4">
              Ligas disponibles: {{ ligasStore.leagueDetails.length }}/8
            </div>

            <DataView :value="ligasStore.leagueDetails" :pt="{ content: { class: '!bg-transparent' } }">
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
                        @click="openLeagueOptions(item)" />
                      <Button icon="pi pi-flag-fill" class="!bg-[#E10600] !border-none !text-[#FFFFFF] !w-10 !h-10"
                        @click="openLeague(item.id)" />
                    </div>
                  </div>
                </div>
              </template>
            </DataView>
          </div>

          <div v-else-if="!isLoading" class="flex justify-center mt-10">
            <Message severity="secondary"
              class="!text-center !bg-transparent !border !border-[#F0ECEC]/20 !text-[#F0ECEC]">
              No perteneces a ninguna liga todavía. Crea o únete a una.
            </Message>
          </div>
        </section>
      </div>
    </div>

    <Dialog v-model:visible="isCreateDialogVisible" modal header="CREAR CAMPEONATO" :pt="{
      root: { class: '!bg-[#1A1A1F] !border-none mx-4 w-full max-w-sm' },
      header: { class: '!bg-[#1A1A1F] !rounded' },
      title: { class: 'font-bold tracking-widest text-[#E10600]' },
      content: { class: '!bg-[#1A1A1F] pt-4' },
      closeButton: { class: 'hover:!bg-[#F0ECEC] !text-[#F0ECEC]' },
    }">
      <div class="flex flex-col gap-4">
        <span class="text-[#F0ECEC]"> Puedes crear un máximo de 8 ligas</span>
        <InputText v-model="newLeagueName" placeholder="Introduzca aquí el nombre"
          class="w-full !bg-[#121218] !text-[#F0ECEC] focus:!border-[#E10600]" autofocus />
        <div class="flex justify-end gap-2 mt-2">
          <Button label="Cancelar" @click="isCreateDialogVisible = false"
            class="!bg-transparent !border-none !text-[#F0ECEC] hover:!text-white" />
          <Button label="Crear" @click="handleCreateLeague"
            class="!bg-[#E10600] !border-none !px-10 font-bold hover:!bg-[#C00500]" />
        </div>
      </div>
    </Dialog>

    <Dialog v-model:visible="isJoinDialogVisible" modal header="UNIRSE A LIGA" :pt="{
      root: { class: '!bg-[#1A1A1F] !border-none mx-4 w-full max-w-sm' },
      header: { class: '!bg-[#1A1A1F] !rounded ' },
      title: { class: 'font-bold tracking-widest text-[#D4A843]' },
      content: { class: '!bg-[#1A1A1F] pt-4' },
      closeButton: { class: 'hover:!bg-[#F0ECEC] !text-[#F0ECEC]' },
    }">
      <div class="flex flex-col gap-4">
        <span class="text-[#F0ECEC] text-sm">Introduce el código de invitación de 6 dígitos.</span>
        <InputText v-model="joinCode" placeholder="Ej: A1B2C3"
          class="w-full uppercase !bg-[#121218] focus:!border-[#D4A843]" autofocus />
        <div class="flex justify-end gap-2 mt-2">
          <Button label="Cancelar" @click="isJoinDialogVisible = false"
            class="!bg-transparent !border-none !text-[#F0ECEC] hover:!text-white" />
          <Button label="Unirse" @click="handleJoinLeague"
            class="!bg-[#D4A843] !text-[#1A1A1F] !border-none !px-10 font-bold hover:!bg-[#C09638]" />
        </div>
      </div>
    </Dialog>

    <Dialog v-model:visible="isOptionsDialogVisible" modal header="AJUSTES DE LIGA" :pt="{
      root: { class: '!bg-[#1A1A1F] !border-none mx-4 w-full max-w-sm' },
      header: { class: '!bg-[#1A1A1F] !rounded' },
      title: { class: 'font-bold tracking-widest text-[#F0ECEC]' },
      content: { class: '!bg-[#1A1A1F] pt-4 pb-6' },
      closeButton: { class: 'hover:!bg-[#F0ECEC] !text-[#F0ECEC]' },
    }">
      <div v-if="selectedLeague" class="flex flex-col gap-4">
        <p class="text-center text-[#F0ECEC] text-sm mb-2">
          ¿Qué deseas hacer con la liga <strong class="text-white">{{ selectedLeague.nombre }}</strong>?
        </p>

        <Button label="ABANDONAR LIGA" icon="pi pi-sign-out"
          class="w-full !bg-[#F0ECEC] !border-none !text-black font-bold" @click="handleLeaveLeague"
          :loading="isActionLoading" />

        <Button v-if="selectedLeague.admin === authStore.currentUser.authEmail" label="ELIMINAR LIGA" icon="pi pi-trash"
          class="w-full !bg-[#E10600] !border-none !text-white font-bold" @click="handleDeleteLeague"
          :loading="isActionLoading" />
      </div>
    </Dialog>
  </div>
</template>