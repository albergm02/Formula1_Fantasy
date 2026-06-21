import { ref } from 'vue'
import { defineStore } from 'pinia'
import { usarStorePerfil } from './storePerfil'
import { cargarParticipacionDeUsuario } from '@/services/servicioLigas'
import {
  calcularPrecioClausula,
  venderCarta,
  alternarAlineacion,
  gestionarClausula,
  ejecutarClausula,
} from '@/services/servicioGaraje'
import { cargarPreciosDinamicosMercado } from '@/services/servicioMercado'
import { migrarGaraje } from '@/utils/migracionGaraje'

const PRESUPUESTO_INICIAL = 50.0

const crearGarajeVacio = () => ({
  coches: [],
  pilotos: [],
  potenciadores: [],
})

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
    const storePerfil = usarStorePerfil()

    try {
      idLigaActiva.value = idLiga
      const [participacion, preciosDinamicos] = await Promise.all([
        cargarParticipacionDeUsuario(idLiga, storePerfil.usuarioActual.correoAutenticacion),
        cargarPreciosDinamicosMercado(),
      ])

      preciosMercado.value = preciosDinamicos

      if (participacion) {
        idParticipanteActivo.value = participacion.id
        presupuesto.value = participacion.presupuesto
        puntos.value = participacion.puntos
        garaje.value = migrarGaraje(participacion.garaje || crearGarajeVacio())
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

  const aResultadoFallido = (error) => ({
    success: false,
    message: error?.message || 'Error en el servidor.',
  })

  async function venderElemento(elemento) {
    if (!elemento) {
      return { success: false, message: 'Elemento no encontrado para vender.' }
    }
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

  async function alternarEquipado(instanciaId) {
    try {
      const resultado = await alternarAlineacion(idParticipanteActivo.value, instanciaId)
      await cargarEquipo(idLigaActiva.value)
      return {
        success: true,
        message: `${resultado.nombre} ${resultado.equipado ? 'alineado' : 'desalineado'}.`,
      }
    } catch (error) {
      return aResultadoFallido(error)
    }
  }

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
      await gestionarClausula(idParticipanteActivo.value, instanciaId, Number(cantidad))
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
      const resultado = await ejecutarClausula(
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

  function obtenerValorMercado(carta) {
    const precioBase = Number(carta?.precio ?? 0)
    const tipoCarta = carta?.tipo || carta?.tipoCarta
    if (tipoCarta === 'piloto') {
      const precioDinamico = preciosMercado.value.pilotos[`${carta.numero}|${carta.variante}`]
      return precioDinamico == null ? precioBase : Math.max(0.5, Number(precioDinamico))
    }
    const mapa = {
      coche: preciosMercado.value.coches,
      potenciador: preciosMercado.value.potenciadores,
    }[tipoCarta]
    const precioDinamico = mapa ? mapa[carta.id] : null
    return precioDinamico == null ? precioBase : Math.max(0.5, Number(precioDinamico))
  }

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
    limpiarEstadoLigaActiva,
    invertirEnClausula,
    ejecutarClausulaRival,
    obtenerValorMercado,
  }
})
