<script setup>
import { ref, computed } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'

const props = defineProps({
    rueda: {
        type: Object,
        required: true,
    },
    modoMercado: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits(['fichar'])
const mostrarInfo = ref(false)
const confirmar = useConfirm()

const etiquetasMejora = computed(() => {
    const mejoras = props.rueda.mejoras
    if (!mejoras) return []
    return Object.entries(mejoras)
        .filter(([, valor]) => valor !== 0)
        .map(([atributo, valor]) => ({
            atributo,
            valor,
            signo: valor > 0 ? '+' : '',
            color: valor > 0 ? 'text-emerald-400' : 'text-red-400',
        }))
})

const confirmarCompra = () => {
    confirmar.require({
        message: `Equipar ${props.rueda.nombre} por ${props.rueda.precio}M?`,
        header: 'Confirmar Compuesto',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Si, equipar',
        rejectLabel: 'No, cancelar',
        accept() {
            emit('fichar', props.rueda)
        },
    })
}
</script>

<template>
    <div class="w-full h-full min-h-[180px]">
        <div class="relative w-full h-full flex flex-col overflow-hidden border border-zinc-700 bg-black">
            <div class="relative z-10 flex flex-col flex-1 w-full h-full overflow-hidden bg-[#1A1A1F]">

                <header class="flex justify-between items-center p-2 z-20 shrink-0 bg-black">
                    <div class="flex items-center gap-1.5 w-2/3">
                        <i class="pi pi-circle-fill text-[10px]" :style="{ color: props.rueda.color }"></i>
                        <span class="text-[10px] font-black text-white uppercase truncate">
                            {{ props.rueda.nombre }}
                        </span>
                    </div>
                    <span class="text-[10px] font-black text-[#D4A843] shrink-0">{{ props.rueda.precio }}M</span>
                </header>

                <main class="relative flex-1 w-full bg-transparent cursor-pointer" @click="mostrarInfo = !mostrarInfo">
                    <img v-if="props.rueda.imagen" :src="props.rueda.imagen"
                        class="absolute inset-0 w-full h-full object-cover object-center" />

                    <div v-show="!mostrarInfo"
                        class="absolute bottom-0 left-0 right-0 z-20 p-1.5 flex flex-wrap gap-1 bg-gradient-to-t from-black/90 to-transparent">
                        <span v-for="m in etiquetasMejora" :key="m.atributo"
                            class="px-1 py-0.5 text-[8px] font-black uppercase bg-black/70 border border-zinc-700"
                            :class="m.color">
                            {{ m.signo }}{{ m.valor }} {{ m.atributo.slice(0, 3) }}
                        </span>
                    </div>

                    <div v-show="mostrarInfo"
                        class="absolute inset-0 p-3 flex flex-col z-30 overflow-y-auto bg-[#1A1A1F]">
                        <h4 class="pb-1 mb-2 text-[10px] font-black text-white border-b border-zinc-700 uppercase">
                            {{ props.rueda.nombre }}
                        </h4>

                        <p class="mb-2 text-[9px] text-zinc-300 leading-relaxed">
                            {{ props.rueda.descripcion }}
                        </p>

                        <div v-if="etiquetasMejora.length" class="space-y-1 mb-2">
                            <div v-for="m in etiquetasMejora" :key="m.atributo"
                                class="flex justify-between items-center">
                                <span class="text-[9px] text-zinc-400 uppercase">{{ m.atributo }}</span>
                                <span class="text-[10px] font-black" :class="m.color">{{ m.signo }}{{ m.valor }}</span>
                            </div>
                        </div>

                        <div class="mt-auto pt-2 text-center">
                            <span class="text-[9px] font-black text-white animate-pulse">VOLVER</span>
                        </div>
                    </div>
                </main>

                <Button v-if="modoMercado" @click="confirmarCompra" unstyled
                    class="w-full py-3 z-20 shrink-0 flex items-center justify-center bg-black border-none cursor-pointer">
                    <i class="mr-1 font-bold text-[10px] text-white pi pi-money-bill"></i>
                    <span class="text-white text-[10px] font-black uppercase tracking-widest">EQUIPAR</span>
                </Button>

            </div>
        </div>
    </div>
</template>
