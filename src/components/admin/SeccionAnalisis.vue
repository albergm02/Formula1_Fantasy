<script setup>
import Card from 'primevue/card'
import Message from 'primevue/message'
import Button from 'primevue/button'

const urlPanelAnalytics =
    'https://console.firebase.google.com/u/0/project/formula1-fantasy-ba348/analytics/app/web:ZmFkZWNlNDEtNjRlZC00YmViLWJjZTUtNWE1Zjc1MDg5NmU2/overview?hl=es-419'

function abrirPanelAnalytics() {
    window.open(urlPanelAnalytics, '_blank', 'noopener,noreferrer')
}
</script>

<template>
    <div class="space-y-4">
        <Message severity="info" :closable="false" class="!bg-[#1A1A1F] !border-zinc-700">
            <p class="text-xs">
                Las métricas agregadas de uso (sesiones activas, retención, embudo de registro,
                eventos personalizados) se consultan directamente en el panel de
                <strong>Firebase Analytics</strong>. La consola de Firebase no permite embeber
                sus gráficos por motivos de seguridad, por lo que esta pestaña expone únicamente
                el acceso rápido al dashboard externo.
            </p>
        </Message>

        <Card class="!bg-[#1A1A1F] !text-[#F0ECEC] border border-zinc-800">
            <template #title>
                <span class="text-sm">Panel de Firebase Analytics</span>
            </template>
            <template #content>
                <p class="text-xs text-zinc-400 mb-3">
                    Abre el dashboard oficial del proyecto en una pestaña nueva. Allí podrás
                    filtrar por fechas, exportar informes y configurar audiencias.
                </p>
                <Button @click="abrirPanelAnalytics" label="Abrir panel externo" size="small"
                    class="!bg-[#E10600] !border-[#E10600] hover:!bg-red-700" />
            </template>
        </Card>
    </div>
</template>
