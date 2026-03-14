<template>
    <Header />

    <div class="p-6 max-w-5xl mx-auto">
        <header class="mb-8">
            <h1 class="text-4xl font-bold text-white mb-2">Bienvenido, {{ authStore.usuarioGlobal.nombre }}</h1>
            <p class="text-zinc-400">Gestiona tus competiciones y escuderías.</p>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

            <section class="md:col-span-2 space-y-4">
                <h2 class="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                    <i class="pi pi-flag-fill text-emerald-500"></i> Tus Ligas
                </h2>

                <div v-if="ligasStore.ligasDetalles.length > 0" class="grid gap-4">
                    <Card v-for="liga in ligasStore.ligasDetalles" :key="liga.id"
                        class="overflow-hidden border border-zinc-800 bg-zinc-900/50">
                        <template #content>
                            <div class="flex justify-between items-center">
                                <div>
                                    <h3 class="text-xl font-bold text-white">{{ liga.nombre }}</h3>
                                    <div class="flex gap-4 mt-1 text-sm text-zinc-500">
                                        <span><i class="pi pi-users mr-1"></i> {{ liga.participantes }}
                                            pilotos</span>
                                        <span><i class="pi pi-key mr-1"></i> {{ liga.codigo_invitacion }}</span>
                                    </div>
                                </div>
                                <Button label="ENTRAR" icon="pi pi-external-link" severity="success" raised
                                    @click="entrarEnLiga(liga.id)" />
                            </div>
                        </template>
                    </Card>
                </div>

                <Message v-else severity="secondary" :closable="false" icon="pi pi-info-circle">
                    No perteneces a ninguna liga todavía. ¡Crea una o únete a tus amigos!
                </Message>
            </section>

            <section class="space-y-6">
                <h2 class="text-xl font-semibold text-white mb-4">Acciones</h2>

                <Card class="border border-zinc-800 bg-zinc-900/50">
                    <template #title><span class="text-sm uppercase tracking-wider text-emerald-500">Nueva
                            Liga</span></template>
                    <template #content>
                        <div class="flex flex-col gap-3">
                            <InputText v-model="nombreNuevaLiga" placeholder="Nombre de la liga" class="w-full" />
                            <Button label="Crear Campeonato" icon="pi pi-plus" class="w-full" @click="crearLiga" />
                        </div>
                    </template>
                </Card>

                <Card class="border border-zinc-800 bg-zinc-900/50">
                    <template #title><span
                            class="text-sm uppercase tracking-wider text-blue-500">Unirse</span></template>
                    <template #content>
                        <div class="flex flex-col gap-3">
                            <InputText v-model="codigoUnion" placeholder="Código de invitación"
                                class="w-full uppercase" />
                            <Button label="Unirse a Liga" icon="pi pi-sign-in" severity="secondary" outlined
                                class="w-full" @click="unirseALiga" />
                        </div>
                    </template>
                </Card>
            </section>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'

import { useLigasStore } from '@/stores/storeLigas'
import { useAuthStore } from '@/stores/storeAuth'
import Header from '@/components/Header.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'

const authStore = useAuthStore()
const ligasStore = useLigasStore()

const router = useRouter()
const toast = useToast()

const nombreNuevaLiga = ref('')
const codigoUnion = ref('')
const cargando = ref(false)


onMounted(async () => {
    cargando.value = true
    await ligasStore.cargarMisLigas()
    cargando.value = false
})

const crearLiga = async (nombre) => {
    if (nombreNuevaLiga.value.trim().length < 3) {
        toast.add({ severity: 'warn', summary: 'Nombre inválido', detail: 'El nombre debe tener al menos 3 caracteres', life: 3000 })
        return
    }

    const resultado = await ligasStore.crearLiga(nombreNuevaLiga.value)
    if (resultado.exito) {
        toast.add({ severity: 'success', summary: '¡Liga creada!', detail: resultado.mensaje, life: 3000 })
        nombreNuevaLiga.value = ''
    } else {
        toast.add({ severity: 'error', summary: 'Error al crear liga', detail: resultado.mensaje, life: 3000 })
    }
}

const unirseALiga = async () => {
    if (!codigoUnion.value) return
    const resultado = await ligasStore.unirseALiga(codigoUnion.value)
    console.log('Resultado de unirseALiga:', resultado)
    if (resultado.exito) {
        toast.add({ severity: 'success', summary: '¡Bienvenido a la liga!', detail: resultado.mensaje, life: 3000 })
        codigoUnion.value = ''
    } else {
        toast.add({ severity: 'error', summary: 'Error al unirse', detail: resultado.mensaje, life: 3000 })
    }
}

const entrarEnLiga = (ligaId) => {
    router.push({ name: 'inicio', query: { liga: ligaId } })
}
</script>
