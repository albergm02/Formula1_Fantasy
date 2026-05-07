/**
 * storeOnboarding.js — Estado global del recorrido guiado interactivo.
 *
 * Coordina la secuencia de pasos del onboarding (qué elemento se resalta,
 * qué texto se muestra, en qué paso vamos) y persiste en `localStorage`
 * la marca de "ya visto" para no repetirlo en cada sesión.
 *
 * Las vistas y componentes solo etiquetan elementos con el atributo HTML
 * `data-tour="<identificador>"`. El componente `TourOnboarding.vue` consume
 * este store para localizar cada elemento y dibujar el resaltado.
 *
 * @module stores/storeOnboarding
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const CLAVE_LOCAL_STORAGE = 'f1fantasy:onboarding:visto'

/**
 * Pasos canónicos del recorrido. El orden importa: define la narrativa
 * que recorrerá el usuario al pulsar "siguiente". Cada paso apunta a un
 * elemento concreto del DOM mediante su `objetivo` (= valor del atributo
 * `data-tour`). Si un paso no tiene `objetivo`, se muestra centrado.
 */
const pasosCanonicos = [
  {
    objetivo: null,
    titulo: '¡Bienvenido al paddock!',
    texto:
      'Te explico en menos de un minuto cómo gestionar tu escudería. Pulsa "Siguiente" para empezar.',
  },
  {
    objetivo: 'logo',
    titulo: 'Volver al inicio',
    texto: 'Toca el logo para regresar al panel principal de tu liga activa en cualquier momento.',
  },
  {
    objetivo: 'estadisticas',
    titulo: 'Tu escudería en directo',
    texto:
      'Aquí ves tus puntos totales, tu presupuesto disponible y las pujas comprometidas en el mercado.',
  },
  {
    objetivo: 'boton-ligas',
    titulo: 'Tus ligas',
    texto: 'Cambia entre tus ligas o únete a una nueva desde este botón.',
  },
  {
    objetivo: 'boton-ayuda',
    titulo: 'Reactivar este tutorial',
    texto: 'Si quieres volver a ver esta guía en el futuro, pulsa este botón cuando lo necesites.',
  },
  {
    objetivo: 'nav-inicio',
    titulo: 'Panel de inicio',
    texto: 'Resumen del próximo Gran Premio, jornada activa y tu rendimiento reciente.',
  },
  {
    objetivo: 'nav-ranking',
    titulo: 'Clasificación',
    texto: 'Compara tus puntos con el resto de participantes de la liga.',
  },
  {
    objetivo: 'nav-garaje',
    titulo: 'Tu garaje',
    texto: 'Pilotos, coche y potenciadores fichados. Aquí gestionas tu plantilla titular.',
  },
  {
    objetivo: 'nav-mercado',
    titulo: 'Mercado de fichajes',
    texto: 'Puja por nuevos pilotos y desbloquea cláusulas de los rivales.',
  },
  {
    objetivo: 'nav-noticias',
    titulo: 'Noticias del Gran Premio',
    texto: 'Resultados oficiales y desglose de puntos de la última jornada disputada.',
  },
  {
    objetivo: 'nav-alertas',
    titulo: 'Notificaciones',
    texto: 'Avisos de pujas resueltas, fichajes y eventos relevantes en tus ligas.',
  },
  {
    objetivo: null,
    titulo: '¡Listo para correr!',
    texto: 'Ya conoces lo esencial. Que comience la temporada — y suerte ahí fuera.',
  },
]

export const usarStoreOnboarding = defineStore('onboarding', () => {
  const activo = ref(false)
  const indicePaso = ref(0)

  const pasoActual = computed(() => pasosCanonicos[indicePaso.value] || null)
  const totalPasos = computed(() => pasosCanonicos.length)
  const esPrimerPaso = computed(() => indicePaso.value === 0)
  const esUltimoPaso = computed(() => indicePaso.value === pasosCanonicos.length - 1)

  const fueVistoPreviamente = () => {
    try {
      return localStorage.getItem(CLAVE_LOCAL_STORAGE) === 'true'
    } catch {
      return false
    }
  }

  const marcarComoVisto = () => {
    try {
      localStorage.setItem(CLAVE_LOCAL_STORAGE, 'true')
    } catch {
      // Almacenamiento local bloqueado: el tour reaparecerá en futuras sesiones.
    }
  }

  const iniciar = () => {
    indicePaso.value = 0
    activo.value = true
  }

  const iniciarSiNoVisto = () => {
    if (fueVistoPreviamente()) return
    iniciar()
  }

  const avanzar = () => {
    if (esUltimoPaso.value) {
      terminar()
      return
    }
    indicePaso.value++
  }

  const retroceder = () => {
    if (esPrimerPaso.value) return
    indicePaso.value--
  }

  const terminar = () => {
    activo.value = false
    indicePaso.value = 0
    marcarComoVisto()
  }

  return {
    activo,
    indicePaso,
    pasoActual,
    totalPasos,
    esPrimerPaso,
    esUltimoPaso,
    iniciar,
    iniciarSiNoVisto,
    avanzar,
    retroceder,
    terminar,
  }
})
