import { ref } from 'vue'
import { defineStore } from 'pinia'
import { usarStoreAutenticacion } from './storeAutenticacion'
const crearGarajeVacio = () => ({ coche: null, pilotos: [], potenciadores: [], ruedas: null })
const calcularValorReventa = (precio = 0) => Math.floor(Number(precio || 0) * 0.5)
import { cargarParticipacionDeUsuario, actualizarParticipacion } from '@/services/servicioLigas'
import { usarStoreNotificaciones } from './storeNotificaciones'
import { ruedasBase } from '@/data/bases/ruedasBase'

export const usarStoreEscuderia = defineStore('escuderia', () => {
  const idLigaActiva = ref(null)
  const idParticipanteActivo = ref(null)
  const presupuesto = ref(0)
  const puntos = ref(0)
  const garaje = ref(crearGarajeVacio())
  const cargandoEquipo = ref(false)
  const ultimaJornada = ref(null)

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
        ultimaJornada.value = participacion.ultimaJornada || null
      } else {
        presupuesto.value = 50.0
        puntos.value = 0
        garaje.value = crearGarajeVacio()
        ultimaJornada.value = null
      }
    } catch (error) {
      presupuesto.value = 50.0
      puntos.value = 0
      garaje.value = crearGarajeVacio()
      ultimaJornada.value = null
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
    presupuesto.value -= elemento.precio
    const elementoComprado = { ...elemento, instancia_id: Date.now() }

    if (elemento.tipo === 'coche') {
      garaje.value.coche = elementoComprado
    } else if (elemento.tipo === 'piloto') {
      garaje.value.pilotos.push(elementoComprado)
    } else if (elemento.tipo === 'potenciador') {
      garaje.value.potenciadores.push(elementoComprado)
    }

    await guardarEstadoEquipo()

    const storeNotificaciones = usarStoreNotificaciones()
    storeNotificaciones.registrarFichaje(elemento.nombre, elemento.tipo).catch(() => {})

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
      } else if (elemento.tipo === 'piloto') {
        garaje.value.pilotos = garaje.value.pilotos.filter(
          (piloto) => piloto.instancia_id !== elemento.instancia_id,
        )
      } else if (elemento.tipo === 'potenciador') {
        garaje.value.potenciadores = garaje.value.potenciadores.filter(
          (potenciador) => potenciador.instancia_id !== elemento.instancia_id,
        )
      }

      await guardarEstadoEquipo()

      const storeNotificaciones = usarStoreNotificaciones()
      storeNotificaciones.registrarVenta(elemento.nombre, elemento.tipo).catch(() => {})

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
    if (garaje.value.pilotos.length === 0) {
      return {
        success: false,
        message: 'Debes tener al menos un piloto fichado para equipar un potenciador.',
      }
    }

    const potenciadoresEquipados = garaje.value.potenciadores.filter((p) => p.equipado).length
    if (!potenciador.equipado && potenciadoresEquipados >= 3) {
      return {
        success: false,
        message: `Solo puedes equipar 3 potenciadores por carrera. Desinstala uno primero.`,
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
   * Equipa un compuesto de neumáticos en el garaje.
   * Requiere tener al menos un piloto y un coche fichados.
   * @param {string} idRueda - El id del compuesto a equipar (ej. 'blando', 'medio').
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async function equiparNeumatico(idRueda) {
    const rueda = ruedasBase.find((r) => r.id === idRueda)
    if (!rueda) {
      return { success: false, message: `Compuesto con id ${idRueda} no encontrado.` }
    }

    garaje.value.ruedas = { ...rueda }
    await guardarEstadoEquipo()
    return { success: true, message: `Compuesto ${rueda.nombre} equipado.` }
  }

  /**
   * Retira los neumáticos actualmente equipados del garaje.
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async function desequiparNeumatico() {
    if (!garaje.value.ruedas) {
      return { success: false, message: 'No hay neumáticos equipados para retirar.' }
    }

    const nombreRueda = garaje.value.ruedas.nombre
    garaje.value.ruedas = null
    await guardarEstadoEquipo()
    return { success: true, message: `Compuesto ${nombreRueda} retirado.` }
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
    ultimaJornada.value = null
  }

  return {
    idLigaActiva,
    idParticipanteActivo,
    presupuesto,
    puntos,
    garaje,
    cargandoEquipo,
    ultimaJornada,
    cargarEquipo,
    guardarEstadoEquipo,
    comprarElemento,
    venderElemento,
    alternarPotenciador,
    equiparNeumatico,
    desequiparNeumatico,
    limpiarEstadoLigaActiva,
  }
})
