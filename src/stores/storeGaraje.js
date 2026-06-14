import { ref } from 'vue'
import { defineStore } from 'pinia'
import { usarStoreAutenticacion } from './storeAutenticacion'
import { cargarParticipacionDeUsuario, actualizarParticipacion } from '@/services/servicioLigas'
import { calcularPrecioClausula, ejecutarClausulazo } from '@/services/servicioClausulas'
import {
  venderCartaParticipante,
  alternarCartaEquipada,
  invertirEnClausulaCarta,
} from '@/services/servicioGaraje'
import { cargarPreciosDinamicosMercado } from '@/services/servicioMercado'
import { usarStoreNotificaciones } from './storeNotificaciones'

const PRESUPUESTO_INICIAL = 50.0

const crearGarajeVacio = () => ({
  coches: [],
  pilotos: [],
  potenciadores: [],
})

// Convierte garajes del formato anterior (coche singular) al nuevo (coches array)
// y rellena el flag `equipado` ausente en pilotos legados.
const migrarGaraje = (garajeOriginal) => {
  const garaje = { ...garajeOriginal }

  if (garaje.coche !== undefined || !garaje.coches) {
    garaje.coches = garaje.coche ? [{ ...garaje.coche, equipado: true }] : []
    delete garaje.coche
  }

  garaje.pilotos = (garaje.pilotos || []).map((piloto) => ({
    ...piloto,
    equipado: piloto.equipado !== undefined ? piloto.equipado : true,
  }))

  garaje.potenciadores = garaje.potenciadores || []

  return garaje
}

export const usarStoreGaraje = defineStore('garaje', () => {
  const idLigaActiva = ref(null)
  const idParticipanteActivo = ref(null)
  const presupuesto = ref(0)
  const puntos = ref(0)
  const garaje = ref(crearGarajeVacio())
  const cargandoEquipo = ref(false)
  const ultimaJornada = ref(null)
  const preciosMercado = ref({ pilotos: {}, coches: {}, potenciadores: {} })

  async function cargarEquipo(idLiga) {
    cargandoEquipo.value = true
    const storeAutenticacion = usarStoreAutenticacion()

    try {
      idLigaActiva.value = idLiga
      const [participacion, preciosDinamicos] = await Promise.all([
        cargarParticipacionDeUsuario(idLiga, storeAutenticacion.usuarioActual.correoAutenticacion),
        cargarPreciosDinamicosMercado(),
      ])

      preciosMercado.value = preciosDinamicos

      if (participacion) {
        idParticipanteActivo.value = participacion.id
        presupuesto.value = participacion.presupuesto
        puntos.value = participacion.puntos
        garaje.value = migrarGaraje(participacion.garaje || crearGarajeVacio())
        ultimaJornada.value = participacion.ultimaJornada || null

        if (!participacion.nombre_usuario) {
          actualizarParticipacion(participacion.id, {
            nombre_usuario: storeAutenticacion.usuarioActual.nombreVisible,
          }).catch(() => {})
        }
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

  const aResultadoFallido = (error) => ({
    success: false,
    message: error?.message || 'Error en el servidor.',
  })

  async function venderElemento(elemento) {
    if (!elemento) {
      return { success: false, message: 'Elemento no encontrado para vender.' }
    }
    try {
      const resultado = await venderCartaParticipante(
        idParticipanteActivo.value,
        elemento.instancia_id,
      )
      await cargarEquipo(idLigaActiva.value)
      const tipoElemento = elemento.tipo || elemento.tipoCarta
      usarStoreNotificaciones()
        .registrarVenta(resultado.nombre, tipoElemento)
        .catch(() => {})
      return {
        success: true,
        message: `Has obtenido ${resultado.valorReventa.toFixed(2)}M de presupuesto. ¡Hasta pronto, ${resultado.nombre}!`,
      }
    } catch (error) {
      return aResultadoFallido(error)
    }
  }

  async function alternarEquipado(instanciaId) {
    try {
      const resultado = await alternarCartaEquipada(idParticipanteActivo.value, instanciaId)
      await cargarEquipo(idLigaActiva.value)
      return {
        success: true,
        message: `${resultado.nombre} ${resultado.equipado ? 'alineado' : 'desalineado'}.`,
      }
    } catch (error) {
      return aResultadoFallido(error)
    }
  }

  const alternarCoche = alternarEquipado
  const alternarPiloto = alternarEquipado
  const alternarPotenciador = alternarEquipado

  function limpiarEstadoLigaActiva() {
    idLigaActiva.value = null
    idParticipanteActivo.value = null
    presupuesto.value = 0
    puntos.value = 0
    garaje.value = crearGarajeVacio()
    ultimaJornada.value = null
  }

  async function invertirEnClausula(instanciaId, cantidad) {
    const elemento = encontrarElementoEnGaraje(instanciaId)
    if (!elemento) {
      return { success: false, message: 'Elemento no encontrado en tu garaje.' }
    }
    try {
      await invertirEnClausulaCarta(idParticipanteActivo.value, instanciaId, Number(cantidad))
      await cargarEquipo(idLigaActiva.value)
      const elementoActualizado = encontrarElementoEnGaraje(instanciaId) || elemento
      const precioTotal = calcularPrecioClausula(elementoActualizado)
      return {
        success: true,
        message: `Cláusula de ${elemento.nombre} aumentada a ${precioTotal.toFixed(1)}M.`,
      }
    } catch (error) {
      return aResultadoFallido(error)
    }
  }

  async function ejecutarClausulaRival(idParticipanteRival, elemento) {
    try {
      const resultado = await ejecutarClausulazo(
        idParticipanteRival,
        idParticipanteActivo.value,
        elemento.instancia_id,
      )
      await cargarEquipo(idLigaActiva.value)
      return {
        success: true,
        message: `Has fichado a ${resultado.nombre} por ${resultado.precioClausula.toFixed(1)}M de cláusula.`,
      }
    } catch (error) {
      return aResultadoFallido(error)
    }
  }

  /**
   * Devuelve el valor de mercado actualizado de una carta del garaje.
   * Pilotos: consulta el mapa dinámico por `<numero>|<variante>`.
   * Coches y potenciadores: consultan el mapa dinámico por `id`. Si la
   * carta no aparece en el mapa, devuelve el precio almacenado en la propia
   * carta como respaldo.
   *
   * @param {Object} carta Carta del garaje (piloto, coche o potenciador).
   * @returns {number} Valor de mercado actual en millones.
   */
  function obtenerValorMercado(carta) {
    const precioBase = Number(carta?.precio ?? 0)
    const tipoCarta = carta?.tipo || carta?.tipoCarta
    if (tipoCarta === 'piloto') {
      const precioDinamico = preciosMercado.value.pilotos[`${carta.numero}|${carta.variante}`]
      return precioDinamico == null ? precioBase : Math.max(0.5, Number(precioDinamico))
    }
    const mapaPorTipo = {
      coche: preciosMercado.value.coches,
      potenciador: preciosMercado.value.potenciadores,
    }
    const mapa = mapaPorTipo[tipoCarta]
    const precioDinamico = mapa ? mapa[carta.id] : null
    return precioDinamico == null ? precioBase : Math.max(0.5, Number(precioDinamico))
  }

  function encontrarElementoEnGaraje(instanciaId) {
    const coche = garaje.value.coches.find((c) => c.instancia_id === instanciaId)
    if (coche) return coche
    const piloto = garaje.value.pilotos.find((p) => p.instancia_id === instanciaId)
    if (piloto) return piloto
    const potenciador = garaje.value.potenciadores.find((p) => p.instancia_id === instanciaId)
    if (potenciador) return potenciador
    return null
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
    alternarPotenciador,
    limpiarEstadoLigaActiva,
    invertirEnClausula,
    ejecutarClausulaRival,
    alternarCoche,
    alternarPiloto,
    obtenerValorMercado,
  }
})
