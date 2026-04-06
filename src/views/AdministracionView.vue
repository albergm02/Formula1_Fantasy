<script setup>
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'

const toast = useToast()

const procesando = ref(false)
const resultadoJornada = ref({})
const jornadaProcesada = ref(false)

const URL_CLOUD_FUNCTION = 'https://europe-west1-formula1-fantasy-ba348.cloudfunctions.net/procesarJornadaGP'

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
</script>

<!---------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!---------------------------------------------------------------------------------------------------------------------------->

<template>
    <div class="min-h-screen bg-[#0C0C0E] text-[#F0ECEC] flex items-center justify-center">
        <Card class="!bg-[#1A1A1F] !border-none w-full max-w-md mx-4">
            <template #content>
                <div class="flex flex-col gap-4">
                    <Button label="Procesar jornada" :loading="procesando" @click="procesarJornada"
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
                </div>
            </template>
        </Card>
    </div>
</template>
