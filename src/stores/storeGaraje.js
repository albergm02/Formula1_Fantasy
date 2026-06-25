/**
 * @module StoreGaraje
 * @description Estado global para el garaje del usuario, incluyendo coches, pilotos y potenciadores.
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { usarStorePerfil } from './storePerfil'
import { cargarParticipacionDeUsuario } from '@/services/servicioLigas'
import { calcularPrecioClausula, venderCarta, alternarAlineacion, gestionarClausula, ejecutarClausula } from '@/services/servicioGaraje'

const PRESUPUESTO_INICIAL = 50.0

/**
 * Construye un garaje vacío con las tres colecciones de cartas.
 * @function crearGarajeVacio
 * @memberof module:StoreGaraje
 * @returns {{coches: Array, pilotos: Array, potenciadores: Array}} - Garaje sin cartas.
 */
function crearGarajeVacio() {
  return { coches: [], pilotos: [], potenciadores: [] }
}

/**
 * Store para gestionar el garaje del usuario, incluyendo coches, pilotos y potenciadores.
 * @returns {Object} - Contiene el estado del garaje, presupuesto, puntos y funciones para cargar y gestionar el garaje.
 */
export const usarStoreGaraje = defineStore('garaje', () => {
  const idLigaActiva = ref(null)
  const idParticipanteActivo = ref(null)
  const presupuesto = ref(0)
  const puntos = ref(0)
  const garaje = ref(crearGarajeVacio())
  const cargandoEquipo = ref(false)
  const ultimaJornada = ref(null)

  /**
   * Carga el equipo del usuario para una liga específica.
   * @function cargarEquipo
   * @memberof module:StoreGaraje
   * @param {string} idLiga - El ID de la liga.
   * @returns {Promise<void>}
   */
  async function cargarEquipo(idLiga) {
    cargandoEquipo.value = true
    const storePerfil = usarStorePerfil()

    try {
      idLigaActiva.value = idLiga
      const participacion = await cargarParticipacionDeUsuario(idLiga, storePerfil.usuarioActual.correoAutenticacion)

      if (participacion) {
        idParticipanteActivo.value = participacion.id
        presupuesto.value = participacion.presupuesto
        puntos.value = participacion.puntos
        garaje.value = participacion.garaje || crearGarajeVacio()
        ultimaJornada.value = participacion.ultimaJornada || null
      } else {
        presupuesto.value = PRESUPUESTO_INICIAL
        puntos.value = 0
        garaje.value = crearGarajeVacio()
        ultimaJornada.value = null
      }
    } catch (error) {
      presupuesto.value = PRESUPUESTO_INICIAL
      puntos.value = 0
      garaje.value = crearGarajeVacio()
      ultimaJornada.value = null
      throw new Error(`Error al cargar el equipo para la liga ${idLiga}: ${error.message}`)
    } finally {
      cargandoEquipo.value = false
    }
  }

  /**
   * Construye un resultado fallido estandarizado a partir de un error capturado.
   * @function aResultadoFallido
   * @memberof module:StoreGaraje
   * @param {Object} error - Error capturado en el try/catch.
   * @returns {{success: boolean, message: string}} - Resultado fallido con mensaje.
   */
  function aResultadoFallido(error) {
    return { success: false, message: error?.message || 'Error en el servidor.' }
  }

  /**
   * Vende un elemento del garaje del usuario.
   * @function venderElemento
   * @memberof module:StoreGaraje
   * @param {Object} elemento - El elemento a vender.
   * @returns {Promise<{success: boolean, message: string}>} - Devuelve un objeto indicando el éxito de la operación y un mensaje.
   */
  async function venderElemento(elemento) {
    if (!elemento) return { success: false, message: 'Elemento no encontrado para vender.' }
    try {
      const resultado = await venderCarta(idParticipanteActivo.value, elemento.instancia_id)
      await cargarEquipo(idLigaActiva.value)
      return {
        success: true,
        message: `Has obtenido ${resultado.valorReventa.toFixed(2)}M de presupuesto. ¡Hasta pronto, ${resultado.nombre}!`,
      }
    } catch (error) {
      return aResultadoFallido(error)
    }
  }

  /**
   * Alterna el estado de alineación de un elemento en el garaje del usuario.
   * @function alternarEquipado
   * @memberof module:StoreGaraje
   * @param {string} instanciaId - El ID de la instancia del elemento.
   * @returns {Promise<{success: boolean, message: string}>} - Devuelve un objeto indicando el éxito de la operación y un mensaje.
   */
  async function alternarEquipado(instanciaId) {
    try {
      const resultado = await alternarAlineacion(idParticipanteActivo.value, instanciaId)
      await cargarEquipo(idLigaActiva.value)
      return { success: true, message: `${resultado.nombre} ${resultado.equipado ? 'alineado' : 'desalineado'}.` }
    } catch (error) {
      return aResultadoFallido(error)
    }
  }

  /**
   * Invierte en la cláusula de un elemento en el garaje del usuario.
   * @function invertirEnClausula
   * @memberof module:StoreGaraje
   * @param {string} instanciaId - El ID de la instancia del elemento.
   * @param {number} cantidad - La cantidad a invertir en la cláusula.
   * @returns {Promise<{success: boolean, message: string}>} - Devuelve un objeto indicando el éxito de la operación y un mensaje.
   */
  async function invertirEnClausula(instanciaId, cantidad) {
    const elemento = encontrarElementoEnGaraje(instanciaId)
    if (!elemento) return { success: false, message: 'Elemento no encontrado en tu garaje.' }
    try {
      await gestionarClausula(idParticipanteActivo.value, instanciaId, Number(cantidad))
      await cargarEquipo(idLigaActiva.value)
      const elementoActualizado = encontrarElementoEnGaraje(instanciaId) || elemento
      const precioTotal = calcularPrecioClausula(elementoActualizado)
      return { success: true, message: `Cláusula de ${elemento.nombre} aumentada a ${precioTotal.toFixed(1)}M.` }
    } catch (error) {
      return aResultadoFallido(error)
    }
  }

  /**
   * Ejecuta la cláusula de un elemento en el garaje de un rival.
   * @function ejecutarClausulaRival
   * @memberof module:StoreGaraje
   * @param {string} idParticipanteRival - El ID del participante rival.
   * @param {Object} elemento - El elemento a fichar.
   * @returns {Promise<{success: boolean, message: string}>} - Devuelve un objeto indicando el éxito de la operación y un mensaje.
   */
  async function ejecutarClausulaRival(idParticipanteRival, elemento) {
    try {
      const resultado = await ejecutarClausula(idParticipanteRival, idParticipanteActivo.value, elemento.instancia_id)
      await cargarEquipo(idLigaActiva.value)
      return { success: true, message: `Has fichado a ${resultado.nombre} por ${resultado.precioClausula.toFixed(1)}M de cláusula.` }
    } catch (error) {
      return aResultadoFallido(error)
    }
  }

  /**
   * Obtiene el valor de mercado de una carta. Los precios son estáticos: el
   * valor es siempre el `precio` de la carta (definido en el catálogo base).
   * @function obtenerValorMercado
   * @memberof module:StoreGaraje
   * @param {Object} carta - La carta cuyo valor de mercado se desea obtener.
   * @returns {number} - Devuelve el valor de mercado de la carta.
   */
  function obtenerValorMercado(carta) {
    return Number(carta?.precio ?? 0)
  }

  /**
   * Encuentra un elemento en el garaje del usuario por su ID de instancia.
   * @function encontrarElementoEnGaraje
   * @memberof module:StoreGaraje
   * @param {string} instanciaId - El ID de la instancia del elemento.
   * @returns {Object|null} - Devuelve el elemento encontrado o null si no se encuentra.
   */
  function encontrarElementoEnGaraje(instanciaId) {
    const coche = garaje.value.coches.find((c) => c.instancia_id === instanciaId)
    if (coche) return coche
    const piloto = garaje.value.pilotos.find((p) => p.instancia_id === instanciaId)
    if (piloto) return piloto
    return garaje.value.potenciadores.find((p) => p.instancia_id === instanciaId) || null
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
    venderElemento,
    alternarEquipado,
    invertirEnClausula,
    ejecutarClausulaRival,
    obtenerValorMercado,
  }
})
