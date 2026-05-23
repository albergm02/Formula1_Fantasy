import { ref, onMounted, onUnmounted } from 'vue'
import { obtenerSiguienteGranPremio } from '@/services/servicioOpenF1'

export function usarBloqueoJornada() {
  const jornadaIniciada = ref(true)
  let intervaloId = null

  const mensajeBloqueoJornada =
    'La jornada ya ha comenzado. No puedes modificar tu equipo ni ejecutar cláusulas hasta que finalice el Gran Premio.'

  const evaluarEstadoJornada = async () => {
    try {
      const proximoGranPremio = await obtenerSiguienteGranPremio()
      if (!proximoGranPremio?.fechaInicio) {
        jornadaIniciada.value = true
        return
      }
      jornadaIniciada.value = new Date(proximoGranPremio.fechaInicio) <= new Date()
    } catch {
      jornadaIniciada.value = true
    }
  }

  onMounted(async () => {
    await evaluarEstadoJornada()
    intervaloId = setInterval(evaluarEstadoJornada, 60_000)
  })

  onUnmounted(() => {
    if (intervaloId) {
      clearInterval(intervaloId)
      intervaloId = null
    }
  })

  return { jornadaIniciada, mensajeBloqueoJornada }
}
