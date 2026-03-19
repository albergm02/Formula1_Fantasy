<script setup>
import { ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'

// IMPORTAMOS TU COMPONENTE DE VUE-BITS
import ElectricBorder from '@/components/ElectricBorder.vue'

const props = defineProps({
  piloto: {
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
const confirm = useConfirm()

const confirmarCompra = () => {
  confirm.require({
    message: `¿Estás seguro de que quieres pujar por ${props.piloto.nombre} por ${props.piloto.precio}M?`,
    header: 'Confirmar Puja',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, pujar',
    rejectLabel: 'No, cancelar',
    accept() {
      emit('fichar', props.piloto)
    },
  })
}
</script>

<template>
  <component :is="props.piloto.tier === 2 ? ElectricBorder : 'div'"
    class="relative w-full aspect-[3/4] rounded-2xl group transition-transform duration-300 hover:-translate-y-2"
    :class="props.piloto.tier === 1 ? 'border border-white/10 shadow-lg bg-[#15151E]' : 'bg-[#15151E]'">

    <div class="absolute inset-0 flex flex-col z-10 rounded-2xl overflow-hidden">

      <header class="flex justify-between items-center p-3 border-b border-white/5 bg-black/40 shrink-0 z-20">
        <div class="flex flex-col">
          <span class="text-xs font-black text-white tracking-widest uppercase flex items-center gap-2">
            {{ props.piloto.nombre }}
            <span v-if="props.piloto.tier === 2"
              class="bg-[#00E5E5] text-[#15151E] px-1.5 py-0.5 rounded text-[9px] font-black animate-pulse">
              PRO
            </span>
          </span>
          <span class="text-[10px] text-white/50 uppercase font-bold">{{ props.piloto.equipo }}</span>
        </div>
        <span class="text-sm font-black text-[#00E5E5]">{{ props.piloto.precio }}M</span>
      </header>

      <main class="relative flex-1 w-full cursor-pointer bg-gradient-to-b from-[#15151E] to-black overflow-hidden"
        @click="mostrarInfo = !mostrarInfo">

        <div v-show="!mostrarInfo" class="absolute inset-0">
          <img v-if="props.piloto.imagen" :src="props.piloto.imagen" :alt="props.piloto.nombre"
            class="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity" />

          <div
            class="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-[#15151E] to-transparent flex items-end justify-center pb-4 pointer-events-none">
            <span
              class="text-[10px] font-black text-white/70 px-3 py-1 bg-black/50 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
              <i class="pi pi-sync mr-1 text-[#00E5E5]"></i> TOCA PARA INFO
            </span>
          </div>
        </div>

        <div v-show="mostrarInfo"
          class="absolute inset-0 p-5 flex flex-col text-left z-30 bg-[#15151E]/95 backdrop-blur-xl overflow-y-auto">

          <div v-if="props.piloto.habilidad_1" class="mb-4 bg-white/5 p-3 rounded-xl border border-white/10 shrink-0">
            <h4 class="text-[10px] font-black text-white/50 tracking-widest uppercase mb-1">Habilidad Base</h4>
            <div class="flex justify-between items-start mb-1">
              <span class="text-sm font-bold text-white">{{ props.piloto.habilidad_1.nombre }}</span>
              <span class="text-xs font-black text-emerald-400">+{{ props.piloto.habilidad_1.puntos }} pts</span>
            </div>
            <p class="text-[11px] text-zinc-400 leading-relaxed">
              {{ props.piloto.habilidad_1.descripcion }}
            </p>
          </div>

          <div v-if="props.piloto.tier === 2 && props.piloto.habilidad_2"
            class="relative bg-[#00E5E5]/10 p-3 rounded-xl border border-[#00E5E5]/30 shadow-[0_0_15px_rgba(0,229,229,0.15)] shrink-0">
            <div class="absolute -top-2 -right-2 text-xl animate-bounce">🔥</div>
            <h4 class="text-[10px] font-black text-[#00E5E5] tracking-widest uppercase mb-1 drop-shadow-md">Condición de
              Despertar</h4>
            <div class="flex justify-between items-start mb-1">
              <span class="text-sm font-bold text-white">{{ props.piloto.habilidad_2.nombre }}</span>
              <span class="text-xs font-black text-[#00E5E5]">+{{ props.piloto.habilidad_2.puntos }} pts</span>
            </div>
            <p class="text-[11px] text-[#00E5E5]/80 leading-relaxed font-medium">
              {{ props.piloto.habilidad_2.descripcion }}
            </p>
          </div>

          <div class="mt-auto pt-4 pb-2 text-center shrink-0">
            <span class="text-[10px] font-black text-white/50"><i class="pi pi-arrow-left mr-1"></i> VOLVER</span>
          </div>
        </div>
      </main>

      <button v-if="modoMercado" @click.stop="confirmarCompra"
        class="w-full shrink-0 bg-[#111111] hover:bg-[#00E5E5] text-[#00E5E5] hover:text-[#15151E] transition-colors py-3 cursor-pointer z-20 border-t border-white/5 font-black text-xs tracking-widest flex items-center justify-center gap-2">
        <i class="pi pi-hammer"></i>
        <span>PUJAR</span>
      </button>

    </div>
  </component>
</template>