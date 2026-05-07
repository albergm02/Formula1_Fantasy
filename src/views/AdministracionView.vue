<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/services/servicioFirebase'
import { cerrarSesion } from '@/services/servicioAutenticacion'
import {
    dispararGeneracionMercado,
    dispararResolucionPujas,
    dispararProcesamientoJornada,
    resetearLiga,
    obtenerRachasPilotos,
    guardarRachasPilotos,
} from '@/services/servicioAdministracion'
import { pilotosBase } from '@/data/bases/pilotosBase'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import InputNumber from 'primevue/inputnumber'
import Message from 'primevue/message'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const enrutador = useRouter()
const toast = useToast()
const confirm = useConfirm()

const cargandoMercado = ref(false)
const cargandoPujas = ref(false)
const cargandoJornada = ref(false)
const cargandoReset = ref(false)
const cargandoRachas = ref(false)
const guardandoRachas = ref(false)

const ligas = ref([])
const ligaSeleccionada = ref(null)
const forzarRegeneracion = ref(false)
const mercadoSeleccionado = ref(null)
const mercadosDisponibles = ref([])
const ligaAResetear = ref(null)
const rachasPorPiloto = ref({})

const ultimoResultado = ref(null)

const fechaHoy = computed(() => new Date().toISOString().slice(0, 10))

const pilotosOrdenados = computed(() =>
    [...pilotosBase].sort((a, b) => a.equipo.localeCompare(b.equipo) || a.nombre.localeCompare(b.nombre)),
)

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
    await Promise.all([cargarLigas(), cargarMercados(), cargarRachas()])
})

async function cargarRachas() {
    cargandoRachas.value = true
    try {
        const datos = await obtenerRachasPilotos()
        const mapaInicial = {}
        for (const piloto of pilotosBase) {
            mapaInicial[piloto.numero] = Number(datos.rachas?.[piloto.numero] || 0)
        }
        rachasPorPiloto.value = mapaInicial
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error cargando rachas',
            detail: error.message,
            life: 5000,
        })
    } finally {
        cargandoRachas.value = false
    }
}

async function manejarGuardarRachas() {
    guardandoRachas.value = true
    try {
        const datos = await guardarRachasPilotos(rachasPorPiloto.value)
        toast.add({
            severity: 'success',
            summary: 'Rachas guardadas',
            detail: `${Object.keys(datos.rachas).length} pilotos con racha activa.`,
            life: 4000,
        })
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error guardando rachas',
            detail: error.message,
            life: 6000,
        })
    } finally {
        guardandoRachas.value = false
    }
}

async function manejarGenerarMercado() {
    cargandoMercado.value = true
    ultimoResultado.value = null
    try {
        const datos = await dispararGeneracionMercado(
            ligaSeleccionada.value || undefined,
            { forzar: forzarRegeneracion.value },
        )
        ultimoResultado.value = datos
        toast.add({
            severity: 'success',
            summary: 'Mercado generado',
            detail: `${datos.resultados.length} liga(s) procesada(s).`,
            life: 4000,
        })
        await cargarMercados()
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error generando mercado',
            detail: error.message,
            life: 6000,
        })
    } finally {
        cargandoMercado.value = false
    }
}

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
                sin_datos_openf1: `Ningún GP finalizado tiene datos en OpenF1 todavía. Omitidos: ${(datos.omitidos || []).map(o => o.nombre || o.meeting_key).join(', ') || 'ninguno'}.`,
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

async function manejarCerrarSesion() {
    await cerrarSesion()
    enrutador.push({ name: 'login' })
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
        icon: 'pi pi-exclamation-triangle',
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
</script>

<template>
    <div class="min-h-screen bg-[#0C0C0E] text-[#F0ECEC] flex flex-col">
        <Toast position="bottom-right" />
        <ConfirmDialog />

        <header class="w-full p-3 flex justify-between sticky top-0 z-40 bg-[#1A1A1F] border-b border-[#E10600]">
            <div class="flex items-center gap-2">
                <img src="/logo.png" class="h-8 w-8 object-contain" />
                <span class="font-black italic text-[#E10600] text-lg">F1 FANTASY · ADMIN</span>
            </div>
            <Button @click="manejarCerrarSesion" icon="pi pi-sign-out" text
                class="!text-zinc-400 hover:!text-red-500 cursor-pointer" />
        </header>

        <main class="flex-1 p-4 max-w-4xl mx-auto w-full space-y-4">
            <h1 class="text-2xl font-bold">Panel de testing</h1>
            <p class="text-zinc-400 text-sm">
                Disparo manual de procesos automatizados. Generar mercado siembra automáticamente
                el catálogo si todavía no existe en Firestore.
            </p>

            <Card class="!bg-[#1A1A1F] !text-[#F0ECEC] border border-zinc-800">
                <template #title>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-shopping-cart text-[#E10600]" />
                        <span>Generar mercado diario</span>
                    </div>
                </template>
                <template #content>
                    <p class="text-sm text-zinc-400 mb-3">
                        Crea el mercado <code class="text-[#E10600]">{{ fechaHoy }}</code> y cierra/resuelve
                        el del día anterior. Si el catálogo no existe, se siembra automáticamente antes.
                        Idempotente salvo que marques "Forzar regeneración".
                    </p>
                    <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                        <div class="flex-1 w-full">
                            <label class="text-xs text-zinc-500 block mb-1">
                                Liga (opcional — si no eliges, se procesan todas)
                            </label>
                            <Select v-model="ligaSeleccionada" :options="ligas" optionLabel="nombre" optionValue="id"
                                placeholder="Todas las ligas" showClear class="w-full" />
                        </div>
                        <Button @click="manejarGenerarMercado" :loading="cargandoMercado" icon="pi pi-play"
                            label="Generar mercado" class="!bg-[#E10600] !border-[#E10600] hover:!bg-red-700" />
                    </div>
                    <div class="flex items-center gap-2 mt-3">
                        <Checkbox v-model="forzarRegeneracion" inputId="forzarRegen" binary />
                        <label for="forzarRegen" class="text-xs text-zinc-400 cursor-pointer">
                            Forzar regeneración (borra el mercado de hoy y sus pujas antes de crearlo)
                        </label>
                    </div>
                </template>
            </Card>

            <Card class="!bg-[#1A1A1F] !text-[#F0ECEC] border border-zinc-800">
                <template #title>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-gavel text-[#E10600]" />
                        <span>Resolver pujas de un mercado</span>
                    </div>
                </template>
                <template #content>
                    <p class="text-sm text-zinc-400 mb-3">
                        Adjudica las cartas al mejor postor, descuenta presupuesto y cierra el mercado.
                    </p>
                    <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                        <div class="flex-1 w-full">
                            <label class="text-xs text-zinc-500 block mb-1">Mercado</label>
                            <Select v-model="mercadoSeleccionado" :options="mercadosDisponibles" optionLabel="label"
                                optionValue="id" placeholder="Selecciona un mercado" filter class="w-full" />
                        </div>
                        <Button @click="manejarResolverPujas" :loading="cargandoPujas" icon="pi pi-check-circle"
                            label="Resolver pujas" class="!bg-[#E10600] !border-[#E10600] hover:!bg-red-700" />
                    </div>
                </template>
            </Card>

            <Card class="!bg-[#1A1A1F] !text-[#F0ECEC] border border-zinc-800">
                <template #title>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-flag-fill text-[#E10600]" />
                        <span>Procesar jornada del último GP</span>
                    </div>
                </template>
                <template #content>
                    <p class="text-sm text-zinc-400 mb-3">
                        Recopila datos de OpenF1, calcula puntos para todas las participaciones y
                        actualiza la clasificación.
                    </p>
                    <div class="flex flex-wrap gap-2">
                        <Button @click="manejarProcesarJornada()" :loading="cargandoJornada" icon="pi pi-bolt"
                            label="Procesar jornada" class="!bg-[#E10600] !border-[#E10600] hover:!bg-red-700" />
                        <Button @click="manejarProcesarJornada({ forzar: true })" :loading="cargandoJornada"
                            icon="pi pi-refresh" label="Forzar reproceso" severity="warning"
                            class="!bg-amber-600 !border-amber-600 hover:!bg-amber-700" />
                    </div>
                </template>
            </Card>

            <Card class="!bg-[#1A1A1F] !text-[#F0ECEC] border border-zinc-800">
                <template #title>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-chart-line text-[#E10600]" />
                        <span>Rachas de pilotos</span>
                    </div>
                </template>
                <template #content>
                    <p class="text-sm text-zinc-400 mb-3">
                        Cada punto de racha suma <strong class="text-[#E10600]">+0,5M</strong> al precio del piloto
                        en el siguiente mercado generado y <strong class="text-[#E10600]">+1 punto</strong> a su
                        puntuación de jornada. Acepta valores negativos. Aplica a todas las variantes del piloto.
                    </p>
                    <div v-if="cargandoRachas" class="text-sm text-zinc-500">Cargando rachas…</div>
                    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-2">
                        <div v-for="piloto in pilotosOrdenados" :key="piloto.numero"
                            class="flex items-center gap-2 p-2 bg-black/30 border border-zinc-800">
                            <img :src="piloto.imagen" :alt="piloto.nombre"
                                class="w-10 h-10 object-cover border border-zinc-700" />
                            <div class="flex-1 min-w-0">
                                <div class="text-xs font-bold text-white truncate">{{ piloto.nombre }}</div>
                                <div class="text-[10px] text-zinc-500 uppercase">{{ piloto.equipo }}</div>
                            </div>
                            <InputNumber v-model="rachasPorPiloto[piloto.numero]" showButtons buttonLayout="horizontal"
                                :step="1" :min="-20" :max="20" decrementButtonClass="!w-7 !h-7"
                                incrementButtonClass="!w-7 !h-7" inputClass="!w-12 !text-center !text-xs"
                                incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus" />
                        </div>
                    </div>
                    <Button @click="manejarGuardarRachas" :loading="guardandoRachas" icon="pi pi-save"
                        label="Guardar rachas" class="!bg-[#E10600] !border-[#E10600] hover:!bg-red-700 mt-3" />
                </template>
            </Card>

            <Card class="!bg-[#1A1A1F] !text-[#F0ECEC] border-2 border-red-900/60">
                <template #title>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-exclamation-triangle text-red-500" />
                        <span class="text-red-400">Zona peligrosa · Resetear liga</span>
                    </div>
                </template>
                <template #content>
                    <p class="text-sm text-zinc-400 mb-3">
                        Devuelve a TODOS los participantes de la liga a su estado inicial:
                        <strong class="text-red-400">presupuesto 50M, 0 puntos, garaje vacío</strong>.
                        Borra mercados, pujas y actividad. <strong>Irreversible.</strong>
                    </p>
                    <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                        <div class="flex-1 w-full">
                            <label class="text-xs text-zinc-500 block mb-1">Liga a resetear</label>
                            <Select v-model="ligaAResetear" :options="ligas" optionLabel="nombre" optionValue="id"
                                placeholder="Selecciona una liga" filter class="w-full" />
                        </div>
                        <Button @click="manejarResetearLiga" :loading="cargandoReset" icon="pi pi-trash"
                            label="Resetear liga" severity="danger"
                            class="!bg-red-700 !border-red-700 hover:!bg-red-800" />
                    </div>
                </template>
            </Card>

            <Message v-if="ultimoResultado" severity="info" :closable="false" class="!bg-[#1A1A1F] !border-zinc-700">
                <pre class="text-xs overflow-auto max-h-72">{{ JSON.stringify(ultimoResultado, null, 2) }}</pre>
            </Message>
        </main>
    </div>
</template>