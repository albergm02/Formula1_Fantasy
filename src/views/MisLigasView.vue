<script setup>
import { ref } from 'vue'
import Header from '@/components/Header.vue'

// DATOS MOCK (De prueba). Luego los traeremos de Firebase.
const ligas = ref([
    { id: '1', nombre: 'Liga de la Uni', posicion: 3, puntos: 450, participantes: 8, rol: 'admin' },
    { id: '2', nombre: 'Compañeros Curro', posicion: 1, puntos: 890, participantes: 5, rol: 'miembro' }
]);

const entrarLiga = (idLiga) => {
    console.log(`Entrando a la liga: ${idLiga}`);
};

const abrirModalCrear = () => {
    console.log("Abrir pop-up para crear liga");
};

const abrirModalUnirse = () => {
    console.log("Abrir pop-up para meter código de liga");
};
</script>

<template>
    <div class="min-h-screen w-full font-sans bg-[#0c0c12]">

        <Header />

        <main class="p-4 mx-auto w-full max-w-3xl flex flex-col gap-8 mt-4">

            <header class="text-center md:text-left">
                <h1 class="text-3xl font-black italic text-white uppercase tracking-wider">
                    Tus <span class="text-emerald-500">Ligas</span>
                </h1>
                <p class="text-zinc-500 text-sm tracking-widest uppercase mt-1">Selecciona tu paddock para continuar</p>
            </header>

            <div class="flex flex-col sm:flex-row gap-4">
                <button @click="abrirModalCrear"
                    class="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <i class="pi pi-plus-circle text-lg"></i>
                    Crear Nueva Liga
                </button>
                <button @click="abrirModalUnirse"
                    class="flex-1 bg-[#15151E] hover:bg-zinc-800 border border-zinc-700 text-white font-black uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                    <i class="pi pi-sign-in text-lg"></i>
                    Unirse con Código
                </button>
            </div>

            <section v-if="ligas.length > 0" class="flex flex-col gap-4">
                <h2
                    class="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2 mb-2">
                    Ligas Activas</h2>

                <div v-for="liga in ligas" :key="liga.id" @click="entrarLiga(liga.id)"
                    class="bg-[#15151E] border border-zinc-800 hover:border-emerald-500/50 rounded-xl p-5 cursor-pointer group transition-all duration-300 relative overflow-hidden">
                    <div
                        class="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity">
                    </div>

                    <div class="flex items-center justify-between relative z-10">
                        <div class="flex flex-col gap-1">
                            <div class="flex items-center gap-2">
                                <h3 class="text-xl font-black text-white italic uppercase">{{ liga.nombre }}</h3>
                                <span v-if="liga.rol === 'admin'"
                                    class="bg-amber-500/20 text-amber-500 text-[9px] px-2 py-0.5 rounded uppercase tracking-widest font-bold border border-amber-500/30">Admin</span>
                            </div>
                            <span class="text-xs text-zinc-400 font-medium">
                                <i class="pi pi-users text-[10px] mr-1"></i> {{ liga.participantes }} Participantes
                            </span>
                        </div>

                        <div class="flex items-center gap-6">
                            <div class="hidden sm:flex flex-col items-end">
                                <span class="text-2xl font-black text-white tabular-nums leading-none">{{ liga.puntos
                                }}</span>
                                <span class="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Puntos</span>
                            </div>
                            <div class="flex flex-col items-end border-l border-zinc-800 pl-4 sm:pl-6">
                                <span class="text-2xl font-black text-emerald-500 tabular-nums leading-none">{{
                                    liga.posicion }}º</span>
                                <span
                                    class="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Posición</span>
                            </div>
                            <i
                                class="pi pi-chevron-right text-zinc-600 group-hover:text-emerald-500 transition-colors ml-2"></i>
                        </div>
                    </div>
                </div>
            </section>

            <section v-else class="text-center py-12 border border-dashed border-zinc-800 rounded-xl bg-[#15151E]/50">
                <i class="pi pi-flag text-4xl text-zinc-700 mb-4"></i>
                <h3 class="text-lg font-black text-white uppercase italic mb-1">Aún no tienes equipo</h3>
                <p class="text-xs text-zinc-500 tracking-widest max-w-xs mx-auto">Crea una liga para invitar a tus
                    amigos o únete a una existente con un código.</p>
            </section>

        </main>
    </div>
</template>