<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFantasyStore } from '@/stores/storeFantasy'
import { useToast } from 'primevue/usetoast'
import Header from '@/components/Header.vue'

const router = useRouter()
const store = useFantasyStore()
const toast = useToast()

const mostrarModalCrear = ref(false)
const mostrarModalUnirse = ref(false)

const nombreNuevaLiga = ref('')
const codigoUnirse = ref('')
const procesando = ref(false)

const entrarLiga = async (idLiga) => {
    await store.entrarALiga(idLiga)
    router.push('/dashboard')
}

const ejecutarCrearLiga = async () => {
    if (nombreNuevaLiga.value.trim().length < 3) {
        toast.add({ severity: 'warn', summary: 'Nombre corto', detail: 'El nombre debe tener al menos 3 letras', life: 3000 })
        return
    }

    procesando.value = true
    const resultado = await store.crearLiga(nombreNuevaLiga.value)
    procesando.value = false

    if (resultado.exito) {
        toast.add({ severity: 'success', summary: '¡Liga Creada!', detail: resultado.mensaje, life: 5000 })
        mostrarModalCrear.value = false
        nombreNuevaLiga.value = ''
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: resultado.mensaje, life: 3000 })
    }
}

const ejecutarUnirseLiga = async () => {
    if (codigoUnirse.value.trim().length < 5) {
        toast.add({ severity: 'warn', summary: 'Código inválido', detail: 'Revisa el código de invitación', life: 3000 })
        return
    }

    procesando.value = true
    const resultado = await store.unirseLiga(codigoUnirse.value)
    procesando.value = false

    if (resultado.exito) {
        toast.add({ severity: 'success', summary: '¡Fichaje completado!', detail: resultado.mensaje, life: 3000 })
        mostrarModalUnirse.value = false
        codigoUnirse.value = ''
    } else {
        toast.add({ severity: 'error', summary: 'Acceso Denegado', detail: resultado.mensaje, life: 3000 })
    }
}
</script>

<template>
    <div class="min-h-screen w-full font-sans bg-[#0c0c12] relative">

        <Header />

        <main class="p-4 mx-auto w-full max-w-3xl flex flex-col gap-8 mt-4">

            <header class="text-center md:text-left">
                <h1 class="text-3xl font-black italic text-white uppercase tracking-wider">
                    Tus <span class="text-emerald-500">Ligas</span>
                </h1>
                <p class="text-zinc-500 text-sm tracking-widest uppercase mt-1">Selecciona tu paddock para continuar</p>
            </header>

            <div class="flex flex-col sm:flex-row gap-4">
                <button @click="mostrarModalCrear = true"
                    class="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <i class="pi pi-plus-circle text-lg"></i>
                    Crear Nueva Liga
                </button>
                <button @click="mostrarModalUnirse = true"
                    class="flex-1 bg-[#15151E] hover:bg-zinc-800 border border-zinc-700 text-white font-black uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                    <i class="pi pi-sign-in text-lg"></i>
                    Unirse con Código
                </button>
            </div>

            <section v-if="store.ligasDetalles && store.ligasDetalles.length > 0" class="flex flex-col gap-4">
                <h2
                    class="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2 mb-2">
                    Ligas Activas</h2>

                <div v-for="liga in store.ligasDetalles" :key="liga.id" @click="entrarLiga(liga.id)"
                    class="bg-[#15151E] border border-zinc-800 hover:border-emerald-500/50 rounded-xl p-5 cursor-pointer group transition-all duration-300 relative overflow-hidden">
                    <div
                        class="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity">
                    </div>

                    <div class="flex items-center justify-between relative z-10">
                        <div class="flex flex-col gap-1">
                            <div class="flex items-center gap-2">
                                <h3 class="text-xl font-black text-white italic uppercase">{{ liga.nombre }}</h3>
                            </div>
                            <span class="text-xs text-zinc-400 font-medium">
                                <i class="pi pi-users text-[10px] mr-1"></i> {{ liga.participantes }} Participantes
                            </span>
                        </div>
                        <i
                            class="pi pi-chevron-right text-zinc-600 group-hover:text-emerald-500 transition-colors ml-2"></i>
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

        <div v-if="mostrarModalCrear"
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div
                class="bg-[#15151E] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-[fade-in_0.2s_ease-out]">
                <div class="p-6">
                    <h3
                        class="text-xl font-black text-white italic uppercase tracking-wider mb-4 border-b border-zinc-800 pb-3">
                        <i class="pi pi-trophy text-emerald-500 mr-2"></i> Fundar Escudería
                    </h3>
                    <p class="text-sm text-zinc-400 mb-4">Serás el administrador de esta liga. Podrás invitar a tus
                        amigos pasándoles el código secreto.</p>

                    <div class="flex flex-col gap-2 mb-6">
                        <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nombre de la
                            Liga</label>
                        <input v-model="nombreNuevaLiga" type="text" placeholder="Ej: Amigos de la Uni"
                            class="bg-zinc-900 border border-zinc-700 text-white rounded-lg p-3 outline-none focus:border-emerald-500 transition-colors"
                            @keyup.enter="ejecutarCrearLiga" />
                    </div>

                    <div class="flex gap-3">
                        <button @click="mostrarModalCrear = false"
                            class="flex-1 bg-transparent border border-zinc-700 hover:bg-zinc-800 text-white font-bold py-3 rounded-lg transition-colors">Cancelar</button>
                        <button @click="ejecutarCrearLiga" :disabled="procesando"
                            class="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black py-3 rounded-lg transition-colors disabled:opacity-50">
                            <i v-if="procesando" class="pi pi-spin pi-spinner mr-2"></i> Crear
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="mostrarModalUnirse"
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div
                class="bg-[#15151E] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-[fade-in_0.2s_ease-out]">
                <div class="p-6">
                    <h3
                        class="text-xl font-black text-white italic uppercase tracking-wider mb-4 border-b border-zinc-800 pb-3">
                        <i class="pi pi-key text-emerald-500 mr-2"></i> Código de Acceso
                    </h3>

                    <div class="flex flex-col gap-2 mb-6">
                        <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Introduce el código
                            de 6 caracteres</label>
                        <input v-model="codigoUnirse" type="text" maxlength="6" placeholder="Ej: A8F3X9"
                            class="bg-zinc-900 border border-zinc-700 text-white rounded-lg p-3 outline-none focus:border-emerald-500 transition-colors uppercase text-center font-mono text-xl tracking-widest"
                            @keyup.enter="ejecutarUnirseLiga" />
                    </div>

                    <div class="flex gap-3">
                        <button @click="mostrarModalUnirse = false"
                            class="flex-1 bg-transparent border border-zinc-700 hover:bg-zinc-800 text-white font-bold py-3 rounded-lg transition-colors">Cancelar</button>
                        <button @click="ejecutarUnirseLiga" :disabled="procesando"
                            class="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black py-3 rounded-lg transition-colors disabled:opacity-50">
                            <i v-if="procesando" class="pi pi-spin pi-spinner mr-2"></i> Entrar
                        </button>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>