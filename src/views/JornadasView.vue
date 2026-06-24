<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'

import Card from 'primevue/card'
import Message from 'primevue/message'

import Cabecera from '@/components/Cabecera.vue'
import BarraNavegacion from '@/components/BarraNavegacion.vue'

import { usarStoreJornada } from '@/stores/storeJornada'
import { VARIANTES } from '@/utils/variantesPiloto'
import { calcularPuntosVariante, calcularFactorCaos } from '@/services/servicioJornada'

const storeJornada = usarStoreJornada()
const { historial, catalogoPilotos, ultimoGranPremioPendiente } = storeToRefs(storeJornada)

const idJornadaSeleccionada = ref(null)
const cargando = ref(true)
const pilotoExpandido = ref(null)

let cancelarSuscripcion = () => {}

const jornada = computed(() => {
  if (!historial.value.length) return null
  return historial.value.find((j) => j.id === idJornadaSeleccionada.value) || historial.value[0]
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

onMounted(async () => {
  await storeJornada.cargarCatalogo()

  cancelarSuscripcion = storeJornada.escucharHistorial((jornadas) => {
    if (!idJornadaSeleccionada.value && jornadas.length > 0) {
      idJornadaSeleccionada.value = jornadas[0].id
    }
    cargando.value = false
  })
})

onUnmounted(() => {
  cancelarSuscripcion()
})

const hayJornada = computed(() => Boolean(jornada.value && jornada.value.actuacionesPorPiloto))

function obtenerEstadoCarrera(actuacion) {
  if (actuacion?.dsq) return 'DESC'
  if (actuacion?.dns) return 'N/S'
  if (actuacion?.dnf) return 'ABN'
  if (actuacion?.noClasificado) return 'NC'
  return null
}

const filasPilotos = computed(() => {
  if (!hayJornada.value) return []

  const actuaciones = jornada.value.actuacionesPorPiloto
  const filas = []

  for (const pilotoBase of catalogoPilotos.value) {
    const actuacion = actuaciones[pilotoBase.numero]
    if (!actuacion) continue

    filas.push({
      numero: pilotoBase.numero,
      nombre: pilotoBase.nombre,
      equipo: pilotoBase.equipo,
      imagen: pilotoBase.imagen,
      actuacion,
      estadoCarrera: obtenerEstadoCarrera(actuacion),
    })
  }

  return filas.sort((a, b) => a.actuacion.posicionCarrera - b.actuacion.posicionCarrera)
})

const condicionesTexto = computed(() => {
  if (!hayJornada.value) return []
  const c = jornada.value.condiciones || {}
  const etiquetas = []
  if (c.llovio) etiquetas.push({ texto: 'Lluvia', color: 'text-blue-400' })
  else etiquetas.push({ texto: 'Seco', color: 'text-[#D4A843]' })
  if (c.numeroSafetyCarActivos > 0) etiquetas.push({ texto: `${c.numeroSafetyCarActivos} Coche de Seguridad`, color: 'text-[#D4A843]' })
  if (c.numeroVirtualSafetyCarActivos > 0)
    etiquetas.push({ texto: `${c.numeroVirtualSafetyCarActivos} Coche de Seguridad Virtual`, color: 'text-[#D4A843]' })
  if (c.numeroDNFs > 0) etiquetas.push({ texto: `${c.numeroDNFs} ABN`, color: 'text-[#E10600]' })
  const factorCaos = calcularFactorCaos(c)
  etiquetas.push({ texto: `×${factorCaos} Todoterreno`, color: 'text-[#a78bfa]' })
  return etiquetas
})

function alternarPiloto(numero) {
  pilotoExpandido.value = pilotoExpandido.value === numero ? null : numero
}

const CELDAS_OPENF1 = [
  { etiqueta: 'Posición salida', campo: (a) => a.posicionSalida },
  { etiqueta: 'Posición carrera', campo: (a) => a.posicionCarrera, esResultado: true },
  { etiqueta: 'Adelantamientos', campo: (a) => a.numeroAdelantos ?? 0 },
  { etiqueta: 'Veces adelantado', campo: (a) => a.numeroVecesAdelantado ?? 0 },
  { etiqueta: 'Paradas en boxes', campo: (a) => a.numeroPitStops ?? 0 },
  {
    etiqueta: 'Stint más largo',
    campo: (a) => formatearPorcentaje(a.porcentajeStintMaximo),
    titulo:
      'Porcentaje de vueltas que el piloto completó sin parar (su tramo más largo sobre el total de vueltas que hizo). 100% → ninguna parada; 50% → dos stints similares.',
  },
]

function obtenerSimulacionVariantes(piloto) {
  const condiciones = jornada.value.condiciones || {}
  return VARIANTES.map((variante) => {
    const puntos = calcularPuntosVariante(variante.id, piloto.actuacion, condiciones)
    return { ...variante, puntos }
  })
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
      <div v-if="cargando" class="flex justify-center py-16">
        <p class="text-sm font-bold uppercase tracking-widest text-[#D4A843]">Cargando...</p>
      </div>

      <div v-else-if="!hayJornada" class="flex flex-col gap-3">
        <Message severity="info" :closable="false"> No hay ninguna jornada procesada. </Message>

        <div v-if="ultimoGranPremioPendiente" class="bg-[#1A1A1F] border border-[#D4A843]/40 p-4 flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <i class="pi pi-clock text-[#D4A843]"></i>
            <span class="text-[10px] font-black uppercase tracking-widest text-[#D4A843]"> Último Gran Premio celebrado. </span>
          </div>
          <div class="flex items-center gap-3">
            <img
              v-if="ultimoGranPremioPendiente.imagen"
              :src="ultimoGranPremioPendiente.imagen"
              alt="Circuito"
              class="w-24 h-16 object-contain"
            />
            <div class="flex flex-col">
              <span class="text-sm font-bold text-white">
                {{ ultimoGranPremioPendiente.nombreGranPremio }}
              </span>
              <span class="text-xs text-zinc-400"> {{ ultimoGranPremioPendiente.circuito }} · {{ ultimoGranPremioPendiente.pais }} </span>
              <span class="text-xs text-zinc-500">{{ ultimoGranPremioPendiente.fecha }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!cargando && historial.length > 1" class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          v-for="item in historial"
          :key="item.id"
          type="button"
          @click="seleccionarJornada(item.id)"
          class="flex flex-col items-start gap-0.5 px-3 py-2 border shrink-0 transition-colors"
          :class="item.id === jornada?.id ? 'bg-[#E10600]/10 border-[#E10600] text-white' : 'bg-[#1A1A1F] border-zinc-800 text-zinc-400'"
        >
          <span class="text-[9px] font-black uppercase tracking-widest">
            {{ formatearFechaCorta(item.fechaCarrera || item.fechaProcesamiento) }}
          </span>
          <span class="text-xs font-bold">{{ item.nombreGranPremio }}</span>
        </button>
      </div>

      <Card v-if="hayJornada" :pt="{ root: { class: 'bg-[#1A1A1F] border border-zinc-800' }, body: { class: 'p-4' } }">
        <template #content>
          <div class="flex items-center gap-3">
            <div class="flex flex-col">
              <span class="text-[10px] font-black uppercase text-zinc-500"> Último Gran Premio </span>
              <span class="text-base font-black text-white">
                {{ jornada.nombreGranPremio }}
              </span>
            </div>
          </div>
          <div class="flex flex-wrap gap-2 mt-4">
            <span
              v-for="(cond, idx) in condicionesTexto"
              :key="idx"
              class="flex items-center gap-1.5 px-2.5 py-1 bg-[#121218] border border-zinc-800 text-xs font-bold"
              :class="cond.color"
            >
              {{ cond.texto }}
            </span>
          </div>
          <p class="text-xs text-zinc-200 mt-3">
            Pulsa cualquier piloto para ver los datos reales recopilados de OpenF1 y cuántos puntos habría sumado bajo cada variante de
            carta.
          </p>
        </template>
      </Card>

      <div v-if="hayJornada" class="flex flex-col gap-2">
        <div v-for="piloto in filasPilotos" :key="piloto.numero" class="bg-[#1A1A1F] border border-zinc-800 overflow-hidden">
          <button
            type="button"
            @click="alternarPiloto(piloto.numero)"
            class="w-full flex items-center gap-3 p-3 bg-transparent border-none text-left transition-colors"
          >
            <span class="w-10 text-center text-2xl font-black" :class="piloto.estadoCarrera ? 'text-[#E10600] text-sm' : 'text-[#D4A843]'">
              {{ piloto.estadoCarrera || piloto.actuacion.posicionCarrera }}
            </span>
            <div class="w-20 h-14 bg-black">
              <img :src="piloto.imagen" :alt="piloto.nombre" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1 flex flex-col">
              <span class="text-sm font-bold text-white uppercase">{{ piloto.nombre }}</span>
            </div>
            <i class="pi text-zinc-500 text-xs" :class="pilotoExpandido === piloto.numero ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
          </button>

          <div v-if="pilotoExpandido === piloto.numero" class="px-4 pb-4 pt-2 border-t border-zinc-800 flex flex-col gap-4">
            <section class="flex flex-col gap-2">
              <span class="text-[10px] font-black uppercase text-zinc-500"> Datos recogidos por OpenF1 </span>
              <div class="grid grid-cols-2 gap-1">
                <div v-for="celda in CELDAS_OPENF1" :key="celda.etiqueta" class="flex flex-col p-2 bg-[#121218]">
                  <span class="text-[9px] uppercase tracking-wider text-zinc-500">{{ celda.etiqueta }}</span>
                  <span
                    class="text-base font-black"
                    :class="celda.esResultado && piloto.estadoCarrera ? 'text-[#E10600]' : 'text-white'"
                    :title="celda.titulo || undefined"
                  >
                    {{ celda.esResultado ? piloto.estadoCarrera || celda.campo(piloto.actuacion) : celda.campo(piloto.actuacion) }}
                  </span>
                </div>
              </div>
            </section>

            <section class="flex flex-col gap-2">
              <span class="text-[10px] font-black uppercase text-zinc-500"> Puntos por variante de carta </span>
              <div class="flex flex-col gap-1.5">
                <div v-for="sim in obtenerSimulacionVariantes(piloto)" :key="sim.id" class="flex items-center gap-3 p-2.5 bg-[#121218]">
                  <i class="pi text-base" :class="sim.icono" :style="{ color: sim.color }"></i>
                  <div class="flex-1 flex flex-col">
                    <span class="text-xs font-bold text-white">{{ sim.etiqueta }}</span>
                  </div>
                  <span class="text-lg font-black tabular-nums" :style="{ color: sim.color }"> +{{ sim.puntos }} </span>
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
