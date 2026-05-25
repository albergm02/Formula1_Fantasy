<script setup>
import { ref, computed, onMounted } from 'vue'
import {
    dispararResolucionPujas,
    dispararProcesamientoJornada,
    eliminarLigaComoAdministrador,
    eliminarUsuarioComoAdministrador,
    resembrarCatalogo,
    cargarListaLigas,
    cargarListaMercados,
    cargarListaUsuarios,
} from '@/services/servicioAdministracion'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const toast = useToast()
const confirm = useConfirm()

const cargandoPujas = ref(false)
const cargandoJornada = ref(false)
const cargandoEliminacion = ref(false)
const cargandoEliminacionUsuario = ref(false)
const cargandoResiembra = ref(false)

const ligas = ref([])
const mercadosAbiertos = ref([])
const usuarios = ref([])
const ligaParaPujas = ref(null)
const ligaParaJornada = ref(null)
const meetingKeyJornada = ref('')
const ligaAEliminar = ref(null)
const usuarioAEliminar = ref(null)
const ultimoResultado = ref(null)

const ligasConMercadoAbierto = computed(() => {
    const mapaMercados = new Map(mercadosAbiertos.value.map((m) => [m.idLiga, m.id]))
    return ligas.value
        .filter((liga) => mapaMercados.has(liga.id))
        .map((liga) => ({ ...liga, idMercado: mapaMercados.get(liga.id) }))
})

async function cargarLigas() {
    ligas.value = await cargarListaLigas()
}

async function cargarMercados() {
    mercadosAbiertos.value = await cargarListaMercados()
}

async function cargarUsuarios() {
    usuarios.value = await cargarListaUsuarios()
}

onMounted(async () => {
    await cargarLigas()
    await cargarMercados()
    await cargarUsuarios()
})

async function manejarResolverPujas() {
    const liga = ligasConMercadoAbierto.value.find((l) => l.id === ligaParaPujas.value)
    if (!liga) {
        toast.add({
            severity: 'warn',
            summary: 'Selecciona una liga',
            detail: 'Debes elegir la liga cuyas pujas quieres resolver.',
            life: 4000,
        })
        return
    }
    cargandoPujas.value = true
    ultimoResultado.value = null
    try {
        const datos = await dispararResolucionPujas(liga.idMercado)
        ultimoResultado.value = datos
        const idNuevoMercado = datos.nuevoMercado?.idMercado
        toast.add({
            severity: 'success',
            summary: 'Pujas resueltas',
            detail: idNuevoMercado
                ? `Mercado de "${liga.nombre}" cerrado y nuevo mercado generado.`
                : `Mercado de "${liga.nombre}" cerrado.`,
            life: 5000,
        })
        await cargarMercados()
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error resolviendo pujas',
            detail: error.message,
            life: 6000,
        })
    } finally {
        cargandoPujas.value = false
    }
}

async function manejarReprocesarJornada() {
    const liga = ligas.value.find((l) => l.id === ligaParaJornada.value)
    if (!liga) {
        toast.add({
            severity: 'warn',
            summary: 'Selecciona una liga',
            detail: 'Debes elegir la liga cuya jornada quieres reprocesar.',
            life: 4000,
        })
        return
    }
    cargandoJornada.value = true
    ultimoResultado.value = null
    try {
        const meetingKey = meetingKeyJornada.value ? Number(meetingKeyJornada.value) : null
        const datos = await dispararProcesamientoJornada({ forzar: true, idLiga: liga.id, meetingKey })
        ultimoResultado.value = datos
        if (datos.ok) {
            toast.add({
                severity: 'success',
                summary: 'Jornada reprocesada',
                detail: `${datos.nombreGranPremio} · ${datos.participacionesProcesadas} participaciones de "${liga.nombre}".`,
                life: 5000,
            })
        } else {
            const motivos = {
                sin_gp_finalizado: 'No hay Gran Premio finalizado en la temporada actual.',
                sin_datos_openf1: `Ningún GP finalizado tiene datos en OpenF1 todavía. Omitidos: ${(datos.omitidos || []).map((o) => o.nombre || o.meeting_key).join(', ') || 'ninguno'}.`,
            }
            toast.add({
                severity: 'info',
                summary: 'Sin cambios',
                detail: motivos[datos.motivo] || `Motivo: ${datos.motivo}`,
                life: 8000,
            })
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error reprocesando jornada',
            detail: error.message,
            life: 6000,
        })
    } finally {
        cargandoJornada.value = false
    }
}

function manejarActualizarCatalogo() {
    confirm.require({
        message: 'Se sobrescribirán los documentos catalogo/{pilotos,coches,potenciadores} con los datos actuales del código (atributos, pesos, precios base). Los precios dinámicos por puja se conservan. ¿Continuar?',
        header: 'Actualizar catálogo',
        acceptLabel: 'Sí, actualizar',
        rejectLabel: 'Cancelar',
        acceptClass: '!bg-red-700 !border-red-700 !text-white',
        rejectClass: '!bg-gray-700 !border-gray-700 !text-white',
        accept: async () => {
            cargandoResiembra.value = true
            ultimoResultado.value = null
            try {
                const datos = await resembrarCatalogo()
                ultimoResultado.value = datos
                toast.add({
                    severity: 'success',
                    summary: 'Catálogo actualizado',
                    detail: `${datos.pilotosSembrados} pilotos · ${datos.cochesSembrados} coches · ${datos.potenciadoresSembrados} potenciadores.`,
                    life: 5000,
                })
            } catch (error) {
                toast.add({
                    severity: 'error',
                    summary: 'Error actualizando catálogo',
                    detail: error.message,
                    life: 6000,
                })
            } finally {
                cargandoResiembra.value = false
            }
        },
    })
}

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
    const usuario = usuarios.value.find((u) => u.email === usuarioAEliminar.value)
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
            ultimoResultado.value = null
            try {
                const datos = await eliminarUsuarioComoAdministrador(usuarioAEliminar.value)
                ultimoResultado.value = datos
                toast.add({
                    severity: 'success',
                    summary: 'Usuario eliminado',
                    detail: `Usuario eliminado correctamente.`,
                    life: 6000,
                })
                usuarioAEliminar.value = null
                await Promise.all([cargarLigas(), cargarMercados(), cargarUsuarios()])
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
            ultimoResultado.value = null
            try {
                const datos = await eliminarLigaComoAdministrador(ligaAEliminar.value)
                ultimoResultado.value = datos
                toast.add({
                    severity: 'success',
                    summary: 'Liga eliminada',
                    detail: `Liga eliminada correctamente.`,
                    life: 6000,
                })
                ligaAEliminar.value = null
                await Promise.all([cargarLigas(), cargarMercados()])
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
                <template #title>
                    <span class="text-sm">Testing de mercado: resolver pujas</span>
                </template>
                <template #content>
                    <p class="text-xs text-zinc-400 mb-3">
                        Cierra el mercado de la liga, resuelvo las pujas según el resultado real del GP,
                        y actualizo los garajes de los participantes.
                    </p>
                    <div class="flex flex-col sm:flex-row gap-2">
                        <Select v-model="ligaParaPujas" :options="ligasConMercadoAbierto" optionLabel="nombre"
                            optionValue="id" placeholder="Seleccionar liga..." filter class="flex-1" />
                        <Button @click="manejarResolverPujas" :loading="cargandoPujas" label="Resolver pujas"
                            size="small" class="!bg-white !border-white !text-black" />
                    </div>
                </template>
            </Card>

            <Card class="!bg-[#1A1A1F] !text-[#F0ECEC] ">
                <template #title>
                    <span class="text-sm">Reprocesar jornada</span>
                </template>
                <template #content>
                    <p class="text-xs text-zinc-400 mb-3">
                        Recalcula la puntuación del último Gran Premio finalizado para la liga seleccionada.
                    </p>
                    <div class="flex flex-col gap-2">
                        <div class="flex flex-col sm:flex-row gap-2">
                            <Select v-model="ligaParaJornada" :options="ligas" optionLabel="nombre" optionValue="id"
                                placeholder="Selecciona una liga" filter class="flex-1" />
                            <Button @click="manejarReprocesarJornada" :loading="cargandoJornada"
                                label="Reprocesar jornada" size="small" class="!bg-white !border-white !text-black" />
                        </div>
                        <InputText v-model="meetingKeyJornada" placeholder="Meeting key (opcional, ej: 1284 para Japón)"
                            class="w-full text-xs" size="small" />
                    </div>
                </template>
            </Card>

            <Card class="!bg-[#1A1A1F] !text-[#F0ECEC] border border-zinc-800 lg:col-span-2">
                <template #title>
                    <span class="text-sm">Actualizar catálogo</span>
                </template>
                <template #content>
                    <p class="text-xs text-zinc-400 mb-3">
                        Cuando se realice un cambio en las características, pesos o precios base de pilotos, coches o
                        potenciadores en el código, esta acción actualizará los documentos de catálogo en Firestore con
                        los nuevos datos. No afecta a los precios dinámicos por puja ni a las cartas ya adquiridas por
                        los usuarios.
                    </p>
                    <div class="flex justify-end">
                        <Button @click="manejarActualizarCatalogo" :loading="cargandoResiembra"
                            label="Actualizar catálogo" size="small" class="!bg-white !border-white !text-black" />
                    </div>
                </template>
            </Card>

            <div class="border-t border-zinc-800/40 my-4 lg:col-span-2"></div>

            <Card class="!bg-[#1A1A1F] !text-[#F0ECEC] lg:col-span-2">
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
                                    optionValue="email" placeholder="Usuario a eliminar" filter class="flex-1" />
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
