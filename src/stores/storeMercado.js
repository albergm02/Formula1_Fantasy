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
import { cargarMercadoActivo, registrarPuja, cargarMisPujas, cargarResumenPujas } from '@/services/servicioMercado'
import { usarStoreAutenticacion } from '@/stores/storeAutenticacion'
import { usarStoreEscuderia } from '@/stores/storeEquipo'

export const usarStoreMercado = defineStore('mercado', () => {
  /* ─── Estado reactivo ─────────────────────────────────────────────────── */

  /** Documento completo del mercado activo (null si no hay mercado abierto) */
  const mercadoActivo = ref(null)

  /** Indica si se está cargando el mercado desde Firestore */
  const cargandoMercado = ref(false)

  /** Milisegundos restantes hasta el cierre del mercado (se actualiza cada segundo) */
  const milisegundosRestantes = ref(0)

  /** Mapa idCarta → cantidad de la puja del usuario actual */
  const misPujas = ref({})

  /** Mapa idCarta → { mejorPuja, totalPujas } con el resumen de todas las pujas */
  const resumenPujas = ref({})

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

        const storeAuth = usarStoreAutenticacion()
        const email = storeAuth.usuarioActual?.correoAutenticacion
        if (email) {
          misPujas.value = await cargarMisPujas(mercadoActivo.value.id, email)
        }
        resumenPujas.value = await cargarResumenPujas(mercadoActivo.value.id)
      }
    } finally {
      cargandoMercado.value = false
    }
  }

  /**
   * Realiza una puja sobre una carta del mercado.
   * Valida que la cantidad sea >= precio base y que el usuario tenga presupuesto.
   * @param {Object} carta - La carta sobre la que se puja.
   * @param {number} cantidad - Cantidad ofertada.
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async function pujarPorCarta(carta, cantidad) {
    const storeAuth = usarStoreAutenticacion()
    const storeEscuderia = usarStoreEscuderia()

    const cantidadNum = Number(cantidad)
    if (isNaN(cantidadNum) || cantidadNum < carta.precio) {
      return { success: false, message: `La puja mínima es ${carta.precio}M (precio base).` }
    }
    if (cantidadNum > storeEscuderia.presupuesto) {
      return { success: false, message: 'No tienes suficiente presupuesto para esta puja.' }
    }

    const email = storeAuth.usuarioActual.correoAutenticacion
    const idParticipante = storeEscuderia.idParticipanteActivo

    await registrarPuja(mercadoActivo.value.id, carta, email, idParticipante, cantidadNum)

    misPujas.value[carta.id] = cantidadNum

    if (!resumenPujas.value[carta.id] || cantidadNum > resumenPujas.value[carta.id].mejorPuja) {
      resumenPujas.value[carta.id] = {
        mejorPuja: cantidadNum,
        totalPujas: (resumenPujas.value[carta.id]?.totalPujas || 0) + (misPujas.value[carta.id] ? 0 : 1),
      }
    }

    return { success: true, message: `Puja de ${cantidadNum.toFixed(2)}M registrada sobre ${carta.nombre}.` }
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
    misPujas,
    resumenPujas,

    /* Computed */
    hayMercadoAbierto,
    pilotosMercado,
    cochesMercado,
    potenciadoresMercado,
    textoCuentaAtras,

    /* Acciones */
    inicializarMercado,
    pujarPorCarta,
    detenerCuentaAtras,
  }
})
