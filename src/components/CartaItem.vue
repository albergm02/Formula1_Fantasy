<script setup>
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import { useToast } from 'primevue/usetoast'

const mostrarDetalles = ref(false)
const mostrarPuja = ref(false)
const cantidadPuja = ref(null)

const props = defineProps({
    carta: { type: Object, required: true },
    tipo: { type: String, required: true },
    modoMercado: { type: Boolean, default: false },
    miPuja: { type: Number, default: null },
    totalPujas: { type: Number, default: 0 },
})

const emit = defineEmits(['pujar', 'eliminarPuja'])
const notificacion = useToast()

const esPiloto = computed(() => props.tipo === 'piloto')
const esCoche = computed(() => props.tipo === 'coche')
const esPotenciador = computed(() => props.tipo === 'potenciador')

const barrasAtributos = computed(() => {
    if (!esPiloto.value) return []
    const a = props.carta.atributos
    const p = props.carta.pesos
    if (!a || !p) return []
    return [
        { nombre: 'Ritmo', valor: a.ritmo, peso: p.ritmo, color: '#38bdf8' },
        { nombre: 'Consistencia', valor: a.consistencia, peso: p.consistencia, color: '#22c55e' },
        { nombre: 'Adaptabilidad', valor: a.adaptabilidad, peso: p.adaptabilidad, color: '#a78bfa' },
        { nombre: 'Agresividad', valor: a.agresividad, peso: p.agresividad, color: '#ef4444' },
        { nombre: 'Gestión', valor: a.gestion, peso: p.gestion, color: '#f59e0b' },
    ]
})

const etiquetasMejora = computed(() => {
    if (!esPotenciador.value || !props.carta.mejoras) return []
    const colores = {
        ritmo: '#38bdf8', consistencia: '#22c55e', adaptabilidad: '#a78bfa',
        agresividad: '#ef4444', gestion: '#f59e0b',
    }
    return Object.entries(props.carta.mejoras)
        .filter(([, valor]) => valor !== 0)
        .map(([atributo, valor]) => ({
            atributo, valor,
            signo: valor > 0 ? '+' : '',
            color: valor > 0 ? 'text-emerald-400' : 'text-red-400',
            colorAtributo: colores[atributo] || '#a1a1aa',
        }))
})

const abrirPuja = () => {
    cantidadPuja.value = props.miPuja || props.carta.precio
    mostrarPuja.value = true
}

const confirmarPuja = () => {
    if (Number(cantidadPuja.value) < Number(props.carta.precio)) {
        notificacion.add({
            severity: 'warn',
            summary: 'Precio insuficiente',
            detail: `La puja mínima es ${Number(props.carta.precio).toFixed(2)}M (precio base actual).`,
            life: 5000,
        })
        return
    }
    emit('pujar', { carta: props.carta, cantidad: cantidadPuja.value })
    mostrarPuja.value = false
}

const confirmarEliminarPuja = () => {
    emit('eliminarPuja', props.carta)
    mostrarPuja.value = false
}
</script>

<template>
    <div class="w-full h-[160px]" :style="esPiloto ? { border: `2px solid ${carta.colorVariante}` } : {}">
        <div class="w-full h-full overflow-hidden border border-zinc-700 bg-black">
            <div class="relative w-full h-full overflow-hidden">

                <img v-if="carta.imagen" :src="carta.imagen" :alt="carta.nombre"
                    class="w-full h-full object-cover block"
                    :style="esPotenciador ? 'object-position: 20% center' : ''" />

                <div v-if="modoMercado && totalPujas > 0"
                    class="absolute top-2 right-2 z-10 flex items-center gap-1 px-1.5 py-0.5 bg-black/70 border border-zinc-500/40">
                    <i class="pi pi-users text-[8px] text-zinc-300"></i>
                    <span class="text-[10px] font-black text-zinc-300">{{ totalPujas }}</span>
                </div>

                <div class="absolute inset-y-0 right-0 w-[55%] flex flex-col justify-between p-3">
                    <div class="flex flex-col min-w-0">
                        <span class="text-sm font-black text-white uppercase leading-tight truncate drop-shadow-md">
                            {{ carta.nombre }}
                        </span>
                        <span v-if="esPiloto" class="text-xs text-zinc-300 uppercase font-bold">{{ carta.equipo
                            }}</span>
                        <span v-if="esCoche" class="text-xs text-zinc-300 uppercase font-bold">{{ carta.equipo ||
                            'COCHE' }}</span>
                        <span v-if="esPotenciador" class="text-xs text-zinc-300 uppercase font-bold">POTENCIADOR</span>
                    </div>

                    <div class="flex flex-col gap-1.5">
                        <div class="flex items-center justify-between gap-1">
                            <div v-if="modoMercado" class="flex items-center gap-1 px-1.5 py-0.5 bg-black/70">
                                <span class="text-[10px] font-black text-emerald-400">
                                    {{ Number(carta.precio).toFixed(2) }} M
                                </span>
                            </div>
                            <span v-if="esPiloto"
                                class="px-2 py-0.5 flex items-center gap-1 text-[8px] font-black uppercase bg-black/70 border ml-auto"
                                :style="{ color: carta.colorVariante, borderColor: carta.colorVariante }">
                                <i class="pi" :class="carta.iconoVariante"></i>
                                {{ carta.variante }}
                            </span>
                        </div>

                        <div v-if="modoMercado" class="flex gap-2">
                            <button @click="mostrarDetalles = true"
                                class="py-2.5 px-3 flex items-center justify-center gap-1 bg-black/50 border border-white/50">
                                <i class="pi pi-info-circle text-white text-[10px]"></i>
                                <span class="text-white text-[9px] font-black uppercase">INFO</span>
                            </button>
                            <button @click="abrirPuja"
                                class="flex-1 py-2.5 flex items-center justify-center bg-black/50 border border-white/50">
                                <span class="text-[10px] font-black uppercase tracking-widest"
                                    :class="miPuja != null ? 'text-[#D4A843]' : 'text-white'">
                                    {{ miPuja != null ? 'EDITAR PUJA' : `PUJAR (${Number(carta.precio).toFixed(2)}M)` }}
                                </span>
                            </button>
                        </div>

                        <button v-else @click="mostrarDetalles = true"
                            class="w-full py-2.5 flex items-center justify-center gap-1.5 bg-black/50 border border-white/50">
                            <i class="pi pi-info-circle text-white text-xs"></i>
                            <span class="text-white text-[10px] font-black uppercase tracking-widest">DETALLES</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>

        <!-- Dialog detalles -->
        <Dialog v-model:visible="mostrarDetalles" :header="carta.nombre" modal
            :style="{ width: '90vw', maxWidth: '400px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }">
            <div class="flex flex-col gap-4">

                <!-- Piloto -->
                <template v-if="esPiloto">
                    <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
                        <p class="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Puntuación base</p>
                        <span class="text-xl font-black" :style="{ color: carta.colorVariante }">
                            {{ carta.puntuacionBase }}
                        </span>
                    </div>
                    <div class="flex flex-col gap-2 pb-3 border-b border-zinc-800">
                        <p class="text-[10px] font-black text-sky-400 uppercase tracking-widest">Atributos</p>
                        <div v-for="barra in barrasAtributos" :key="barra.nombre" class="space-y-0.5">
                            <div class="flex justify-between items-center">
                                <span class="text-[10px] font-bold text-zinc-300 uppercase">{{ barra.nombre }}</span>
                                <span class="text-[10px] font-black"
                                    :class="barra.peso > 0 ? 'text-white' : 'text-zinc-600'">
                                    {{ barra.valor }}
                                    <span :class="barra.peso > 0 ? 'text-zinc-500' : 'text-red-500'"> × {{ barra.peso
                                        }}</span>
                                </span>
                            </div>
                            <div class="w-full h-1.5 bg-zinc-800 overflow-hidden">
                                <div class="h-full"
                                    :style="{ width: `${barra.valor}%`, backgroundColor: barra.color, opacity: barra.peso > 0 ? 0.5 : 0.15 }">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-if="carta.reglasUsuario?.length">
                        <p class="text-xs font-black uppercase leading-tight mb-2"
                            :style="{ color: carta.colorVariante }">
                            <i class="pi mr-1" :class="carta.iconoVariante"></i>{{ carta.nombreVariante }}
                        </p>
                        <ul class="space-y-1.5">
                            <li v-for="(regla, i) in carta.reglasUsuario" :key="`regla-${i}`"
                                class="text-xs text-zinc-300 leading-relaxed">{{ regla }}</li>
                        </ul>
                    </div>
                </template>

                <!-- Coche -->
                <template v-if="esCoche">
                    <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
                        <p class="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">Puntos por jornada</p>
                        <span class="text-3xl font-black text-white">{{ carta.puntos }}</span>
                    </div>
                    <div v-if="carta.habilidad">
                        <p class="text-xs font-black text-emerald-400 uppercase tracking-wide mb-1">
                            {{ carta.habilidad.nombre }}
                        </p>
                        <p class="text-xs text-zinc-300 leading-relaxed">
                            Si alineas pilotos del mismo equipo que este chasis, los puntos totales de la jornada se
                            multiplican por <strong class="text-emerald-300">×1.10</strong>.
                        </p>
                    </div>
                </template>

                <!-- Potenciador -->
                <template v-if="esPotenciador">
                    <p class="text-xs text-zinc-300 pb-3 border-b border-zinc-800">{{ carta.descripcion }}</p>
                    <div v-if="etiquetasMejora.length">
                        <p class="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Mejoras de
                            atributos</p>
                        <div class="space-y-2">
                            <div v-for="m in etiquetasMejora" :key="m.atributo"
                                class="flex justify-between items-center">
                                <span class="text-xs font-bold uppercase" :style="{ color: m.colorAtributo }">{{
                                    m.atributo }}</span>
                                <span class="text-sm font-black" :class="m.color">{{ m.signo }}{{ m.valor }}</span>
                            </div>
                        </div>
                    </div>
                </template>

            </div>
        </Dialog>

        <!-- Dialog puja -->
        <Dialog v-model:visible="mostrarPuja" header="Realizar Puja" modal
            :style="{ width: '90vw', maxWidth: '300px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }">
            <div class="space-y-4">
                <div class="text-center">
                    <p class="text-white font-bold text-sm">{{ carta.nombre }}</p>
                    <p class="text-zinc-400 text-xs mt-1">Precio base:
                        <span class="text-emerald-400 font-bold">{{ Number(carta.precio).toFixed(2) }}M</span>
                    </p>
                </div>
                <div class="flex flex-col items-center gap-2">
                    <label class="text-zinc-300 text-xs font-bold uppercase">Tu puja (M)</label>
                    <InputNumber v-model="cantidadPuja" :step="0.1" :minFractionDigits="2" :maxFractionDigits="2"
                        inputClass="text-center text-white bg-zinc-800 border-zinc-600 w-32" />
                </div>
                <button @click="confirmarPuja"
                    class="w-full py-3 bg-[#D4A843]/70 border border-[#D4A843] text-white font-black uppercase">
                    CONFIRMAR PUJA
                </button>
                <button v-if="miPuja != null" @click="confirmarEliminarPuja"
                    class="w-full py-3 flex items-center justify-center bg-red-900/40 border border-red-500/50 text-white uppercase font-black">
                    ELIMINAR PUJA
                </button>
            </div>
        </Dialog>
    </div>
</template>