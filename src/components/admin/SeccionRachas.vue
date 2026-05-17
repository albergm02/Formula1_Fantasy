<script setup>
import { ref, onMounted, computed } from 'vue'
import {
    obtenerRachasPilotos,
    guardarRachasPilotos,
    obtenerRachasCoches,
    guardarRachasCoches,
} from '@/services/servicioAdministracion'
import { pilotosBase } from '@/data/bases/pilotosBase'
import { cochesBase } from '@/data/bases/cochesBase'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputNumber from 'primevue/inputnumber'
import { useToast } from 'primevue/usetoast'

const toast = useToast()

const cargandoRachas = ref(false)
const guardandoRachas = ref(false)
const cargandoRachasCoches = ref(false)
const guardandoRachasCoches = ref(false)

const rachasPorPiloto = ref({})
const rachasPorCoche = ref({})

const pilotosOrdenados = computed(() =>
    [...pilotosBase].sort(
        (a, b) => a.equipo.localeCompare(b.equipo) || a.nombre.localeCompare(b.nombre),
    ),
)

const cochesOrdenados = computed(() =>
    [...cochesBase].sort((a, b) => a.nombre.localeCompare(b.nombre)),
)

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

async function cargarRachasCochesUI() {
    cargandoRachasCoches.value = true
    try {
        const datos = await obtenerRachasCoches()
        const mapaInicial = {}
        for (const coche of cochesBase) {
            mapaInicial[coche.id] = Number(datos.rachas?.[coche.id] || 0)
        }
        rachasPorCoche.value = mapaInicial
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error cargando rachas de coches',
            detail: error.message,
            life: 5000,
        })
    } finally {
        cargandoRachasCoches.value = false
    }
}

async function manejarGuardarRachasCoches() {
    guardandoRachasCoches.value = true
    try {
        const datos = await guardarRachasCoches(rachasPorCoche.value)
        toast.add({
            severity: 'success',
            summary: 'Rachas guardadas',
            detail: `${Object.keys(datos.rachas).length} coches con racha activa.`,
            life: 4000,
        })
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error guardando rachas de coches',
            detail: error.message,
            life: 6000,
        })
    } finally {
        guardandoRachasCoches.value = false
    }
}

onMounted(async () => {
    await Promise.all([cargarRachas(), cargarRachasCochesUI()])
})
</script>

<template>
    <div class="space-y-4">
        <Card class="!bg-[#1A1A1F] !text-[#F0ECEC] border border-zinc-800">
            <template #title>
                <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 text-sm">
                        <i class="pi pi-chart-line text-[#E10600]" />
                        <span>Rachas de pilotos</span>
                    </div>
                    <Button @click="manejarGuardarRachas" :loading="guardandoRachas" icon="pi pi-save" label="Guardar"
                        size="small" class="!bg-[#E10600] !border-[#E10600] hover:!bg-red-700" />
                </div>
            </template>
            <template #content>
                <p class="text-xs text-zinc-500 mb-3">
                    Cada punto de racha suma <strong class="text-[#E10600]">+0,5M</strong> al precio del piloto
                    en el siguiente mercado y <strong class="text-[#E10600]">+1 punto</strong> a su puntuación
                    de jornada. Aplica a todas sus variantes.
                </p>
                <div v-if="cargandoRachas" class="text-sm text-zinc-500">Cargando rachas…</div>
                <div v-else
                    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[420px] overflow-y-auto pr-2">
                    <div v-for="piloto in pilotosOrdenados" :key="piloto.numero"
                        class="flex items-center gap-2 p-2 bg-black/30 border border-zinc-800">
                        <img :src="piloto.imagen" :alt="piloto.nombre"
                            class="w-9 h-9 object-cover border border-zinc-700" />
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
            </template>
        </Card>

        <Card class="!bg-[#1A1A1F] !text-[#F0ECEC] border border-zinc-800">
            <template #title>
                <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 text-sm">
                        <i class="pi pi-car text-[#E10600]" />
                        <span>Rachas de coches</span>
                    </div>
                    <Button @click="manejarGuardarRachasCoches" :loading="guardandoRachasCoches" icon="pi pi-save"
                        label="Guardar" size="small" class="!bg-[#E10600] !border-[#E10600] hover:!bg-red-700" />
                </div>
            </template>
            <template #content>
                <p class="text-xs text-zinc-500 mb-3">
                    Cada punto de racha suma <strong class="text-[#E10600]">+0,5M</strong> al precio del coche
                    en el siguiente mercado y <strong class="text-[#E10600]">+1 punto</strong> a su puntuación
                    de jornada.
                </p>
                <div v-if="cargandoRachasCoches" class="text-sm text-zinc-500">Cargando rachas…</div>
                <div v-else
                    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[420px] overflow-y-auto pr-2">
                    <div v-for="coche in cochesOrdenados" :key="coche.id"
                        class="flex items-center gap-2 p-2 bg-black/30 border border-zinc-800">
                        <img :src="coche.imagen" :alt="coche.nombre"
                            class="w-12 h-9 object-cover border border-zinc-700" />
                        <div class="flex-1 min-w-0">
                            <div class="text-xs font-bold text-white truncate">{{ coche.nombre }}</div>
                            <div class="text-[10px] text-zinc-500 uppercase">{{ coche.id }}</div>
                        </div>
                        <InputNumber v-model="rachasPorCoche[coche.id]" showButtons buttonLayout="horizontal" :step="1"
                            :min="-20" :max="20" decrementButtonClass="!w-7 !h-7" incrementButtonClass="!w-7 !h-7"
                            inputClass="!w-12 !text-center !text-xs" incrementButtonIcon="pi pi-plus"
                            decrementButtonIcon="pi pi-minus" />
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>
