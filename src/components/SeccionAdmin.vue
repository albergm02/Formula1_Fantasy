<script setup>
import { ref, onMounted } from 'vue'
import {
    cargarListaLigas,
    cargarListaUsuarios,
    eliminarLigaComoAdministrador,
    eliminarUsuarioComoAdministrador,
} from '@/services/servicioAdministracion'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import { FilterMatchMode } from '@primevue/core/api'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const toast = useToast()
const confirm = useConfirm()

const ligas = ref([])
const usuarios = ref([])
const cargando = ref(false)
const filtroUsuarios = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } })
const filtroLigas = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } })

onMounted(cargarListas)

async function cargarListas() {
    cargando.value = true
    try {
        const [listaLigas, listaUsuarios] = await Promise.all([
            cargarListaLigas(),
            cargarListaUsuarios(),
        ])
        ligas.value = listaLigas
        usuarios.value = listaUsuarios
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
        accion: () => eliminarUsuarioComoAdministrador(usuario.uid),
        exito: 'Usuario eliminado correctamente.',
    })
}

function eliminarLiga(liga) {
    confirmarEliminacion({
        header: 'Confirmar eliminación de liga',
        mensaje: `Vas a eliminar PERMANENTEMENTE la liga "${liga.nombre}": se borrarán sus participaciones, mercados, pujas y actividad, y se desvinculará de todos sus usuarios. Esta acción NO se puede deshacer.`,
        accion: () => eliminarLigaComoAdministrador(liga.id),
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
    }
    await cargarListas()
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
    <div class="grid grid-cols-1 gap-4">
        <DataTable :value="usuarios" v-model:filters="filtroUsuarios" :loading="cargando"
            :globalFilterFields="['nombre', 'email', 'uid']" dataKey="uid" paginator :rows="8" removableSort stripedRows
            class="text-sm">
            <template #header>
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="flex items-center gap-2 font-semibold" />
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
                    <Button icon="pi pi-trash" severity="danger" text rounded @click="eliminarUsuario(data)" />
                </template>
            </Column>
        </DataTable>

        <DataTable :value="ligas" v-model:filters="filtroLigas" :loading="cargando"
            :globalFilterFields="['nombre', 'organizador', 'id']" dataKey="id" paginator :rows="8" removableSort
            stripedRows class="text-sm">
            <template #header>
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="flex items-center gap-2 font-semibold">
                        <i class="pi pi-trophy text-red-500" /> Ligas
                    </span>
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
                    <Button icon="pi pi-trash" severity="danger" text rounded @click="eliminarLiga(data)" />
                </template>
            </Column>
        </DataTable>
    </div>
</template>
