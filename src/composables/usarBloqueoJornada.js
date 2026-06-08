import { ref, onMounted, onUnmounted } from 'vue'
import {
  obtenerSiguienteGranPremio,
  obtenerUltimoGranPremioFinalizado,
} from '@/services/servicioOpenF1'
import { suscribirseHistorialJornadas } from '@/services/servicioJornada'

/**
 * Determina en tiempo real si el garaje debe permanecer bloqueado porque hay
 * una jornada pendiente de procesar.
 *
 * El bloqueo se ancla al "Gran Premio en juego": el Gran Premio más reciente
 * cuyo fin de semana ya ha comenzado.
 *  - Si el próximo Gran Premio ya ha arrancado (`fechaInicio` ≤ ahora), ese es
 *    el Gran Premio en juego (está en curso).
 *  - Si el próximo Gran Premio todavía es futuro, el Gran Premio en juego es el
 *    último que ya ha finalizado.
 *
 * El garaje sigue bloqueado mientras ese Gran Premio no figure en la colección
 * `jornadas` de Firestore, es decir, mientras no se hayan publicado sus
 * resultados. Así se cubre también la ventana entre el final de la carrera y el
 * procesamiento de la jornada, durante la cual el equipo no debe tocarse.
 *
 * Se suscribe a `jornadas` para levantar el bloqueo en cuanto el backend
 * registre el procesamiento, sin necesidad de recargar la página.
 *
 * `jornadaIniciada` se inicializa como `null` (estado desconocido) para evitar
 * mostrar el banner de bloqueo durante la carga inicial. Solo pasa a `true`
 * cuando se confirma que hay un Gran Premio en juego sin procesar.
 *
 * @returns {{ jornadaIniciada: import('vue').Ref<boolean|null>, mensajeBloqueoJornada: string }}
 */
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
