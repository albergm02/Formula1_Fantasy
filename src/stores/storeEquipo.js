import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { usarStoreAutenticacion } from './storeAutenticacion'
import { crearGarajeVacio, calcularValorReventa } from '@/utils/garaje'
import { calcularSinergias, aplicarSinergia } from '@/utils/sinergia'
import { cargarParticipacionDeUsuario, actualizarParticipacion } from '@/services/servicioLigas'

export const usarStoreEscuderia = defineStore('escuderia', () => {
  const idLigaActiva = ref(null)
  const idParticipanteActivo = ref(null)
  const presupuesto = ref(0)
  const puntos = ref(0)
  const garaje = ref(crearGarajeVacio())
  const cargandoEquipo = ref(false)

  /**
   * Calcula las sinergias activas del garaje actual.
   * @returns {{ sinergias: Array, multiplicadorTotal: number }}
   */
  const sinergias = computed(() => calcularSinergias(garaje.value))

  /**
   * Calcula los puntos totales del garaje aplicando el multiplicador de sinergias.
   * @returns {number}
   */
  const puntosConSinergia = computed(() => {
    const base = garaje.value.pilotos.reduce((acc, piloto) => acc + (piloto.puntuacionBase || 0), 0)
    return aplicarSinergia(base, sinergias.value.multiplicadorTotal)
  })

  /**
   * Carga los datos del equipo del usuario para la liga especificada.
   * @param {string} idLiga - El ID de la liga activa.
   * @returns {Promise<void>}
   */
  async function cargarEquipo(idLiga) {
    cargandoEquipo.value = true
    const storeAutenticacion = usarStoreAutenticacion()

    try {
      idLigaActiva.value = idLiga
      const participacion = await cargarParticipacionDeUsuario(
        idLiga,
        storeAutenticacion.usuarioActual.correoAutenticacion,
      )

      if (participacion) {
        idParticipanteActivo.value = participacion.id
        presupuesto.value = participacion.presupuesto
        puntos.value = participacion.puntos
        garaje.value = participacion.garaje || crearGarajeVacio()
      } else {
        presupuesto.value = 50.0
        puntos.value = 0
        garaje.value = crearGarajeVacio()
      }
    } catch (error) {
      presupuesto.value = 50.0
      puntos.value = 0
      garaje.value = crearGarajeVacio()
      throw new Error(`Error al cargar el equipo para la liga ${idLiga}: ${error.message}`)
    } finally {
      cargandoEquipo.value = false
    }
  }

  /**
   * Persiste el estado actual del equipo (presupuesto, puntos, garaje) en Firestore.
   * @returns {Promise<void>}
   */
  async function guardarEstadoEquipo() {
    if (!idParticipanteActivo.value) {
      throw new Error('Error al guardar: falta el ID del participante activo.')
    }

    try {
      await actualizarParticipacion(idParticipanteActivo.value, {
        presupuesto: presupuesto.value,
        puntos: puntos.value,
        garaje: garaje.value,
      })
    } catch (error) {
      throw new Error(`Error al guardar el estado del equipo: ${error.message}`)
    }
  }

  /**
   * Compra un elemento y lo añade al garaje del jugador.
   * @param {Object} elemento - El elemento del mercado a fichar.
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async function comprarElemento(elemento) {
    if (presupuesto.value < elemento.precio) {
      return {
        success: false,
        message: 'No tienes suficiente presupuesto para fichar este elemento.',
      }
    }
    if (elemento.tipo === 'coche' && garaje.value.coche) {
      return {
        success: false,
        message: 'Ya tienes un coche fichado. Vende el actual para fichar uno nuevo.',
      }
    }
    if (elemento.tipo === 'piloto' && garaje.value.pilotos.length >= 2) {
      return {
        success: false,
        message: 'Ya tienes 2 pilotos fichados. Vende uno para fichar otro.',
      }
    }
    if (elemento.tipo === 'rueda' && garaje.value.ruedas) {
      return {
        success: false,
        message: 'Ya tienes ruedas equipadas. Vende las actuales para elegir otras.',
      }
    }

    presupuesto.value -= elemento.precio
    const elementoComprado = { ...elemento, instancia_id: Date.now() }

    if (elemento.tipo === 'coche') {
      garaje.value.coche = elementoComprado
    } else if (elemento.tipo === 'piloto') {
      garaje.value.pilotos.push(elementoComprado)
    } else if (elemento.tipo === 'potenciador') {
      garaje.value.potenciadores.push(elementoComprado)
    } else if (elemento.tipo === 'rueda') {
      garaje.value.ruedas = elementoComprado
    }

    await guardarEstadoEquipo()
    return { success: true, message: `Has fichado: ${elemento.nombre} exitosamente.` }
  }

  /**
   * Vende un elemento del garaje y recupera el 50% de su valor de compra.
   * @param {Object} elemento - El elemento del garaje a vender.
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async function venderElemento(elemento) {
    if (!elemento) {
      return { success: false, message: 'Elemento no encontrado para vender.' }
    }

    try {
      presupuesto.value += calcularValorReventa(elemento.precio)

      if (elemento.tipo === 'coche') {
        garaje.value.coche = null
        garaje.value.potenciadores.forEach((potenciador) => {
          potenciador.equipado = false
        })
      } else if (elemento.tipo === 'piloto') {
        garaje.value.pilotos = garaje.value.pilotos.filter(
          (piloto) => piloto.instancia_id !== elemento.instancia_id,
        )
      } else if (elemento.tipo === 'potenciador') {
        garaje.value.potenciadores = garaje.value.potenciadores.filter(
          (potenciador) => potenciador.instancia_id !== elemento.instancia_id,
        )
      } else if (elemento.tipo === 'rueda') {
        garaje.value.ruedas = null
      }

      await guardarEstadoEquipo()
      return {
        success: true,
        message: `Has obtenido ${calcularValorReventa(elemento.precio)} de presupuesto. ¡Hasta pronto, ${elemento.nombre}!`,
      }
    } catch (error) {
      return { success: false, message: 'Error al vender el elemento. Inténtalo de nuevo.' }
    }
  }

  /**
   * Alterna el estado equipado/desequipado de un potenciador del garaje.
   * @param {number} idInstancia - El ID de instancia del potenciador.
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async function alternarPotenciador(idInstancia) {
    const potenciador = garaje.value.potenciadores.find(
      (elemento) => elemento.instancia_id === idInstancia,
    )

    if (!potenciador) {
      return { success: false, message: 'Potenciador no encontrado para equipar.' }
    }
    if (!garaje.value.coche) {
      return {
        success: false,
        message: 'Debes tener un coche fichado para equipar un potenciador.',
      }
    }

    potenciador.equipado = !potenciador.equipado
    await guardarEstadoEquipo()
    return {
      success: true,
      message: `Has ${potenciador.equipado ? 'equipado' : 'desequipado'} el potenciador: ${potenciador.nombre}.`,
    }
  }

  /**
   * Limpia el estado de la escudería al cerrar sesión o cambiar de liga.
   */
  function limpiarEstadoLigaActiva() {
    idLigaActiva.value = null
    idParticipanteActivo.value = null
    presupuesto.value = 0
    puntos.value = 0
    garaje.value = crearGarajeVacio()
  }

  return {
    idLigaActiva,
    idParticipanteActivo,
    presupuesto,
    puntos,
    garaje,
    cargandoEquipo,
    sinergias,
    puntosConSinergia,
    cargarEquipo,
    guardarEstadoEquipo,
    comprarElemento,
    venderElemento,
    alternarPotenciador,
    limpiarEstadoLigaActiva,
  }
})
