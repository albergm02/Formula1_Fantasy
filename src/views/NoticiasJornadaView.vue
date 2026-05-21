<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'

import Card from 'primevue/card'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

import Cabecera from '@/components/Cabecera.vue'
import BarraNavegacion from '@/components/BarraNavegacion.vue'

import { suscribirseHistorialJornadas } from '@/services/servicioJornada'
import { obtenerUltimoGranPremioFinalizado } from '@/services/servicioOpenF1'

import { pilotosBase } from '@/data/bases/pilotosBase'
import { perfilesPuntuacion } from '@/data/perfilesPuntuacion'

import { calcularFactorJornada, calcularPuntosJornada } from '@/utils/puntuacion'

// Variantes de puntuación para mostrar en la guía rápida
const VARIANTES = [
    { id: 'qualy', etiqueta: 'Qualy', icono: 'pi-stopwatch', color: '#38bdf8' },
    { id: 'carrera', etiqueta: 'Carrera', icono: 'pi-flag-fill', color: '#f97316' },
    { id: 'todo_terreno', etiqueta: 'Todo Terreno', icono: 'pi-cloud', color: '#a78bfa' },
    { id: 'remontador', etiqueta: 'Remontador', icono: 'pi-arrow-up', color: '#ef4444' },
    { id: 'estratega', etiqueta: 'Estratega', icono: 'pi-chart-bar', color: '#10b981' },
    { id: 'base', etiqueta: 'Base', icono: 'pi-user', color: '#a1a1aa' },
]

// Ejemplos para cada variante dentro de la guía para explicar como funciona el sistema de puntuación.
const EJEMPLOS_VARIANTE = {
    qualy: {
        escenario: 'Piloto con base 72 que clasifica P2.',
        calculo: 'Factor P2 (P1–P3) = ×1.50 → 72 × 1.50 = 108 pts.',
    },
    carrera: {
        escenario: 'Piloto con base 68 que termina P3.',
        calculo: 'Factor P3 = ×1.30 → 68 × 1.30 = 88,4 pts.',
    },
    todo_terreno: {
        escenario: 'GP sin lluvia, 2 Safety Cars y 3 abandonos. Base del piloto 65.',
        calculo: 'Factor = 0.50 + 2 × 0.05 + 3 × 0.10 = 0.50 + 0.10 + 0.30 = 0.90 → 65 × 0.90 = 58,5 pts.',
    },
    remontador: {
        escenario: 'Piloto con base 60 que realiza 8 adelantamientos y recibe 3 (diferencial +5).',
        calculo: 'Factor = 1.0 + 5 × 0.1 = 1.50 → 60 × 1.50 = 90 pts.',
    },
    estratega: {
        escenario: 'Piloto con base 70, 1 parada, mejor stint del 50%, termina P5.',
        calculo: 'Factor = 0.70 + 0.30 + 0.15 + 0.05 = 1.20 → 70 × 1.20 = 84 pts.',
    },
    base: {
        escenario: 'Piloto con base 66 cuando los factores Qualy/Carrera/Todo Terreno son 1.20, 1.10 y 1.00.',
        calculo: 'Factor = (1.20 + 1.10 + 1.00) / 3 = 1.10 → 66 × 1.10 = 72,6 pts (73).',
    },
}

const historial = ref([])
const idJornadaSeleccionada = ref(null)
const cargando = ref(true)
const pilotoExpandido = ref(null)
const guiaAbierta = ref(false)
const varianteGuiaExpandida = ref(null)
const ultimoGranPremioPendiente = ref(null)

let cancelarSuscripcion = () => { }

const jornada = computed(() => {
    if (!historial.value.length) return null
    return (
        historial.value.find((j) => j.id === idJornadaSeleccionada.value) || historial.value[0]
    )
})

function seleccionarJornada(idJornada) {
    idJornadaSeleccionada.value = idJornada
    pilotoExpandido.value = null
}

function formatearFechaCorta(iso) {
    if (!iso) return ''
    const fecha = new Date(iso)
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

function alternarGuia() {
    guiaAbierta.value = !guiaAbierta.value
}

function alternarVarianteGuia(id) {
    varianteGuiaExpandida.value = varianteGuiaExpandida.value === id ? null : id
}

function obtenerReglasVariante(id) {
    return perfilesPuntuacion[id]?.reglasUsuario || []
}

function obtenerEjemploVariante(id) {
    return EJEMPLOS_VARIANTE[id] || null
}

onMounted(async () => {
    cancelarSuscripcion = suscribirseHistorialJornadas(async (jornadas) => {
        historial.value = jornadas
        if (!idJornadaSeleccionada.value && jornadas.length > 0) {
            idJornadaSeleccionada.value = jornadas[0].id
        }
        cargando.value = false

        // Si Firestore aún no tiene ninguna jornada, consultamos OpenF1
        // directamente para informar del último GP corrido y evitar una pantalla vacía.
        if (jornadas.length === 0 && !ultimoGranPremioPendiente.value) {
            try {
                ultimoGranPremioPendiente.value = await obtenerUltimoGranPremioFinalizado()
            } catch (error) {
                console.warn('No se pudo recuperar el último GP de OpenF1:', error.message)
            }
        }
    })
})

onUnmounted(() => {
    cancelarSuscripcion()
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

function obtenerEstadoCarrera(actuacion) {
    if (actuacion?.dsq) return 'DSQ'
    if (actuacion?.dns) return 'DNS'
    if (actuacion?.dnf) return 'DNF'
    return null
}

function formatearPorcentaje(valor) {
    if (valor == null || valor === 0) return '—'
    return `${Math.round(valor * 100)}%`
}
</script>

<template>
    <div class="min-h-screen pb-24 font-sans">
        <Cabecera />

        <main class="flex flex-col w-full max-w-3xl mx-auto mt-2 p-4 gap-4">
            <!-- Cargando -->
            <div v-if="cargando" class="flex justify-center py-16">
                <ProgressSpinner stroke-width="3" />
            </div>

            <!-- Sin jornada -->
            <div v-else-if="!hayJornada" class="flex flex-col gap-3">
                <Message severity="info" :closable="false">
                    Aún no hay ninguna jornada procesada. Los datos se publican automáticamente cada
                    lunes tras el Gran Premio.
                </Message>

                <div v-if="ultimoGranPremioPendiente"
                    class="bg-[#1A1A1F] border border-[#D4A843]/40 p-4 flex flex-col gap-2">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-clock text-[#D4A843]"></i>
                        <span class="text-[10px] font-black uppercase tracking-widest text-[#D4A843]">
                            Último Gran Premio celebrado
                        </span>
                    </div>
                    <div class="flex items-center gap-3">
                        <img v-if="ultimoGranPremioPendiente.imagen" :src="ultimoGranPremioPendiente.imagen"
                            alt="Circuito" class="w-24 h-16 object-contain" />
                        <div class="flex flex-col">
                            <span class="text-sm font-bold text-white">
                                {{ ultimoGranPremioPendiente.nombreGranPremio }}
                            </span>
                            <span class="text-xs text-zinc-400">
                                {{ ultimoGranPremioPendiente.circuito }} · {{ ultimoGranPremioPendiente.pais }}
                            </span>
                            <span class="text-xs text-zinc-500">{{ ultimoGranPremioPendiente.fecha }}</span>
                        </div>
                    </div>
                    <p class="text-[11px] text-zinc-500 leading-relaxed">
                        El cálculo de puntos para este GP está pendiente. Aparecerá aquí en cuanto se
                        complete el procesamiento automático.
                    </p>
                </div>
            </div>

            <!-- Selector de historial de jornadas -->
            <div v-if="!cargando && historial.length > 1" class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                <button v-for="item in historial" :key="item.id" type="button" @click="seleccionarJornada(item.id)"
                    class="flex flex-col items-start gap-0.5 px-3 py-2 border shrink-0 cursor-pointer transition-colors"
                    :class="item.id === jornada?.id
                        ? 'bg-[#E10600]/10 border-[#E10600] text-white'
                        : 'bg-[#1A1A1F] border-zinc-800 text-zinc-400'">
                    <span class="text-[9px] font-black uppercase tracking-widest">
                        {{ formatearFechaCorta(item.fechaProcesamiento) }}
                    </span>
                    <span class="text-xs font-bold">{{ item.nombreGranPremio }}</span>
                </button>
            </div>

            <!-- Guía de puntuación por clase -->
            <div v-if="!cargando" class="bg-[#1A1A1F] border border-zinc-800 overflow-hidden">
                <button type="button" @click="alternarGuia"
                    class="w-full flex items-center gap-3 p-3 cursor-pointer bg-transparent border-none text-left transition-colors">
                    <i class="pi pi-book text-[#D4A843] text-base"></i>
                    <div class="flex-1 flex flex-col">
                        <span class="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                            Guía rápida
                        </span>
                        <span class="text-sm font-bold text-white">
                            Cómo puntúa cada clase de carta
                        </span>
                    </div>
                    <i class="pi text-zinc-500 text-xs" :class="guiaAbierta ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
                </button>

                <div v-if="guiaAbierta" class="px-4 pb-4 pt-2 border-t border-zinc-800 flex flex-col gap-2">
                    <p class="text-[11px] text-zinc-400 leading-relaxed">
                        Cada carta tiene una <span class="text-white font-bold">puntuación base</span>
                        (suma ponderada de los atributos del piloto) y un
                        <span class="text-white font-bold">factor de jornada</span> que depende de cómo le
                        fue al piloto en este Gran Premio. Los puntos finales son
                        <span class="text-white font-bold">base × factor</span>.
                    </p>

                    <div v-for="variante in VARIANTES" :key="variante.id"
                        class="bg-[#121218] border border-zinc-800 overflow-hidden">
                        <button type="button" @click="alternarVarianteGuia(variante.id)"
                            class="w-full flex items-center gap-3 p-2.5 cursor-pointer bg-transparent border-none text-left transition-colors">
                            <i class="pi text-base" :class="variante.icono" :style="{ color: variante.color }"></i>
                            <span class="flex-1 text-xs font-bold text-white">{{ variante.etiqueta }}</span>
                            <i class="pi text-zinc-500 text-[10px]"
                                :class="varianteGuiaExpandida === variante.id ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
                        </button>

                        <div v-if="varianteGuiaExpandida === variante.id"
                            class="px-3 pb-3 pt-1 border-t border-zinc-800 flex flex-col gap-2">
                            <ul class="flex flex-col gap-0.5 list-none p-0 m-0">
                                <li v-for="(regla, idx) in obtenerReglasVariante(variante.id)" :key="idx"
                                    class="text-[11px] text-zinc-300 leading-snug">
                                    {{ regla }}
                                </li>
                            </ul>
                            <div v-if="obtenerEjemploVariante(variante.id)"
                                class="flex flex-col gap-1 p-2 bg-[#1A1A1F] border-l-2"
                                :style="{ borderColor: variante.color }">
                                <span class="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                    Ejemplo
                                </span>
                                <span class="text-[11px] text-zinc-300 leading-snug">
                                    {{ obtenerEjemploVariante(variante.id).escenario }}
                                </span>
                                <span class="text-[11px] font-bold leading-snug" :style="{ color: variante.color }">
                                    {{ obtenerEjemploVariante(variante.id).calculo }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Resumen del GP -->
            <Card v-if="hayJornada"
                :pt="{ root: { class: 'bg-[#1A1A1F] border border-zinc-800' }, body: { class: 'p-4' } }">
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
                        class="w-full flex items-center gap-3 p-3 cursor-pointer bg-transparent border-none text-left transition-colors">
                        <span class="w-10 text-center text-2xl font-black tabular-nums"
                            :class="obtenerEstadoCarrera(piloto.actuacion) ? 'text-red-500 text-sm' : 'text-[#D4A843]'">
                            {{ obtenerEstadoCarrera(piloto.actuacion) ||
                                formatearPosicion(piloto.actuacion.posicionCarrera) }}
                        </span>
                        <div class="w-20 h-14 overflow-hidden bg-black border border-zinc-700 shrink-0">
                            <img :src="piloto.imagen" :alt="piloto.nombre" class="w-full h-full object-cover block" />
                        </div>
                        <div class="flex-1 flex flex-col gap-0.5">
                            <span class="text-sm font-bold text-white">{{ piloto.nombre }}</span>
                            <span class="text-[10px] uppercase tracking-wider text-zinc-500">
                                {{ piloto.equipo }} · #{{ piloto.numero }}
                            </span>
                        </div>
                        <div class="flex flex-col items-end text-[10px] text-zinc-400">
                            <span>SALIDA {{ formatearPosicion(piloto.actuacion.posicionSalida) }}</span>
                            <span>CARRERA {{ obtenerEstadoCarrera(piloto.actuacion) ||
                                formatearPosicion(piloto.actuacion.posicionCarrera) }}</span>
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
                                        salida</span>
                                    <span class="text-base font-black text-white">
                                        {{ formatearPosicion(piloto.actuacion.posicionSalida) }}
                                    </span>
                                </div>
                                <div class="flex flex-col p-2 bg-[#121218] border border-zinc-800">
                                    <span class="text-[9px] uppercase tracking-wider text-zinc-500">Posición
                                        carrera</span>
                                    <span class="text-base font-black"
                                        :class="obtenerEstadoCarrera(piloto.actuacion) ? 'text-red-500' : 'text-white'">
                                        {{ obtenerEstadoCarrera(piloto.actuacion) ||
                                            formatearPosicion(piloto.actuacion.posicionCarrera) }}
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
                                    <span class="text-[9px] uppercase tracking-wider text-zinc-500">Veces
                                        adelantado</span>
                                    <span class="text-base font-black text-white">
                                        {{ piloto.actuacion.numeroVecesAdelantado ?? 0 }}
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
                                    <span class="text-[9px] uppercase tracking-wider text-zinc-500">Stint más
                                        largo</span>
                                    <span class="text-base font-black text-white"
                                        :title="'Porcentaje de vueltas que el piloto completó sin parar (su tramo más largo sobre el total de vueltas que hizo). 100% → ninguna parada; 50% → dos stints similares.'">
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
