<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { cerrarSesion } from '@/services/servicioAutenticacion'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'

const enrutador = useRouter()
const toast = useToast()

const procesando = ref(false)
const resultadoJornada = ref({})
const jornadaProcesada = ref(false)

const generandoMercado = ref(false)
const resultadoMercado = ref({})
const mercadoGenerado = ref(false)

const URL_CLOUD_FUNCTION = 'https://europe-west1-formula1-fantasy-ba348.cloudfunctions.net/procesarJornadaGP'
const URL_GENERAR_MERCADO = 'https://europe-west1-formula1-fantasy-ba348.cloudfunctions.net/generarMercadoDiarioHttp'

async function manejarCerrarSesion() {
    await cerrarSesion()
    enrutador.push({ name: 'login' })
}

/**
 * Invoca la Cloud Function HTTP para procesar la jornada del último GP finalizado.
 * Muestra el resultado devuelto por el servidor.
 * @returns {Promise<void>}
 */
async function procesarJornada() {
    procesando.value = true
    jornadaProcesada.value = false

    try {
        const respuesta = await fetch(URL_CLOUD_FUNCTION)
        const datos = await respuesta.json()

        if (!respuesta.ok) {
            throw new Error(datos.error || `Error del servidor: ${respuesta.status}`)
        }

        resultadoJornada.value = datos
        jornadaProcesada.value = true

        toast.add({
            severity: 'success',
            summary: 'Jornada procesada',
            detail: datos.mensaje,
            life: 5000,
        })
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error al procesar jornada',
            detail: error.message,
            life: 5000,
        })
        throw new Error(`Error al procesar la jornada: ${error.message}`)
    } finally {
        procesando.value = false
    }
}

/**
 * Invoca la Cloud Function HTTP para generar el mercado diario de cartas.
 * Si el mercado de hoy ya existe, la función es idempotente y lo indica.
 * @returns {Promise<void>}
 */
async function generarMercado() {
    generandoMercado.value = true
    mercadoGenerado.value = false

    try {
        const respuesta = await fetch(URL_GENERAR_MERCADO)
        const datos = await respuesta.json()

        if (!respuesta.ok) {
            throw new Error(datos.error || `Error del servidor: ${respuesta.status}`)
        }

        resultadoMercado.value = datos
        mercadoGenerado.value = true

        toast.add({
            severity: datos.omitido ? 'warn' : 'success',
            summary: datos.omitido ? 'Mercado ya existente' : 'Mercado generado',
            detail: datos.mensaje,
            life: 5000,
        })
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error al generar mercado',
            detail: error.message,
            life: 5000,
        })
    } finally {
        generandoMercado.value = false
    }
}
</script>

<!---------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!---------------------------------------------------------------------------------------------------------------------------->

<template>
    <div class="min-h-screen bg-[#0C0C0E] text-[#F0ECEC] flex flex-col">
        <header class="w-full p-3 flex justify-between sticky top-0 z-40 bg-[#1A1A1F] border-b border-[#E10600]">
            <div class="flex items-center gap-2">
                <img src="/logo.png" class="h-8 w-8 object-contain" />
                <span class="font-black italic text-[#E10600] text-lg">F1 FANTASY</span>
            </div>
            <Button @click="manejarCerrarSesion" icon="pi pi-sign-out" text
                class="!text-zinc-400 hover:!text-red-500 cursor-pointer" />
        </header>

        <div class="flex-1 flex items-center justify-center">
            <Card class="!bg-[#1A1A1F] !border-none w-full max-w-md mx-4">
                <template #content>
                    <div class="flex flex-col gap-4">
                        <Button label="Procesar jornada" :loading="procesando" @click="procesarJornada"
                            icon="pi pi-flag-fill"
                            class="!bg-[#E10600] !border-none hover:!bg-[#B30500] w-full" />

                        <Message v-if="jornadaProcesada" severity="success" :closable="false">
                            <div class="flex flex-col gap-1">
                                <span class="font-bold">{{ resultadoJornada.mensaje }}</span>
                                <span v-if="resultadoJornada.granPremio">
                                    Gran Premio: {{ resultadoJornada.granPremio }}
                                </span>
                                <span v-if="resultadoJornada.participacionesProcesadas !== undefined">
                                    Participaciones procesadas: {{ resultadoJornada.participacionesProcesadas }}
                                </span>
                            </div>
                        </Message>

                        <div class="h-px bg-zinc-700 my-2"></div>

                        <Button label="Generar mercado diario" :loading="generandoMercado" @click="generarMercado"
                            icon="pi pi-shop"
                            class="!bg-amber-600 !border-none hover:!bg-amber-700 w-full" />

                        <Message v-if="mercadoGenerado" :severity="resultadoMercado.omitido ? 'warn' : 'success'" :closable="false">
                            <div class="flex flex-col gap-1">
                                <span class="font-bold">{{ resultadoMercado.mensaje }}</span>
                                <span v-if="resultadoMercado.totalCartas">
                                    Cartas en el mercado: {{ resultadoMercado.totalCartas }}
                                </span>
                                <span v-if="resultadoMercado.fechaCierre">
                                    Cierre: {{ new Date(resultadoMercado.fechaCierre).toLocaleString() }}
                                </span>
                            </div>
                        </Message>
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>
