<script setup>
import { ref, computed, onMounted } from 'vue'
import {
    eliminarLigaComoAdministrador,
    eliminarUsuarioComoAdministrador,
    cargarListaLigas,
    cargarListaUsuarios,
} from '@/services/servicioAdministracion'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Select from 'primevue/select'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const toast = useToast()
const confirm = useConfirm()

const cargandoEliminacion = ref(false)
const cargandoEliminacionUsuario = ref(false)

const ligas = ref([])
const usuarios = ref([])
const ligaAEliminar = ref(null)
const usuarioAEliminar = ref(null)

const fechaRegistroUsuarioSeleccionado = computed(() => {
    const usuario = usuarios.value.find((u) => u.uid === usuarioAEliminar.value)
    if (!usuario?.fechaRegistro) return null
    return usuario.fechaRegistro.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    })
})

async function cargarLigas() {
    ligas.value = await cargarListaLigas()
}

async function cargarUsuarios() {
    usuarios.value = await cargarListaUsuarios()
}

onMounted(async () => {
    await cargarLigas()
    await cargarUsuarios()
})

function manejarEliminarUsuario() {
    if (!usuarioAEliminar.value) {
        toast.add({
            severity: 'warn',
            summary: 'Selecciona un usuario',
            detail: 'Debes elegir el usuario que quieres eliminar.',
            life: 4000,
        })
        return
    }
    const usuario = usuarios.value.find((u) => u.uid === usuarioAEliminar.value)
    const etiquetaUsuario = usuario?.etiqueta || usuarioAEliminar.value

    confirm.require({
        message: `Vas a eliminar PERMANENTEMENTE al usuario ${etiquetaUsuario}: se borrarán su perfil, sus participaciones, pujas activas y su cuenta de autenticación. Si era el único participante de alguna liga, esa liga también se borrará. Esta acción NO se puede deshacer.`,
        header: 'Confirmar eliminación de usuario',
        acceptLabel: 'Sí, eliminar',
        rejectLabel: 'Cancelar',
        acceptClass: '!bg-red-700 !border-red-700 !text-white',
        rejectClass: '!bg-gray-700 !border-gray-700 !text-white',
        accept: async () => {
            cargandoEliminacionUsuario.value = true
            try {
                const datos = await eliminarUsuarioComoAdministrador(usuarioAEliminar.value)
                toast.add({
                    severity: 'success',
                    summary: 'Usuario eliminado',
                    detail: `Usuario eliminado correctamente.`,
                    life: 6000,
                })
                usuarioAEliminar.value = null
                await Promise.all([cargarLigas(), cargarUsuarios()])
            } catch (error) {
                toast.add({
                    severity: 'error',
                    summary: 'Error eliminando usuario',
                    detail: error.message,
                    life: 6000,
                })
            } finally {
                cargandoEliminacionUsuario.value = false
            }
        },
    })
}

function manejarEliminarLiga() {
    if (!ligaAEliminar.value) {
        toast.add({
            severity: 'warn',
            summary: 'Selecciona una liga',
            detail: 'Debes elegir la liga que quieres eliminar.',
            life: 4000,
        })
        return
    }
    const nombreLiga =
        ligas.value.find((l) => l.id === ligaAEliminar.value)?.nombre || ligaAEliminar.value

    confirm.require({
        message: `Vas a eliminar PERMANENTEMENTE la liga "${nombreLiga}": se borrarán sus participaciones, mercados, pujas y actividad, y se desvinculará de todos sus usuarios. Esta acción NO se puede deshacer.`,
        header: 'Confirmar eliminación de liga',
        acceptLabel: 'Sí, eliminar',
        rejectLabel: 'Cancelar',
        acceptClass: '!bg-red-700 !border-red-700 !text-white',
        rejectClass: '!bg-gray-700 !border-gray-700 !text-white',
        accept: async () => {
            cargandoEliminacion.value = true
            try {
                await eliminarLigaComoAdministrador(ligaAEliminar.value)
                toast.add({
                    severity: 'success',
                    summary: 'Liga eliminada',
                    detail: `Liga eliminada correctamente.`,
                    life: 6000,
                })
                ligaAEliminar.value = null
                await cargarLigas()
            } catch (error) {
                toast.add({
                    severity: 'error',
                    summary: 'Error eliminando liga',
                    detail: error.message,
                    life: 6000,
                })
            } finally {
                cargandoEliminacion.value = false
            }
        },
    })
}
</script>

<template>
    <div class="space-y-4">
        <div class="grid grid-cols-1 gap-3">
            <Card class="!bg-[#1A1A1F] !text-[#F0ECEC]">
                <template #content>
                    <div class="space-y-5">
                        <div>
                            <h3 class="text-sm font-semibold text-red-400 mb-2">Eliminar usuario</h3>
                            <p class="text-xs text-zinc-400 mb-3">
                                Borra al usuario seleccionado: su perfil,
                                participaciones, pujas activas en mercados abiertos y su cuenta de Firebase
                                Authentication.
                            </p>
                            <div class="flex flex-col gap-2">
                                <Select v-model="usuarioAEliminar" :options="usuarios" optionLabel="etiqueta"
                                    optionValue="uid" placeholder="Usuario a eliminar" filter class="flex-1" />
                                <p v-if="fechaRegistroUsuarioSeleccionado" class="text-xs text-zinc-500">
                                    Registrado el {{ fechaRegistroUsuarioSeleccionado }}
                                </p>
                                <Button @click="manejarEliminarUsuario" :loading="cargandoEliminacionUsuario"
                                    label="Eliminar" size="small" severity="danger"
                                    class="!bg-red-700 !border-red-700 !text-white" />
                            </div>
                        </div>

                        <div class="border-t border-red-900/40 pt-4">
                            <h3 class="text-sm font-semibold text-red-400 mb-2">Eliminar liga</h3>
                            <p class="text-xs text-zinc-400 mb-3">
                                Borra la liga seleccionada: el documento de la
                                liga, todas sus participaciones, mercados, pujas y actividad. Además la desvincula
                                del perfil de cualquier usuario que la tuviera asociada.
                            </p>
                            <div class="flex flex-col gap-2">
                                <Select v-model="ligaAEliminar" :options="ligas" optionLabel="nombre" optionValue="id"
                                    placeholder="Liga a eliminar" filter class="flex-1" />
                                <Button @click="manejarEliminarLiga" :loading="cargandoEliminacion" label="Eliminar"
                                    size="small" severity="danger" class="!bg-red-700 !border-red-700 !text-white" />
                            </div>
                        </div>

                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>
