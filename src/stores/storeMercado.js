import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  suscribirMercadoActivo,
  registrarPuja,
  eliminarPuja,
  cargarMisPujas,
  cargarResumenPujas,
} from '@/services/servicioMercado'
import { usarStorePerfil } from '@/stores/storePerfil'

export const usarStoreMercado = defineStore('mercado', () => {
  const mercadoActivo = ref(null)
  const cargandoMercado = ref(false)
  const milisegundosRestantes = ref(0)
  const misPujas = ref({})
  const resumenPujas = ref({})

  let intervaloId = null
  let cancelarListenerMercado = null
  // Incremento este token cada vez que cambio de mercado o lo detengo.
  // Cualquier callback de Firestore en vuelo compara contra el valor con
  // el que arrancó y se descarta si ya no coincide: evita que un snapshot
  // tardío de la liga anterior pise el estado de la nueva.
  let tokenSuscripcion = 0

  const hayMercadoAbierto = computed(
    () => mercadoActivo.value !== null && mercadoActivo.value.estado === 'abierto',
  )

  const pilotosMercado = computed(() => {
    if (!mercadoActivo.value) return []
    return mercadoActivo.value.cartas.filter((carta) => carta.tipoCarta === 'piloto')
  })

  const cochesMercado = computed(() => {
    if (!mercadoActivo.value) return []
    return mercadoActivo.value.cartas.filter((carta) => carta.tipoCarta === 'coche')
  })

  const potenciadoresMercado = computed(() => {
    if (!mercadoActivo.value) return []
    return mercadoActivo.value.cartas.filter((carta) => carta.tipoCarta === 'potenciador')
  })

  const textoCuentaAtras = computed(() => {
    const ms = milisegundosRestantes.value
    if (ms <= 0) return 'Mercado cerrado'

    const horas = Math.floor(ms / (1000 * 60 * 60))
    const minutos = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    const segundos = Math.floor((ms % (1000 * 60)) / 1000)

    return `${String(horas).padStart(2, '0')}h ${String(minutos).padStart(2, '0')}m ${String(segundos).padStart(2, '0')}s`
  })

  const totalPujasComprometidas = computed(() =>
    Object.values(misPujas.value).reduce((suma, cantidad) => suma + cantidad, 0),
  )

  function iniciarCuentaAtras() {
    detenerCuentaAtras()
    if (!mercadoActivo.value || !mercadoActivo.value.fechaCierre) return

    const actualizarRestante = () => {
      const cierre = new Date(mercadoActivo.value.fechaCierre).getTime()
      milisegundosRestantes.value = Math.max(0, cierre - Date.now())
    }

    actualizarRestante()
    intervaloId = setInterval(actualizarRestante, 1000)
  }

  function detenerCuentaAtras() {
    if (intervaloId) {
      clearInterval(intervaloId)
      intervaloId = null
    }
  }

  async function inicializarMercado(idLiga) {
    cargandoMercado.value = true

    if (cancelarListenerMercado) cancelarListenerMercado()
    const tokenLocal = ++tokenSuscripcion
    mercadoActivo.value = null
    misPujas.value = {}
    resumenPujas.value = {}
    milisegundosRestantes.value = 0

    cancelarListenerMercado = suscribirMercadoActivo(idLiga, async (mercado) => {
      if (tokenLocal !== tokenSuscripcion) return
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
            email ? cargarMisPujas(mercado.id, email) : Promise.resolve({}),
            cargarResumenPujas(mercado.id),
          ])
          if (tokenLocal !== tokenSuscripcion) return
          misPujas.value = pujasUsuario
          resumenPujas.value = resumen
        } catch {
          misPujas.value = {}
          resumenPujas.value = {}
        }
      }

      cargandoMercado.value = false
    })
  }

  function detenerMercado() {
    detenerCuentaAtras()
    if (cancelarListenerMercado) {
      cancelarListenerMercado()
      cancelarListenerMercado = null
    }
    tokenSuscripcion++
    mercadoActivo.value = null
    misPujas.value = {}
    resumenPujas.value = {}
    milisegundosRestantes.value = 0
  }

  async function pujarPorCarta(carta, cantidad) {
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

    return {
      success: true,
      message: `Puja de ${cantidadNum.toFixed(2)}M registrada sobre ${carta.nombre}.`,
    }
  }

  async function eliminarPujaCarta(carta) {
    try {
      await eliminarPuja(mercadoActivo.value.idLiga, carta.id)
    } catch (error) {
      return { success: false, message: error?.message || 'No se pudo eliminar la puja.' }
    }

    const { [carta.id]: _, ...restoPujas } = misPujas.value
    misPujas.value = restoPujas

    const totalActual = resumenPujas.value[carta.id] || 0
    resumenPujas.value = {
      ...resumenPujas.value,
      [carta.id]: Math.max(0, totalActual - 1),
    }

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
