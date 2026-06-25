/**
 * @module StoreMercado
 * @description Estado global para el mercado de cartas.
 */
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { suscribirMercadoActivo, registrarPuja, eliminarPuja, cargarMisPujas, cargarResumenPujas } from '@/services/servicioMercado'
import { usarStorePerfil } from '@/stores/storePerfil'

/**
 * Store para manejar el mercado de cartas, incluyendo la actividad del mercado, las pujas del usuario y el resumen de pujas.
 *
 * @returns {Object} - Contiene el estado del mercado, las pujas del usuario, el resumen de pujas y funciones para inicializar y gestionar el mercado.
 */
export const usarStoreMercado = defineStore('mercado', () => {
  const mercadoActivo = ref(null)
  const cargandoMercado = ref(false)
  const milisegundosRestantes = ref(0)
  const misPujas = ref({})
  const resumenPujas = ref({})

  let intervaloId = null
  let cancelarListenerMercado = null
  let idLigaActual = null

  const hayMercadoAbierto = computed(
    () => mercadoActivo.value !== null && mercadoActivo.value.estado === 'abierto' && milisegundosRestantes.value > 0,
  )

  const pilotosMercado = computed(() =>
    mercadoActivo.value ? mercadoActivo.value.cartas.filter((carta) => carta.tipoCarta === 'piloto') : [],
  )
  const cochesMercado = computed(() =>
    mercadoActivo.value ? mercadoActivo.value.cartas.filter((carta) => carta.tipoCarta === 'coche') : [],
  )
  const potenciadoresMercado = computed(() =>
    mercadoActivo.value ? mercadoActivo.value.cartas.filter((carta) => carta.tipoCarta === 'potenciador') : [],
  )

  /**
   * Texto que muestra la cuenta atrás del mercado.
   * @returns {string} - Texto de la cuenta atrás.
   */
  const textoCuentaAtras = computed(() => {
    const ms = milisegundosRestantes.value
    if (ms <= 0) return 'Mercado cerrado'

    const horas = Math.floor(ms / (1000 * 60 * 60))
    const minutos = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    const segundos = Math.floor((ms % (1000 * 60)) / 1000)

    return `${String(horas).padStart(2, '0')}h ${String(minutos).padStart(2, '0')}m ${String(segundos).padStart(2, '0')}s`
  })

  const totalPujasComprometidas = computed(() => Object.values(misPujas.value).reduce((suma, cantidad) => suma + cantidad, 0))

  /**
   * Recalcula los milisegundos restantes hasta el cierre del mercado activo.
   * @function actualizarRestante
   * @memberof module:StoreMercado
   * @returns {void}
   */
  function actualizarRestante() {
    const cierre = new Date(mercadoActivo.value.fechaCierre).getTime()
    milisegundosRestantes.value = Math.max(0, cierre - Date.now())
  }

  /**
   * Inicia la cuenta atrás del mercado.
   * @function iniciarCuentaAtras
   * @memberof module:StoreMercado
   * @returns {void}
   */
  function iniciarCuentaAtras() {
    detenerCuentaAtras()
    if (!mercadoActivo.value || !mercadoActivo.value.fechaCierre) return

    actualizarRestante()
    intervaloId = setInterval(actualizarRestante, 1000)
  }

  /**
   * Detiene la cuenta atrás del mercado si estaba activa.
   * @function detenerCuentaAtras
   * @memberof module:StoreMercado
   * @returns {void}
   */
  function detenerCuentaAtras() {
    if (intervaloId) {
      clearInterval(intervaloId)
      intervaloId = null
    }
  }

  /**
   * Inicializa el mercado para una liga específica.
   * @function inicializarMercado
   * @memberof module:StoreMercado
   * @param {string} idLiga - ID de la liga.
   */
  async function inicializarMercado(idLiga) {
    cargandoMercado.value = true

    if (cancelarListenerMercado) cancelarListenerMercado()
    idLigaActual = idLiga
    mercadoActivo.value = null
    misPujas.value = {}
    resumenPujas.value = {}
    milisegundosRestantes.value = 0

    cancelarListenerMercado = suscribirMercadoActivo(idLiga, async (mercado) => {
      if (idLiga !== idLigaActual) return
      detenerCuentaAtras()
      mercadoActivo.value = mercado
      misPujas.value = {}
      resumenPujas.value = {}

      if (mercado) {
        iniciarCuentaAtras()
        const storePerfil = usarStorePerfil()
        const email = storePerfil.usuarioActual.correoAutenticacion
        try {
          const [pujasUsuario, resumen] = await Promise.all([
            email ? cargarMisPujas(mercado, email) : Promise.resolve({}),
            cargarResumenPujas(mercado),
          ])
          if (idLiga !== idLigaActual) return
          misPujas.value = pujasUsuario
          resumenPujas.value = resumen
        } catch (error) {
          console.error('Error al cargar pujas del mercado:', error)
          misPujas.value = {}
          resumenPujas.value = {}
        }
      }

      cargandoMercado.value = false
    })
  }

  /**
   * Detiene el mercado actual y limpia el estado.
   * @function detenerMercado
   * @memberof module:StoreMercado
   * @returns {void}
   */
  function detenerMercado() {
    detenerCuentaAtras()
    if (cancelarListenerMercado) {
      cancelarListenerMercado()
      cancelarListenerMercado = null
    }
    idLigaActual = null
    mercadoActivo.value = null
    misPujas.value = {}
    resumenPujas.value = {}
    milisegundosRestantes.value = 0
  }

  /**
   * Realiza una puja por una carta en el mercado.
   * @function pujarPorCarta
   * @memberof module:StoreMercado
   * @param {Object} carta - Carta por la que se realiza la puja.
   * @param {number|string} cantidad - Cantidad de la puja.
   * @returns {Promise<Object>} - Resultado de la operación.
   */
  async function pujarPorCarta(carta, cantidad) {
    if (!hayMercadoAbierto.value) {
      return { success: false, message: 'El mercado está cerrado, no se aceptan pujas.' }
    }
    const cantidadNum = Number(cantidad)
    const esPujaExistente = misPujas.value[carta.id] !== undefined

    try {
      await registrarPuja(mercadoActivo.value.idLiga, carta.id, cantidadNum)
    } catch (error) {
      return { success: false, message: error?.message || 'No se pudo registrar la puja.' }
    }

    misPujas.value = { ...misPujas.value, [carta.id]: cantidadNum }

    if (!esPujaExistente) {
      const totalActual = resumenPujas.value[carta.id] || 0
      resumenPujas.value = { ...resumenPujas.value, [carta.id]: totalActual + 1 }
    }

    return { success: true, message: `Puja de ${cantidadNum.toFixed(2)}M registrada sobre ${carta.nombre}.` }
  }

  /**
   * Elimina una puja realizada por el usuario sobre una carta en el mercado.
   * @function eliminarPujaCarta
   * @memberof module:StoreMercado
   * @param {Object} carta - Carta de la que se desea eliminar la puja.
   * @returns {Promise<Object>} - Resultado de la operación.
   */
  async function eliminarPujaCarta(carta) {
    try {
      await eliminarPuja(mercadoActivo.value.idLiga, carta.id)
    } catch (error) {
      return { success: false, message: error?.message || 'No se pudo eliminar la puja.' }
    }

    const { [carta.id]: _, ...restoPujas } = misPujas.value
    misPujas.value = restoPujas

    const totalActual = resumenPujas.value[carta.id] || 0
    resumenPujas.value = { ...resumenPujas.value, [carta.id]: Math.max(0, totalActual - 1) }

    return { success: true, message: `Puja eliminada sobre ${carta.nombre}.` }
  }

  return {
    cargandoMercado,
    misPujas,
    resumenPujas,
    hayMercadoAbierto,
    pilotosMercado,
    cochesMercado,
    potenciadoresMercado,
    textoCuentaAtras,
    totalPujasComprometidas,
    inicializarMercado,
    pujarPorCarta,
    eliminarPujaCarta,
    detenerMercado,
  }
})
