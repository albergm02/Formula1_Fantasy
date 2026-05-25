import { ref, onMounted, onUnmounted } from 'vue'
import { obtenerSiguienteGranPremio } from '@/services/servicioOpenF1'
import { suscribirseHistorialJornadas } from '@/services/servicioJornada'

/**
 * Determina en tiempo real si la jornada está en curso (bloqueo activo).
 *
 * Un fin de semana se considera "en curso" si:
 *  1. El GP ya ha comenzado (`fechaInicio` ≤ ahora), Y
 *  2. Aún no aparece en la colección `jornadas` de Firestore (no procesado).
 *
 * Se suscribe a `jornadas` para levantar el bloqueo en cuanto el backend
 * registre el procesamiento, sin necesidad de recargar la página.
 *
 * `jornadaIniciada` se inicializa como `null` (estado desconocido) para
 * evitar mostrar el banner de bloqueo durante la carga inicial. Solo pasa
 * a `true` cuando se confirma que el GP está activo y sin procesar.
 *
 * @returns {{ jornadaIniciada: import('vue').Ref<boolean|null>, mensajeBloqueoJornada: string }}
 */
export function usarBloqueoJornada() {
  const jornadaIniciada = ref(null)

  const mensajeBloqueoJornada =
    'La jornada ya ha comenzado. No puedes modificar tu equipo ni ejecutar cláusulas hasta que finalice el Gran Premio.'

  let meetingKeyActivo = null
  let cancelarSuscripcion = null

  const evaluarBloqueo = (jornadasProcesadas) => {
    if (!meetingKeyActivo) {
      jornadaIniciada.value = false
      return
    }
    const yaFueProcesada = jornadasProcesadas.some((j) => j.meetingKey === meetingKeyActivo)
    jornadaIniciada.value = !yaFueProcesada
  }

  onMounted(async () => {
    try {
      const gpSiguiente = await obtenerSiguienteGranPremio()
      const ahora = new Date()
      if (gpSiguiente?.fechaInicio && new Date(gpSiguiente.fechaInicio) <= ahora) {
        meetingKeyActivo = gpSiguiente.meetingKey
      }
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
