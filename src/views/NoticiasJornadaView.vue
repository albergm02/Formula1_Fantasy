<script setup>
/**
 * Vista de explicación pública de la última jornada procesada.
 * Lista todos los pilotos con los datos crudos extraídos de OpenF1
 * (qualy, carrera, salida, adelantamientos, paradas, mejor stint) y, al
 * desplegar uno, muestra cuántos puntos habría sumado bajo cada variante.
 *
 * Objetivo didáctico: que el usuario entienda de dónde vienen los puntos
 * y por qué un mismo piloto rinde de forma muy distinta según su variante.
 */

import { onMounted, onUnmounted, ref, computed } from 'vue'
import Card from 'primevue/card'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Cabecera from '@/components/Cabecera.vue'
import BarraNavegacion from '@/components/BarraNavegacion.vue'
import { suscribirseUltimaJornada } from '@/services/servicioJornada'
import { pilotosBase } from '@/data/bases/pilotosBase'
import { perfilesPuntuacion } from '@/data/perfilesPuntuacion'
import { calcularFactorJornada, calcularPuntosJornada } from '@/utils/puntuacion'

const VARIANTES = [
    { id: 'qualy', etiqueta: 'Qualy', icono: 'pi-stopwatch', color: '#38bdf8' },
    { id: 'carrera', etiqueta: 'Carrera', icono: 'pi-flag-fill', color: '#f97316' },
    { id: 'todo_terreno', etiqueta: 'Todo Terreno', icono: 'pi-cloud', color: '#a78bfa' },
    { id: 'remontador', etiqueta: 'Remontador', icono: 'pi-arrow-up', color: '#ef4444' },
    { id: 'estratega', etiqueta: 'Estratega', icono: 'pi-chart-bar', color: '#10b981' },
    { id: 'base', etiqueta: 'Base', icono: 'pi-user', color: '#a1a1aa' },
]

const jornada = ref(null)
const cargando = ref(true)
const pilotoExpandido = ref(null)
let cancelarSuscripcion = null

onMounted(() => {
    cancelarSuscripcion = suscribirseUltimaJornada((datos) => {
        jornada.value = datos
        cargando.value = false
    })
})

onUnmounted(() => {
    if (cancelarSuscripcion) cancelarSuscripcion()
})

const hayJornada = computed(() => Boolean(jornada.value && jornada.value.actuacionesPorPiloto))

const filasPilotos = computed(() => {
    if (!hayJornada.value) return []

    const actuaciones = jornada.value.actuacionesPorPiloto
    const filas = []

    for (const pilotoBase of pilotosBase) {
        const actuacion = actuaciones[pilotoBase.numero]
        if (!actuacion) continue

        filas.push({
            numero: pilotoBase.numero,
            nombre: pilotoBase.nombre,
            equipo: pilotoBase.equipo,
            imagen: pilotoBase.imagen,
            atributos: pilotoBase.atributos,
            actuacion,
        })
    }

    return filas.sort((a, b) => a.actuacion.posicionCarrera - b.actuacion.posicionCarrera)
})

const condicionesTexto = computed(() => {
    if (!hayJornada.value) return []
    const c = jornada.value.condiciones || {}
    const etiquetas = []
    if (c.llovio) etiquetas.push({ texto: 'Lluvia', icono: 'pi-cloud', color: 'text-blue-400' })
    else etiquetas.push({ texto: 'Seco', icono: 'pi-sun', color: 'text-amber-300' })
    if (c.numeroSafetyCarActivos > 0)
        etiquetas.push({
            texto: `${c.numeroSafetyCarActivos} Safety Car`,
            icono: 'pi-exclamation-triangle',
            color: 'text-amber-400',
        })
    if (c.numeroVirtualSafetyCarActivos > 0)
        etiquetas.push({
            texto: `${c.numeroVirtualSafetyCarActivos} VSC`,
            icono: 'pi-exclamation-circle',
            color: 'text-yellow-400',
        })
    if (c.numeroDNFs > 0)
        etiquetas.push({
            texto: `${c.numeroDNFs} DNFs`,
            icono: 'pi-times-circle',
            color: 'text-red-400',
        })
    return etiquetas
})

function alternarPiloto(numero) {
    pilotoExpandido.value = pilotoExpandido.value === numero ? null : numero
}

function calcularPuntuacionBaseVariante(atributos, perfil) {
    const pesos = perfilesPuntuacion[perfil].pesos
    const valor =
        (pesos.ritmo || 0) * atributos.ritmo +
        (pesos.consistencia || 0) * atributos.consistencia +
        (pesos.adaptabilidad || 0) * atributos.adaptabilidad +
        (pesos.agresividad || 0) * (atributos.agresividad || 0) +
        (pesos.gestion || 0) * (atributos.gestion || 0)
    return Math.round(valor * 10) / 10
}

function obtenerSimulacionVariantes(piloto) {
    const condiciones = jornada.value.condiciones || {}
    return VARIANTES.map((variante) => {
        const puntuacionBase = calcularPuntuacionBaseVariante(piloto.atributos, variante.id)
        const factor = calcularFactorJornada(piloto.actuacion, condiciones, variante.id)
        const puntos = calcularPuntosJornada(puntuacionBase, factor)
        return { ...variante, puntuacionBase, factor, puntos }
    })
}

function formatearPosicion(posicion) {
    if (!posicion || posicion >= 99) return '—'
    return `P${posicion}`
}

function formatearPorcentaje(valor) {
    if (valor == null) return '—'
    return `${Math.round(valor * 100)}%`
}
</script>

<template>
    <div class="min-h-screen pb-24 font-sans">
        <Cabecera />

        <main class="flex flex-col w-full max-w-3xl mx-auto mt-2 p-4 gap-4">

            <!-- Cabecera de sección -->
            <div class="flex items-center gap-2 pb-2 border-b border-[#FFFFFF]/10">
                <i class="pi pi-megaphone text-[#E10600] text-base"></i>
                <h2 class="text-sm font-black uppercase tracking-widest text-white">
                    Resultados de la jornada
                </h2>
            </div>
            <!-- Cargando -->
            <div v-if="cargando" class="flex justify-center py-16">
                <ProgressSpinner stroke-width="3" />
            </div>

            <!-- Sin jornada -->
            <Message v-else-if="!hayJornada" severity="info" :closable="false">
                Aún no hay ninguna jornada procesada. Vuelve tras el próximo Gran Premio para descubrir
                cómo ha puntuado cada piloto.
            </Message>

            <!-- Resumen del GP -->
            <Card v-else :pt="{ root: { class: 'bg-[#1A1A1F] border border-zinc-800' }, body: { class: 'p-4' } }">
                <template #content>
                    <div class="flex items-center gap-3">
                        <i class="pi pi-flag-fill text-[#E10600] text-xl"></i>
                        <div class="flex flex-col">
                            <span class="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                Último Gran Premio
                            </span>
                            <span class="text-base font-black text-white">
                                {{ jornada.nombreGranPremio }}
                            </span>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2 mt-4">
                        <span v-for="(cond, idx) in condicionesTexto" :key="idx"
                            class="flex items-center gap-1.5 px-2.5 py-1 bg-[#121218] border border-zinc-800 text-xs font-bold"
                            :class="cond.color">
                            <i class="pi text-[10px]" :class="cond.icono"></i>
                            {{ cond.texto }}
                        </span>
                    </div>
                    <p class="text-[11px] text-zinc-500 mt-3 leading-relaxed">
                        Pulsa cualquier piloto para ver los datos reales recopilados de OpenF1 y cuántos
                        puntos habría sumado bajo cada variante de carta.
                    </p>
                </template>
            </Card>

            <!-- Lista de pilotos -->
            <div v-if="hayJornada" class="flex flex-col gap-2">
                <div v-for="piloto in filasPilotos" :key="piloto.numero"
                    class="bg-[#1A1A1F] border border-zinc-800 overflow-hidden">

                    <!-- Cabecera del piloto (clickable) -->
                    <button type="button" @click="alternarPiloto(piloto.numero)"
                        class="w-full flex items-center gap-3 p-3 cursor-pointer bg-transparent border-none text-left hover:bg-[#1F1F25] transition-colors">
                        <span class="w-10 text-center text-2xl font-black text-[#D4A843] tabular-nums">
                            {{ formatearPosicion(piloto.actuacion.posicionCarrera) }}
                        </span>
                        <img :src="piloto.imagen" :alt="piloto.nombre"
                            class="w-12 h-12 object-cover rounded-full bg-[#121218] border border-zinc-800" />
                        <div class="flex-1 flex flex-col gap-0.5">
                            <span class="text-sm font-bold text-white">{{ piloto.nombre }}</span>
                            <span class="text-[10px] uppercase tracking-wider text-zinc-500">
                                {{ piloto.equipo }} · #{{ piloto.numero }}
                            </span>
                        </div>
                        <div class="flex flex-col items-end text-[10px] text-zinc-400">
                            <span>QUALY {{ formatearPosicion(piloto.actuacion.posicionQualy) }}</span>
                            <span>SALIDA {{ formatearPosicion(piloto.actuacion.posicionSalida) }}</span>
                        </div>
                        <i class="pi text-zinc-500 text-xs"
                            :class="pilotoExpandido === piloto.numero ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
                    </button>

                    <!-- Detalle expandible -->
                    <div v-if="pilotoExpandido === piloto.numero"
                        class="px-4 pb-4 pt-2 border-t border-zinc-800 flex flex-col gap-4">

                        <!-- Datos crudos de OpenF1 -->
                        <section class="flex flex-col gap-2">
                            <span class="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                Datos recogidos por OpenF1
                            </span>
                            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                <div class="flex flex-col p-2 bg-[#121218] border border-zinc-800">
                                    <span class="text-[9px] uppercase tracking-wider text-zinc-500">Posición
                                        qualy</span>
                                    <span class="text-base font-black text-white">
                                        {{ formatearPosicion(piloto.actuacion.posicionQualy) }}
                                    </span>
                                </div>
                                <div class="flex flex-col p-2 bg-[#121218] border border-zinc-800">
                                    <span class="text-[9px] uppercase tracking-wider text-zinc-500">Posición
                                        salida</span>
                                    <span class="text-base font-black text-white">
                                        {{ formatearPosicion(piloto.actuacion.posicionSalida) }}
                                    </span>
                                </div>
                                <div class="flex flex-col p-2 bg-[#121218] border border-zinc-800">
                                    <span class="text-[9px] uppercase tracking-wider text-zinc-500">Posición
                                        carrera</span>
                                    <span class="text-base font-black text-white">
                                        {{ formatearPosicion(piloto.actuacion.posicionCarrera) }}
                                    </span>
                                </div>
                                <div class="flex flex-col p-2 bg-[#121218] border border-zinc-800">
                                    <span
                                        class="text-[9px] uppercase tracking-wider text-zinc-500">Adelantamientos</span>
                                    <span class="text-base font-black text-white">
                                        {{ piloto.actuacion.numeroAdelantos ?? 0 }}
                                    </span>
                                </div>
                                <div class="flex flex-col p-2 bg-[#121218] border border-zinc-800">
                                    <span class="text-[9px] uppercase tracking-wider text-zinc-500">Paradas en
                                        boxes</span>
                                    <span class="text-base font-black text-white">
                                        {{ piloto.actuacion.numeroPitStops ?? 0 }}
                                    </span>
                                </div>
                                <div class="flex flex-col p-2 bg-[#121218] border border-zinc-800">
                                    <span class="text-[9px] uppercase tracking-wider text-zinc-500">Mejor stint</span>
                                    <span class="text-base font-black text-white">
                                        {{ formatearPorcentaje(piloto.actuacion.porcentajeStintMaximo) }}
                                    </span>
                                </div>
                            </div>
                        </section>

                        <!-- Simulación por variante -->
                        <section class="flex flex-col gap-2">
                            <span class="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                Puntos por variante de carta
                            </span>
                            <div class="flex flex-col gap-1.5">
                                <div v-for="sim in obtenerSimulacionVariantes(piloto)" :key="sim.id"
                                    class="flex items-center gap-3 p-2.5 bg-[#121218] border border-zinc-800">
                                    <i class="pi text-base" :class="sim.icono" :style="{ color: sim.color }"></i>
                                    <div class="flex-1 flex flex-col">
                                        <span class="text-xs font-bold text-white">{{ sim.etiqueta }}</span>
                                        <span class="text-[10px] text-zinc-500">
                                            Base {{ sim.puntuacionBase }} × Factor {{ sim.factor }}
                                        </span>
                                    </div>
                                    <span class="text-lg font-black tabular-nums" :style="{ color: sim.color }">
                                        +{{ sim.puntos }}
                                    </span>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </main>

        <BarraNavegacion />
    </div>
</template>
