<script setup>
/**
 * TourOnboarding.vue — Recorrido guiado interactivo.
 *
 * Renderiza un overlay oscuro con un "spotlight" sobre el elemento
 * apuntado por el paso activo (`data-tour`) y un tooltip explicativo
 * con controles para avanzar, retroceder o cerrar el tutorial.
 *
 * Localiza los elementos consultando el DOM por selector de atributo;
 * recalcula posiciones al cambiar de paso y al redimensionar la ventana.
 */
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import Button from 'primevue/button'
import { usarStoreOnboarding } from '@/stores/storeOnboarding'

const storeOnboarding = usarStoreOnboarding()

const rectanguloObjetivo = ref(null)

const PADDING_RESALTADO = 8
const MARGEN_TOOLTIP = 12
const ANCHO_TOOLTIP = 320

const estiloResaltado = computed(() => {
    if (!rectanguloObjetivo.value) return { display: 'none' }
    const rect = rectanguloObjetivo.value
    return {
        top: `${rect.top - PADDING_RESALTADO}px`,
        left: `${rect.left - PADDING_RESALTADO}px`,
        width: `${rect.width + PADDING_RESALTADO * 2}px`,
        height: `${rect.height + PADDING_RESALTADO * 2}px`,
    }
})

const estiloTooltip = computed(() => {
    const anchoVentana = window.innerWidth
    const altoVentana = window.innerHeight

    if (!rectanguloObjetivo.value) {
        return {
            top: `${altoVentana / 2 - 100}px`,
            left: `${anchoVentana / 2 - ANCHO_TOOLTIP / 2}px`,
            width: `${Math.min(ANCHO_TOOLTIP, anchoVentana - 32)}px`,
        }
    }

    const rect = rectanguloObjetivo.value
    const ancho = Math.min(ANCHO_TOOLTIP, anchoVentana - 32)

    const espacioAbajo = altoVentana - (rect.bottom + MARGEN_TOOLTIP)
    const colocarArriba = espacioAbajo < 200 && rect.top > 220

    const top = colocarArriba
        ? rect.top - MARGEN_TOOLTIP - 200
        : rect.bottom + MARGEN_TOOLTIP

    let left = rect.left + rect.width / 2 - ancho / 2
    if (left < 16) left = 16
    if (left + ancho > anchoVentana - 16) left = anchoVentana - 16 - ancho

    return {
        top: `${Math.max(16, top)}px`,
        left: `${left}px`,
        width: `${ancho}px`,
    }
})

const localizarObjetivo = async () => {
    await nextTick()
    const objetivo = storeOnboarding.pasoActual?.objetivo
    if (!objetivo) {
        rectanguloObjetivo.value = null
        return
    }
    const elemento = document.querySelector(`[data-tour="${objetivo}"]`)
    if (!elemento) {
        rectanguloObjetivo.value = null
        return
    }
    elemento.scrollIntoView({ behavior: 'smooth', block: 'center' })
    await new Promise((resolve) => setTimeout(resolve, 250))
    rectanguloObjetivo.value = elemento.getBoundingClientRect()
}

const recalcularAlRedimensionar = () => {
    localizarObjetivo()
}

watch(
    () => [storeOnboarding.activo, storeOnboarding.indicePaso],
    () => {
        if (storeOnboarding.activo) localizarObjetivo()
    },
)

onMounted(() => {
    window.addEventListener('resize', recalcularAlRedimensionar)
})

onUnmounted(() => {
    window.removeEventListener('resize', recalcularAlRedimensionar)
})
</script>

<template>
    <Teleport to="body">
        <div v-if="storeOnboarding.activo" class="fixed inset-0 z-[9999] pointer-events-none">
            <!-- Velo oscuro con agujero recortado mediante box-shadow -->
            <div v-if="rectanguloObjetivo" class="fixed rounded-lg pointer-events-none transition-all duration-300"
                :style="estiloResaltado"
                style="box-shadow: 0 0 0 9999px rgba(12, 12, 14, 0.82); outline: 2px solid #E10600;"></div>

            <!-- Velo plano cuando no hay objetivo (paso de bienvenida/cierre) -->
            <div v-else class="fixed inset-0 pointer-events-auto" style="background: rgba(12, 12, 14, 0.82);"
                @click.self="storeOnboarding.terminar"></div>

            <!-- Tarjeta tooltip -->
            <div class="fixed pointer-events-auto bg-[#1A1A1F] border border-[#E10600] rounded-lg shadow-2xl p-4 transition-all duration-300"
                :style="estiloTooltip">
                <div class="flex items-start justify-between gap-2 mb-2">
                    <h3 class="text-[#D4A843] font-black uppercase tracking-wide text-sm">
                        {{ storeOnboarding.pasoActual?.titulo }}
                    </h3>
                    <button @click="storeOnboarding.terminar" aria-label="Cerrar tutorial"
                        class="text-zinc-400 hover:text-[#E10600] cursor-pointer bg-transparent border-none p-0 leading-none">
                        <i class="pi pi-times text-sm"></i>
                    </button>
                </div>

                <p class="text-[#F0ECEC] text-sm leading-relaxed mb-3">
                    {{ storeOnboarding.pasoActual?.texto }}
                </p>

                <div class="flex items-center justify-between gap-2">
                    <span class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                        Paso {{ storeOnboarding.indicePaso + 1 }} / {{ storeOnboarding.totalPasos }}
                    </span>
                    <div class="flex gap-2">
                        <Button v-if="!storeOnboarding.esPrimerPaso" label="Atrás" size="small" severity="secondary"
                            outlined @click="storeOnboarding.retroceder" />
                        <Button :label="storeOnboarding.esUltimoPaso ? 'Finalizar' : 'Siguiente'" size="small"
                            @click="storeOnboarding.avanzar"
                            class="!bg-[#E10600] !border-[#E10600] hover:!bg-red-700 !text-white" />
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>
