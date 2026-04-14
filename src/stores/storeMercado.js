/**
 * Store del mercado diario — Pinia Setup Store.
 *
 * Responsabilidades:
 *  - Cargar el mercado activo desde Firestore (vía servicioMercado).
 *  - Exponer las cartas agrupadas por tipo (pilotos, coches, potenciadores).
 *  - Mantener una cuenta atrás reactiva hasta el cierre del mercado.
 *
 * @module storeMercado
 */
import { ref, computed, onUnmounted } from 'vue'
import { defineStore } from 'pinia'
import { cargarMercadoActivo } from '@/services/servicioMercado'

export const usarStoreMercado = defineStore('mercado', () => {
  /* ─── Estado reactivo ─────────────────────────────────────────────────── */

  /** Documento completo del mercado activo (null si no hay mercado abierto) */
  const mercadoActivo = ref(null)

  /** Indica si se está cargando el mercado desde Firestore */
  const cargandoMercado = ref(false)

  /** Milisegundos restantes hasta el cierre del mercado (se actualiza cada segundo) */
  const milisegundosRestantes = ref(0)

  /** ID del intervalo de la cuenta atrás (para limpiarlo al desmontar) */
  let intervaloId = null

  /* ─── Computed: cartas agrupadas por tipo ──────────────────────────────── */

  /** Indica si hay un mercado abierto actualmente */
  const hayMercadoAbierto = computed(() => {
    return mercadoActivo.value !== null && mercadoActivo.value.estado === 'abierto'
  })

  /** Cartas de piloto del mercado actual */
  const pilotosMercado = computed(() => {
    if (!mercadoActivo.value) return []
    return mercadoActivo.value.cartas.filter((carta) => carta.tipoCarta === 'piloto')
  })

  /** Cartas de coche del mercado actual */
  const cochesMercado = computed(() => {
    if (!mercadoActivo.value) return []
    return mercadoActivo.value.cartas.filter((carta) => carta.tipoCarta === 'coche')
  })

  /** Cartas de potenciador del mercado actual */
  const potenciadoresMercado = computed(() => {
    if (!mercadoActivo.value) return []
    return mercadoActivo.value.cartas.filter((carta) => carta.tipoCarta === 'potenciador')
  })

  /** Texto formateado de la cuenta atrás: "HHh MMm SSs" */
  const textoCuentaAtras = computed(() => {
    const ms = milisegundosRestantes.value
    if (ms <= 0) return 'Mercado cerrado'

    const horas = Math.floor(ms / (1000 * 60 * 60))
    const minutos = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    const segundos = Math.floor((ms % (1000 * 60)) / 1000)

    return `${String(horas).padStart(2, '0')}h ${String(minutos).padStart(2, '0')}m ${String(segundos).padStart(2, '0')}s`
  })

  /* ─── Acciones ────────────────────────────────────────────────────────── */

  /**
   * Inicia la cuenta atrás reactiva que se actualiza cada segundo.
   * Calcula la diferencia entre ahora y la fechaCierre del mercado activo.
   */
  function iniciarCuentaAtras() {
    detenerCuentaAtras()

    if (!mercadoActivo.value || !mercadoActivo.value.fechaCierre) return

    const actualizarRestante = () => {
      const cierre = new Date(mercadoActivo.value.fechaCierre).getTime()
      const ahora = Date.now()
      milisegundosRestantes.value = Math.max(0, cierre - ahora)

      /* Si llega a 0, detenemos el intervalo y marcamos como cerrado */
      if (milisegundosRestantes.value <= 0) {
        detenerCuentaAtras()
        mercadoActivo.value.estado = 'cerrado'
      }
    }

    actualizarRestante()
    intervaloId = setInterval(actualizarRestante, 1000)
  }

  /** Detiene la cuenta atrás si está activa */
  function detenerCuentaAtras() {
    if (intervaloId) {
      clearInterval(intervaloId)
      intervaloId = null
    }
  }

  /**
   * Carga el mercado activo de la liga desde Firestore e inicia la cuenta atrás.
   * Si no hay mercado abierto, mercadoActivo queda en null.
   * @param {string} idLiga - ID de la liga activa del usuario.
   */
  async function inicializarMercado(idLiga) {
    cargandoMercado.value = true
    try {
      mercadoActivo.value = await cargarMercadoActivo(idLiga)

      if (mercadoActivo.value) {
        iniciarCuentaAtras()
      }
    } finally {
      cargandoMercado.value = false
    }
  }

  /** Limpia el intervalo cuando el componente que usa el store se desmonta */
  onUnmounted(() => {
    detenerCuentaAtras()
  })

  return {
    /* Estado */
    mercadoActivo,
    cargandoMercado,
    milisegundosRestantes,

    /* Computed */
    hayMercadoAbierto,
    pilotosMercado,
    cochesMercado,
    potenciadoresMercado,
    textoCuentaAtras,

    /* Acciones */
    inicializarMercado,
    detenerCuentaAtras,
  }
})
