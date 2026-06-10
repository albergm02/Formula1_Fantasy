import { ref, onMounted, onUnmounted } from 'vue'
import {
  obtenerSiguienteGranPremio,
  obtenerUltimoGranPremioFinalizado,
} from '@/services/servicioOpenF1'
import { suscribirseHistorialJornadas } from '@/services/servicioJornada'

// Bloquea el garaje mientras el "Gran Premio en juego" (el más reciente cuyo
// fin de semana ya ha comenzado) no figure en la colección `jornadas`.
// El valor inicial null evita mostrar el banner durante la carga.
export function usarBloqueoJornada() {
  const jornadaIniciada = ref(null)

  const mensajeBloqueoJornada =
    'El último Gran Premio aún no tiene los resultados procesados. No puedes modificar tu equipo ni ejecutar cláusulas hasta que se publique la jornada.'

  let meetingKeyEnJuego = null
  let cancelarSuscripcion = null

  const evaluarBloqueo = (jornadasProcesadas) => {
    if (!meetingKeyEnJuego) {
      jornadaIniciada.value = false
      return
    }
    const yaFueProcesada = jornadasProcesadas.some((j) => j.meetingKey === meetingKeyEnJuego)
    jornadaIniciada.value = !yaFueProcesada
  }

  const obtenerMeetingKeyEnJuego = async () => {
    const ahora = new Date()
    const granPremioSiguiente = await obtenerSiguienteGranPremio()
    if (granPremioSiguiente?.fechaInicio && new Date(granPremioSiguiente.fechaInicio) <= ahora) {
      return granPremioSiguiente.meetingKey
    }
    const granPremioFinalizado = await obtenerUltimoGranPremioFinalizado()
    return granPremioFinalizado?.meetingKey ?? null
  }

  onMounted(async () => {
    try {
      meetingKeyEnJuego = await obtenerMeetingKeyEnJuego()
    } catch {
      jornadaIniciada.value = false
      return
    }

    cancelarSuscripcion = suscribirseHistorialJornadas((jornadas) => {
      evaluarBloqueo(jornadas)
    }, 5)
  })

  onUnmounted(() => {
    cancelarSuscripcion?.()
  })

  return { jornadaIniciada, mensajeBloqueoJornada }
}
