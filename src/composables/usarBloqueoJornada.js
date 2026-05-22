/**
 * Determina si la jornada actual de F1 ya ha comenzado para bloquear
 * acciones del usuario (equipar cartas, ejecutar cláusulas).
 *
 * Política conservadora: arranca BLOQUEADA y sólo se desbloquea cuando
 * OpenF1 confirma que el próximo Gran Premio aún no ha comenzado.
 * Cualquier fallo de red, CORS o restricción ("Live F1 session in progress")
 * mantiene el bloqueo activo.
 *
 * @returns {{ jornadaIniciada: import('vue').Ref<boolean>, mensajeBloqueoJornada: string }}
 */
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
