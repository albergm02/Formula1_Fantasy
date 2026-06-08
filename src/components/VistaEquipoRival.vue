<script setup>
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

import { calcularPrecioClausula, estaEnPeriodoDeGracia, horasRestantesDeGracia } from '@/services/servicioClausulas'
import { usarStoreGaraje } from '@/stores/storeGaraje'
import { usarBloqueoJornada } from '@/composables/usarBloqueoJornada'

import Button from 'primevue/button'
import TarjetaPiloto from '@/components/TarjetaPiloto.vue'
import TarjetaCoche from '@/components/TarjetaCoche.vue'
import TarjetaPotenciador from '@/components/TarjetaPotenciador.vue'

const props = defineProps({
    participacion: {
        type: Object,
        required: true,
    },
})

defineEmits(['cerrar'])

const storeGaraje = usarStoreGaraje()
const notificacion = useToast()
const confirmar = useConfirm()

const { jornadaIniciada, mensajeBloqueoJornada } = usarBloqueoJornada()

/**
 * Determina si el botón de fichar por cláusula está deshabilitado.
 * @param {Object} elemento - Carta del garaje rival.
 * @returns {boolean}
 */
const esFichajeDeshabilitado = (elemento) => {
    if (jornadaIniciada.value) return true
    if (estaEnPeriodoDeGracia(elemento)) return true

    const precioClausula = calcularPrecioClausula(elemento)
    if (precioClausula > storeGaraje.presupuesto) return true

    return false
}

/**
 * Solicita confirmación antes de ejecutar la cláusula de rescisión de una carta rival.
 * @param {Object} elemento - Carta del garaje rival a fichar.
 */
const confirmarEjecucionClausula = (elemento) => {
    if (jornadaIniciada.value) {
        notificacion.add({ severity: 'warn', summary: 'Jornada sin procesar', detail: mensajeBloqueoJornada, life: 4000 })
        return
    }
    const precioClausula = calcularPrecioClausula(elemento)

    confirmar.require({
        icon: 'pi pi-shield',
        message: `¿Pagar ${precioClausula.toFixed(1)}M de cláusula para fichar a ${elemento.nombre}?`,
        header: 'Ejecutar Cláusula',
        acceptLabel: 'Sí, fichar',
        rejectLabel: 'Cancelar',
        accept: async () => {
            const resultado = await storeGaraje.ejecutarClausulaRival(
                props.participacion.id,
                elemento,
            )

            if (resultado.success) {
                notificacion.add({ severity: 'success', summary: 'Cláusula ejecutada', detail: resultado.message, life: 4000 })
            } else {
                notificacion.add({ severity: 'warn', summary: 'Cláusula denegada', detail: resultado.message, life: 5000 })
            }
        },
    })
}
</script>

<template>
    <div class="flex flex-col gap-6 p-4 max-w-lg mx-auto ">
        <div v-if="jornadaIniciada"
            class="px-3 py-2 bg-yellow-900/20 text-[10px] font-black uppercase tracking-widest text-yellow-400 text-center">
            {{ mensajeBloqueoJornada }}
        </div>
        <div class="flex items-center justify-between border-b border-zinc-700 pb-3">
            <div class="flex flex-col">
                <span class="text-lg font-black uppercase text-white">{{ participacion.nombreUsuario }}</span>
                <span class="text-xs text-zinc-400">Equipo rival</span>
            </div>
            <div class="flex gap-4 items-center">
                <div class="flex flex-col items-center">
                    <span class="text-xl font-black text-[#D4A843]">{{ participacion.puntos }}</span>
                    <span class="text-[10px] font-bold uppercase text-zinc-400">PTS</span>
                </div>
            </div>
        </div>

        <!-- Resumen última jornada -->
        <section v-if="participacion.ultimaJornada" class="flex flex-col gap-2 p-3 bg-[#121218] border border-zinc-800">
            <div class="flex items-center justify-between">
                <div class="flex flex-col">
                    <span class="text-[10px] font-black uppercase tracking-widest text-zinc-500">Última jornada</span>
                    <span class="text-sm font-bold text-white">{{ participacion.ultimaJornada.nombreGranPremio }}</span>
                </div>
                <span class="text-2xl font-black text-[#D4A843]">+{{ participacion.ultimaJornada.puntosJornada }}</span>
            </div>
            <div v-if="participacion.ultimaJornada.sinergias?.length" class="flex flex-wrap gap-1.5">
                <span v-for="(sinergia, idx) in participacion.ultimaJornada.sinergias" :key="idx"
                    class="px-2 py-0.5 bg-emerald-900/20 border border-emerald-500/40 text-[9px] font-black uppercase tracking-wider text-emerald-400">
                    {{ sinergia.nombre }} +{{ Math.round(sinergia.bonus * 100) }}%
                </span>
            </div>
        </section>

        <section v-if="participacion.garaje.coches && participacion.garaje.coches.length">
            <h3 class="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Coches</h3>
            <div class="flex flex-col gap-3">
                <div v-for="coche in participacion.garaje.coches" :key="coche.instancia_id" class="flex flex-col">
                    <TarjetaCoche :coche="coche" />
                    <div class="flex items-center justify-between py-1.5">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-shield text-[10px] text-amber-400"></i>
                            <span class="text-[10px] font-black uppercase tracking-widest text-amber-400">
                                Cláusula: {{ calcularPrecioClausula(coche).toFixed(1) }}M
                            </span>
                        </div>
                        <span v-if="estaEnPeriodoDeGracia(coche)"
                            class="px-2 py-0.5 bg-emerald-900/30 border border-emerald-500/50 text-[9px] font-bold uppercase text-emerald-400">
                            Protegida - {{ horasRestantesDeGracia(coche) }}h
                        </span>
                    </div>
                    <Button :label="`FICHAR ${calcularPrecioClausula(coche).toFixed(1)}M`" icon="pi pi-shield"
                        @click="confirmarEjecucionClausula(coche)" :disabled="esFichajeDeshabilitado(coche)"
                        class="w-full !bg-[#121218] !border-zinc-800 shadow-lg transition-colors" :pt="{
                            label: { class: 'text-[10px] font-black uppercase tracking-widest text-zinc-400' },
                            icon: { class: '!text-amber-400' },
                        }" />
                </div>
            </div>
        </section>

        <section v-if="participacion.garaje.pilotos.length">
            <h3 class="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Pilotos</h3>
            <div class="flex flex-col gap-3">
                <div v-for="piloto in participacion.garaje.pilotos" :key="piloto.instancia_id" class="flex flex-col">
                    <TarjetaPiloto :piloto="piloto" />
                    <div class="flex items-center justify-between py-1.5">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-shield text-[10px] text-amber-400"></i>
                            <span class="text-[10px] font-black uppercase tracking-widest text-amber-400">
                                Cláusula: {{ calcularPrecioClausula(piloto).toFixed(1) }}M
                            </span>
                        </div>
                        <span v-if="estaEnPeriodoDeGracia(piloto)"
                            class="px-2 py-0.5 bg-emerald-900/30 border border-emerald-500/50 text-[9px] font-bold uppercase text-emerald-400">
                            Protegida - {{ horasRestantesDeGracia(piloto) }}h
                        </span>
                    </div>
                    <Button :label="`FICHAR ${calcularPrecioClausula(piloto).toFixed(1)}M`" icon="pi pi-shield"
                        @click="confirmarEjecucionClausula(piloto)" :disabled="esFichajeDeshabilitado(piloto)"
                        class="w-full !bg-[#121218] !border-zinc-800 shadow-lg transition-colors" :pt="{
                            label: { class: 'text-[10px] font-black uppercase tracking-widest text-zinc-400' },
                            icon: { class: '!text-amber-400' },
                        }" />
                </div>
            </div>
        </section>

        <section v-if="participacion.garaje.potenciadores.length">
            <h3 class="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Potenciadores</h3>
            <div class="flex flex-col gap-3">
                <div v-for="potenciador in participacion.garaje.potenciadores" :key="potenciador.instancia_id"
                    class="flex flex-col">
                    <TarjetaPotenciador :potenciador="potenciador" />
                </div>
            </div>
        </section>

        <div v-if="(!participacion.garaje.coches || !participacion.garaje.coches.length) && !participacion.garaje.pilotos.length && !participacion.garaje.potenciadores.length"
            class="flex flex-col items-center py-10 gap-2">
            <p class="text-sm text-zinc-500">Este jugador aún no tiene cartas en su garaje.</p>
        </div>
    </div>
</template>
