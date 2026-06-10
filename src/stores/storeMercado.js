import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  cargarMercadoActivo,
  registrarPuja,
  eliminarPuja,
  cargarMisPujas,
  cargarResumenPujas,
} from '@/services/servicioMercado'
import { usarStoreAutenticacion } from '@/stores/storeAutenticacion'
import { usarStoreGaraje } from '@/stores/storeGaraje'

export const usarStoreMercado = defineStore('mercado', () => {
  const mercadoActivo = ref(null)
  const cargandoMercado = ref(false)
  const milisegundosRestantes = ref(0)
  const misPujas = ref({})
  const resumenPujas = ref({})

  let intervaloId = null

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

      if (milisegundosRestantes.value <= 0) {
        detenerCuentaAtras()
        mercadoActivo.value.estado = 'cerrado'
      }
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

  async function pujarPorCarta(carta, cantidad) {
    const storeGaraje = usarStoreGaraje()
    const cantidadNum = Number(cantidad)
    const esPujaExistente = misPujas.value[carta.id] !== undefined

    try {
      await registrarPuja(storeGaraje.idLigaActiva, carta.id, cantidadNum)
    } catch (error) {
      return { success: false, message: error?.message || 'No se pudo registrar la puja.' }
    }

    misPujas.value = { ...misPujas.value, [carta.id]: cantidadNum }

    const resumenActual = resumenPujas.value[carta.id] || { mejorPuja: 0, totalPujas: 0 }
    resumenPujas.value = {
      ...resumenPujas.value,
      [carta.id]: {
        mejorPuja: Math.max(resumenActual.mejorPuja, cantidadNum),
        totalPujas: resumenActual.totalPujas + (esPujaExistente ? 0 : 1),
      },
    }

    return {
      success: true,
      message: `Puja de ${cantidadNum.toFixed(2)}M registrada sobre ${carta.nombre}.`,
    }
  }

  async function eliminarPujaCarta(carta) {
    const storeGaraje = usarStoreGaraje()

    try {
      await eliminarPuja(storeGaraje.idLigaActiva, carta.id)
    } catch (error) {
      return { success: false, message: error?.message || 'No se pudo eliminar la puja.' }
    }

    const { [carta.id]: _, ...restoPujas } = misPujas.value
    misPujas.value = restoPujas

    if (resumenPujas.value[carta.id]) {
      resumenPujas.value = {
        ...resumenPujas.value,
        [carta.id]: {
          totalPujas: Math.max(0, resumenPujas.value[carta.id].totalPujas - 1),
        },
      }
    }

    return { success: true, message: `Puja eliminada sobre ${carta.nombre}.` }
  }

  return {
    mercadoActivo,
    cargandoMercado,
    milisegundosRestantes,
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
    detenerCuentaAtras,
  }
})
