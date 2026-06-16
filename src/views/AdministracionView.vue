<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { usarStoreAdministracion } from '@/stores/storeAdministracion'
import { usarStoreAutenticacion } from '@/stores/storeAutenticacion'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import { FilterMatchMode } from '@primevue/core/api'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const storeAdministracion = usarStoreAdministracion()
const storeAutenticacion = usarStoreAutenticacion()
const { ligas, usuarios } = storeToRefs(storeAdministracion)

const cargando = ref(false)
const filtroUsuarios = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } })
const filtroLigas = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } })

onMounted(cargarPanel)

async function handleCerrarSesion() {
    await storeAutenticacion.cerrarSesion()
    router.push({ name: 'login' })
}

async function cargarPanel() {
    cargando.value = true
    try {
        await storeAdministracion.cargarListas()
    } catch (error) {
        notificarError('No se pudieron cargar los datos', error)
    } finally {
        cargando.value = false
    }
}

function eliminarUsuario(usuario) {
    confirmarEliminacion({
        header: 'Confirmar eliminación de usuario',
        mensaje: `Vas a eliminar PERMANENTEMENTE al usuario ${usuario.etiqueta}: se borrarán su perfil, sus participaciones, pujas activas y su cuenta de autenticación. Si era el único participante de alguna liga, esa liga también se borrará. Esta acción NO se puede deshacer.`,
        accion: () => storeAdministracion.eliminarUsuario(usuario.uid),
        exito: 'Usuario eliminado correctamente.',
    })
}

function eliminarLiga(liga) {
    confirmarEliminacion({
        header: 'Confirmar eliminación de liga',
        mensaje: `Vas a eliminar PERMANENTEMENTE la liga "${liga.nombre}": se borrarán sus participaciones, mercados, pujas y actividad, y se desvinculará de todos sus usuarios. Esta acción NO se puede deshacer.`,
        accion: () => storeAdministracion.eliminarLiga(liga.id),
        exito: 'Liga eliminada correctamente.',
    })
}

function confirmarEliminacion({ header, mensaje, accion, exito }) {
    confirm.require({
        header,
        message: mensaje,
        acceptLabel: 'Sí, eliminar',
        rejectLabel: 'Cancelar',
        acceptClass: '!bg-red-700 !border-red-700 !text-white',
        rejectClass: '!bg-gray-700 !border-gray-700 !text-white',
        accept: () => ejecutarEliminacion(accion, exito),
    })
}

async function ejecutarEliminacion(accion, mensajeExito) {
    cargando.value = true
    try {
        await accion()
        toast.add({ severity: 'success', summary: 'Eliminado', detail: mensajeExito, life: 6000 })
    } catch (error) {
        notificarError('No se pudo completar la eliminación', error)
    } finally {
        cargando.value = false
    }
}

function notificarError(resumen, error) {
    toast.add({ severity: 'error', summary: resumen, detail: error.message, life: 6000 })
}

function formatearFecha(fecha) {
    if (!fecha) return 'Sin registrar'
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
    <div class="min-h-screen bg-[#0C0C0E] text-[#F0ECEC] flex flex-col">
        <header class="w-full p-3 flex justify-between sticky top-0 z-40 bg-[#1A1A1F] border-b border-[#E10600]">
            <div class="flex items-center gap-2">
                <img src="/logo.png" class="h-8 w-8 object-contain" />
                <span class="font-black text-[#E10600] text-lg">ADMINISTRADOR</span>
            </div>
            <Button @click="handleCerrarSesion" icon="pi pi-sign-out" text class="!text-zinc-400" />
        </header>

        <main class="flex-1 p-10 max-w-6xl mx-auto w-full space-y-4">
            <div class="grid grid-cols-1 gap-4">
                <DataTable :value="usuarios" v-model:filters="filtroUsuarios" :loading="cargando"
                    :globalFilterFields="['nombre', 'email', 'uid']" dataKey="uid" paginator :rows="8" removableSort
                    stripedRows class="text-sm">
                    <template #header>
                        <div class="flex flex-wrap items-left gap-2">
                            <IconField>
                                <InputIcon class="pi pi-search" />
                                <InputText v-model="filtroUsuarios.global.value" placeholder="Buscar usuario..." />
                            </IconField>
                        </div>
                    </template>
                    <template #empty>No hay usuarios que coincidan.</template>

                    <Column field="nombre" header="Usuario" sortable />
                    <Column field="email" header="Email" sortable />
                    <Column header="Registro" sortable sortField="fechaRegistro">
                        <template #body="{ data }">{{ formatearFecha(data.fechaRegistro) }}</template>
                    </Column>
                    <Column class="w-12">
                        <template #body="{ data }">
                            <Button icon="pi pi-trash" severity="danger" @click="eliminarUsuario(data)" />
                        </template>
                    </Column>
                </DataTable>

                <DataTable :value="ligas" v-model:filters="filtroLigas" :loading="cargando"
                    :globalFilterFields="['nombre', 'organizador', 'id']" dataKey="id" paginator :rows="8" removableSort
                    stripedRows class="text-sm">
                    <template #header>
                        <div class="flex flex-wrap items-left justify-between gap-2">
                            <IconField>
                                <InputIcon class="pi pi-search" />
                                <InputText v-model="filtroLigas.global.value" placeholder="Buscar liga..." />
                            </IconField>
                        </div>
                    </template>
                    <template #empty>No hay ligas que coincidan.</template>

                    <Column field="nombre" header="Liga" sortable />
                    <Column field="organizador" header="Organizador" sortable />
                    <Column field="participantes" header="Jugadores" sortable />
                    <Column header="Creada" sortable sortField="fechaCreacion">
                        <template #body="{ data }">{{ formatearFecha(data.fechaCreacion) }}</template>
                    </Column>
                    <Column class="w-12">
                        <template #body="{ data }">
                            <Button icon="pi pi-trash" severity="danger" @click="eliminarLiga(data)" />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </main>
    </div>
</template>
