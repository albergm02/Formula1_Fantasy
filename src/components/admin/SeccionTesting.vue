<script setup>
import { ref, onMounted } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/services/servicioFirebase'
import {
    dispararResolucionPujas,
    dispararProcesamientoJornada,
    resetearLiga,
    eliminarLigaComoAdministrador,
} from '@/services/servicioAdministracion'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Select from 'primevue/select'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const toast = useToast()
const confirm = useConfirm()

const cargandoPujas = ref(false)
const cargandoJornada = ref(false)
const cargandoReset = ref(false)
const cargandoEliminacion = ref(false)

const ligas = ref([])
const mercadosDisponibles = ref([])
const mercadoSeleccionado = ref(null)
const ligaAResetear = ref(null)
const ligaAEliminar = ref(null)
const ultimoResultado = ref(null)

async function cargarLigas() {
    const snap = await getDocs(collection(db, 'ligas'))
    ligas.value = snap.docs.map((d) => ({ id: d.id, nombre: d.data().nombre || d.id }))
}

async function cargarMercados() {
    const snap = await getDocs(collection(db, 'mercados'))
    mercadosDisponibles.value = snap.docs.map((d) => ({
        id: d.id,
        estado: d.data().estado,
        label: `${d.id} (${d.data().estado})`,
    }))
}

onMounted(async () => {
    await Promise.all([cargarLigas(), cargarMercados()])
})

async function manejarResolverPujas() {
    if (!mercadoSeleccionado.value) {
        toast.add({
            severity: 'warn',
            summary: 'Selecciona un mercado',
            detail: 'Debes elegir el mercado cuyas pujas quieres resolver.',
            life: 4000,
        })
        return
    }
    cargandoPujas.value = true
    ultimoResultado.value = null
    try {
        const datos = await dispararResolucionPujas(mercadoSeleccionado.value)
        ultimoResultado.value = datos
        toast.add({
            severity: 'success',
            summary: 'Pujas resueltas',
            detail: `Mercado ${datos.idMercado} cerrado.`,
            life: 4000,
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

async function manejarProcesarJornada(opciones = {}) {
    cargandoJornada.value = true
    ultimoResultado.value = null
    try {
        const datos = await dispararProcesamientoJornada(opciones)
        ultimoResultado.value = datos
        if (datos.ok) {
            toast.add({
                severity: 'success',
                summary: opciones.forzar ? 'Jornada reprocesada' : 'Jornada procesada',
                detail: `${datos.nombreGranPremio} · ${datos.participacionesProcesadas} participaciones.`,
                life: 5000,
            })
        } else {
            const motivos = {
                jornada_ya_procesada: 'La jornada ya se procesó previamente.',
                sin_gp_finalizado: 'No hay Gran Premio finalizado en la temporada actual.',
                sin_datos_openf1: `Ningún GP finalizado tiene datos en OpenF1 todavía. Omitidos: ${(datos.omitidos || []).map((o) => o.nombre || o.meeting_key).join(', ') || 'ninguno'}.`,
            }
            toast.add({
                severity: 'info',
                summary: 'Sin cambios',
                detail: motivos[datos.motivo] || `Motivo desconocido: ${datos.motivo}`,
                life: 8000,
            })
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error procesando jornada',
            detail: error.message,
            life: 6000,
        })
    } finally {
        cargandoJornada.value = false
    }
}

function manejarResetearLiga() {
    if (!ligaAResetear.value) {
        toast.add({
            severity: 'warn',
            summary: 'Selecciona una liga',
            detail: 'Debes elegir la liga que quieres resetear.',
            life: 4000,
        })
        return
    }
    const nombreLiga =
        ligas.value.find((l) => l.id === ligaAResetear.value)?.nombre || ligaAResetear.value

    confirm.require({
        message: `Vas a borrar TODOS los mercados, pujas y actividad de "${nombreLiga}", y devolver a 50M / 0 puntos / garaje vacío a todos sus participantes. Esta acción NO se puede deshacer.`,
        header: 'Confirmar reset de liga',
        acceptLabel: 'Sí, resetear',
        rejectLabel: 'Cancelar',
        acceptClass: '!bg-[#E10600] !border-[#E10600]',
        accept: async () => {
            cargandoReset.value = true
            ultimoResultado.value = null
            try {
                const datos = await resetearLiga(ligaAResetear.value)
                ultimoResultado.value = datos
                toast.add({
                    severity: 'success',
                    summary: 'Liga reseteada',
                    detail: `${datos.participacionesReseteadas} participaciones, ${datos.mercadosBorrados} mercados, ${datos.eventosActividadBorrados} eventos.`,
                    life: 5000,
                })
                await cargarMercados()
            } catch (error) {
                toast.add({
                    severity: 'error',
                    summary: 'Error reseteando liga',
                    detail: error.message,
                    life: 6000,
                })
            } finally {
                cargandoReset.value = false
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
        acceptClass: '!bg-red-700 !border-red-700',
        accept: async () => {
            cargandoEliminacion.value = true
            ultimoResultado.value = null
            try {
                const datos = await eliminarLigaComoAdministrador(ligaAEliminar.value)
                ultimoResultado.value = datos
                toast.add({
                    severity: 'success',
                    summary: 'Liga eliminada',
                    detail: `${datos.nombreLiga}: ${datos.participacionesBorradas} participaciones, ${datos.mercadosBorrados} mercados, ${datos.usuariosDesvinculados} usuarios desvinculados.`,
                    life: 6000,
                })
                ligaAEliminar.value = null
                if (ligaAResetear.value === datos.idLiga) ligaAResetear.value = null
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
        <Message severity="info" :closable="false" class="!bg-[#1A1A1F] !border-zinc-700">
            <p class="text-xs">
                Esta sección permite disparar manualmente las tareas programadas del backend para
                validar el comportamiento end-to-end con datos reales. Cada acción ejecuta exactamente
                la misma lógica que el <strong>cron</strong> automático; el resultado se imprime al final
                en formato JSON para contrastarlo con Firestore.
            </p>
        </Message>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card class="!bg-[#1A1A1F] !text-[#F0ECEC] border border-zinc-800">
                <template #title>
                    <span class="text-sm">Resolver pujas</span>
                </template>
                <template #content>
                    <p class="text-xs text-zinc-400 mb-3">
                        Cierra el mercado seleccionado: para cada carta, adjudica la puja más alta al
                        participante con mayor presupuesto disponible, descuenta el importe y entrega
                        el activo a su garaje. Las pujas perdedoras se devuelven al presupuesto.
                        Equivale al cierre nocturno automático.
                    </p>
                    <div class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
                        <Select v-model="mercadoSeleccionado" :options="mercadosDisponibles" optionLabel="label"
                            optionValue="id" placeholder="Selecciona un mercado" filter class="flex-1" />
                        <Button @click="manejarResolverPujas" :loading="cargandoPujas" label="Resolver" size="small"
                            class="!bg-[#E10600] !border-[#E10600]" />
                    </div>
                </template>
            </Card>

            <Card class="!bg-[#1A1A1F] !text-[#F0ECEC] border border-zinc-800">
                <template #title>
                    <span class="text-sm">Procesar jornada del último GP</span>
                </template>
                <template #content>
                    <p class="text-xs text-zinc-400 mb-3">
                        <strong>Procesar:</strong> calcula la puntuación del último Gran Premio finalizado
                        usando datos de OpenF1, suma los puntos a cada participante y actualiza los precios
                        del catálogo. Si la jornada ya se procesó previamente, no hace nada.
                    </p>
                    <p class="text-xs text-zinc-400 mb-3">
                        <strong>Forzar reproceso:</strong> repite el cálculo del último GP aunque ya
                        estuviera procesado, sobrescribiendo puntuaciones y precios. Útil para corregir
                        un cálculo erróneo o probar cambios en la fórmula de puntuación.
                    </p>
                    <div class="flex flex-wrap gap-2">
                        <Button @click="manejarProcesarJornada()" :loading="cargandoJornada" label="Procesar"
                            size="small" class="!bg-[#E10600] !border-[#E10600]" />
                        <Button @click="manejarProcesarJornada({ forzar: true })" :loading="cargandoJornada"
                            label="Forzar reproceso" size="small" severity="warning"
                            class="!bg-amber-600 !border-amber-600" />
                    </div>
                </template>
            </Card>

            <Card class="!bg-[#1A1A1F] !text-[#F0ECEC] border-2 border-red-900/60 lg:col-span-2">
                <template #title>
                    <span class="text-sm text-red-400">Zona peligrosa · Resetear liga</span>
                </template>
                <template #content>
                    <p class="text-xs text-zinc-400 mb-3">
                        Devuelve cada participante de la liga al estado inicial: 50M de presupuesto,
                        0 puntos y garaje vacío. Borra todos los mercados, pujas y eventos de actividad
                        asociados. Pensado para repetir pruebas desde cero sin tener que recrear la liga.
                        <strong class="text-red-400">Acción irreversible.</strong>
                    </p>
                    <div class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
                        <Select v-model="ligaAResetear" :options="ligas" optionLabel="nombre" optionValue="id"
                            placeholder="Liga a resetear" filter class="flex-1" />
                        <Button @click="manejarResetearLiga" :loading="cargandoReset" label="Resetear" size="small"
                            severity="danger" class="!bg-red-700 !border-red-700" />
                    </div>
                </template>
            </Card>

            <Card class="!bg-[#1A1A1F] !text-[#F0ECEC] border-2 border-red-900/60 lg:col-span-2">
                <template #title>
                    <span class="text-sm text-red-400">Zona peligrosa · Eliminar liga</span>
                </template>
                <template #content>
                    <p class="text-xs text-zinc-400 mb-3">
                        Borra <strong>permanentemente</strong> la liga seleccionada: el documento de la
                        liga, todas sus participaciones, mercados, pujas y actividad. Además la desvincula
                        del perfil de cualquier usuario que la tuviera asociada. A diferencia del
                        flujo normal, el administrador global puede eliminar <strong>cualquier liga</strong>,
                        no solo las propias.
                        <strong class="text-red-400">Acción irreversible.</strong>
                    </p>
                    <div class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
                        <Select v-model="ligaAEliminar" :options="ligas" optionLabel="nombre" optionValue="id"
                            placeholder="Liga a eliminar" filter class="flex-1" />
                        <Button @click="manejarEliminarLiga" :loading="cargandoEliminacion" label="Eliminar"
                            size="small" severity="danger" class="!bg-red-700 !border-red-700" />
                    </div>
                </template>
            </Card>
        </div>

        <Message v-if="ultimoResultado" severity="info" :closable="false" class="!bg-[#1A1A1F] !border-zinc-700">
            <pre class="text-xs overflow-auto max-h-60">{{ JSON.stringify(ultimoResultado, null, 2) }}</pre>
        </Message>
    </div>
</template>
