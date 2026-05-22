import { ref } from 'vue'
import { defineStore } from 'pinia'
import { usarStoreAutenticacion } from './storeAutenticacion'

const crearGarajeVacio = () => ({
  coches: [],
  pilotos: [],
  potenciadores: [],
})
const calcularValorReventa = (precio = 0) => Math.round(Number(precio || 0) * 0.9 * 100) / 100
import { cargarParticipacionDeUsuario, actualizarParticipacion } from '@/services/servicioLigas'
import {
  calcularPrecioClausula,
  estaEnPeriodoDeGracia,
  ejecutarClausula,
  persistirInversionClausula,
} from '@/services/servicioClausulas'
import { calcularIdMercado, cargarMisPujas } from '@/services/servicioMercado'
import { usarStoreNotificaciones } from './storeNotificaciones'

/**
 * Migra un garaje del formato anterior (coche singular) al nuevo (coches array).
 * También asegura que pilotos tengan el campo `equipado`.
 * @param {Object} garajeOriginal - El garaje leído de Firestore.
 * @returns {Object} Garaje normalizado al nuevo formato.
 */
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
        garaje.value = migrarGaraje(participacion.garaje || crearGarajeVacio())
        ultimaJornada.value = participacion.ultimaJornada || null

        if (!participacion.nombre_usuario) {
          actualizarParticipacion(participacion.id, {
            nombre_usuario: storeAutenticacion.usuarioActual.nombreVisible,
          }).catch(() => {})
        }
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
    const tipoElemento = elemento.tipo || elemento.tipoCarta
    if (presupuesto.value < elemento.precio) {
      return {
        success: false,
        message: 'No tienes suficiente presupuesto para fichar este elemento.',
      }
    }
    presupuesto.value -= elemento.precio
    const elementoComprado = {
      ...elemento,
      instancia_id: Date.now(),
      clausulaInvertida: 0,
      fechaAdquisicion: new Date().toISOString(),
    }

    if (tipoElemento === 'coche') {
      garaje.value.coches.push({ ...elementoComprado, equipado: true })
    } else if (tipoElemento === 'piloto') {
      garaje.value.pilotos.push({ ...elementoComprado, equipado: true })
    } else if (tipoElemento === 'potenciador') {
      garaje.value.potenciadores.push(elementoComprado)
    }

    await guardarEstadoEquipo()

    const storeNotificaciones = usarStoreNotificaciones()
    storeNotificaciones
      .registrarFichaje(elemento.nombre, tipoElemento, elemento.precio)
      .catch(() => {})

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
      const tipoElemento = elemento.tipo || elemento.tipoCarta

      if (tipoElemento === 'coche') {
        garaje.value.coches = garaje.value.coches.filter(
          (coche) => coche.instancia_id !== elemento.instancia_id,
        )
      } else if (tipoElemento === 'piloto') {
        garaje.value.pilotos = garaje.value.pilotos.filter(
          (piloto) => piloto.instancia_id !== elemento.instancia_id,
        )
      } else if (tipoElemento === 'potenciador') {
        garaje.value.potenciadores = garaje.value.potenciadores.filter(
          (potenciador) => potenciador.instancia_id !== elemento.instancia_id,
        )
      }

      await guardarEstadoEquipo()

      const storeNotificaciones = usarStoreNotificaciones()
      storeNotificaciones.registrarVenta(elemento.nombre, tipoElemento).catch(() => {})

      return {
        success: true,
        message: `Has obtenido ${calcularValorReventa(elemento.precio).toFixed(2)}M de presupuesto. ¡Hasta pronto, ${elemento.nombre}!`,
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
    ultimaJornada.value = null
  }

  /* ─── Cláusulas de Rescisión ─────────────────────────────────────────── */

  /**
   * Invierte presupuesto para aumentar la cláusula de rescisión de una carta del garaje.
   * Cada €1 invertido sube la cláusula en €2.
   * @param {number} instanciaId - instancia_id de la carta a proteger.
   * @param {number} cantidad - Cantidad a invertir en protección.
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async function invertirEnClausula(instanciaId, cantidad) {
    const cantidadNum = Number(cantidad)
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      return { success: false, message: 'La cantidad a invertir debe ser mayor que 0.' }
    }
    if (cantidadNum > presupuesto.value) {
      return { success: false, message: 'No tienes presupuesto suficiente para esta inversión.' }
    }

    const elemento = encontrarElementoEnGaraje(instanciaId)
    if (!elemento) {
      return { success: false, message: 'Elemento no encontrado en tu garaje.' }
    }

    const tipoElemento = elemento.tipo || elemento.tipoCarta
    if (tipoElemento === 'potenciador') {
      return { success: false, message: 'Los potenciadores no pueden protegerse con cláusula.' }
    }

    elemento.clausulaInvertida = (elemento.clausulaInvertida || 0) + cantidadNum
    presupuesto.value -= cantidadNum

    await persistirInversionClausula(idParticipanteActivo.value, garaje.value, presupuesto.value)

    const precioTotal = calcularPrecioClausula(elemento)
    return {
      success: true,
      message: `Cláusula de ${elemento.nombre} aumentada a ${precioTotal.toFixed(1)}M.`,
    }
  }

  /**
   * Ejecuta la cláusula de rescisión de una carta del garaje de un rival.
   * Valida presupuesto, periodo de gracia y límites de roster antes de proceder.
   * @param {string} idParticipanteRival - ID de participación del rival.
   * @param {Object} elemento - Carta del rival a fichar.
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async function ejecutarClausulaRival(idParticipanteRival, elemento) {
    const precioClausulaTotal = calcularPrecioClausula(elemento)
    const tipoElemento = elemento.tipo || elemento.tipoCarta

    if (tipoElemento === 'potenciador') {
      return {
        success: false,
        message: 'Los potenciadores no pueden ser fichados mediante cláusula.',
      }
    }
    if (estaEnPeriodoDeGracia(elemento)) {
      return { success: false, message: 'Esta carta está protegida por periodo de gracia.' }
    }
    if (precioClausulaTotal > presupuesto.value) {
      return {
        success: false,
        message: `No tienes presupuesto suficiente. Necesitas ${precioClausulaTotal.toFixed(1)}M.`,
      }
    }

    const totalComprometidoEnPujas = await calcularTotalComprometidoEnPujas()
    if (precioClausulaTotal + totalComprometidoEnPujas > presupuesto.value) {
      return {
        success: false,
        message:
          `Tienes ${totalComprometidoEnPujas.toFixed(1)}M comprometidos en pujas del mercado. ` +
          `Cancela o reduce alguna puja antes de ejecutar este clausulazo (${precioClausulaTotal.toFixed(1)}M).`,
      }
    }

    try {
      await ejecutarClausula(
        idParticipanteRival,
        idParticipanteActivo.value,
        elemento.instancia_id,
        precioClausulaTotal,
      )

      await cargarEquipo(idLigaActiva.value)

      const storeNotificaciones = usarStoreNotificaciones()
      storeNotificaciones
        .registrarClausula(elemento.nombre, tipoElemento, precioClausulaTotal)
        .catch(() => {})

      return {
        success: true,
        message: `Has fichado a ${elemento.nombre} por ${precioClausulaTotal.toFixed(1)}M de cláusula.`,
      }
    } catch (error) {
      return {
        success: false,
        message: `Error al ejecutar la cláusula: ${error.message}`,
      }
    }
  }

  /**
   * Suma el dinero comprometido por el usuario actual en pujas del mercado
   * activo de su liga. Devuelve 0 si no hay mercado abierto o si el usuario
   * no tiene pujas registradas hoy.
   * @returns {Promise<number>} Total comprometido en millones.
   */
  async function calcularTotalComprometidoEnPujas() {
    const storeAuth = usarStoreAutenticacion()
    const emailUsuario = storeAuth.usuarioActual?.correoAutenticacion
    if (!emailUsuario || !idLigaActiva.value) return 0

    const idMercadoHoy = calcularIdMercado(idLigaActiva.value)
    const mapaPujas = await cargarMisPujas(idMercadoHoy, emailUsuario)
    return Object.values(mapaPujas).reduce((suma, cantidad) => suma + cantidad, 0)
  }

  /**
   * Busca un elemento en el garaje por su instancia_id.
   * @param {number} instanciaId
   * @returns {Object|null}
   */
  function encontrarElementoEnGaraje(instanciaId) {
    const coche = garaje.value.coches.find((c) => c.instancia_id === instanciaId)
    if (coche) return coche
    const piloto = garaje.value.pilotos.find((p) => p.instancia_id === instanciaId)
    if (piloto) return piloto
    const potenciador = garaje.value.potenciadores.find((p) => p.instancia_id === instanciaId)
    if (potenciador) return potenciador
    return null
  }

  /**
   * Alterna el estado equipado de un coche. Solo 1 puede estar equipado.
   * @param {number} instanciaId - instancia_id del coche.
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async function alternarCoche(instanciaId) {
    const coche = garaje.value.coches.find((c) => c.instancia_id === instanciaId)
    if (!coche) {
      return { success: false, message: 'Coche no encontrado en tu garaje.' }
    }

    if (coche.equipado) {
      coche.equipado = false
    } else {
      garaje.value.coches.forEach((c) => {
        c.equipado = false
      })
      coche.equipado = true
    }

    await guardarEstadoEquipo()
    return {
      success: true,
      message: `Coche ${coche.nombre} ${coche.equipado ? 'equipado' : 'desequipado'}.`,
    }
  }

  /**
   * Alterna el estado equipado de un piloto. Máximo 2 pueden estar equipados.
   * @param {number} instanciaId - instancia_id del piloto.
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async function alternarPiloto(instanciaId) {
    const piloto = garaje.value.pilotos.find((p) => p.instancia_id === instanciaId)
    if (!piloto) {
      return { success: false, message: 'Piloto no encontrado en tu garaje.' }
    }

    const pilotosEquipados = garaje.value.pilotos.filter((p) => p.equipado).length
    if (!piloto.equipado && pilotosEquipados >= 2) {
      return { success: false, message: 'Solo puedes equipar 2 pilotos. Desequipa uno primero.' }
    }

    piloto.equipado = !piloto.equipado
    await guardarEstadoEquipo()
    return {
      success: true,
      message: `Piloto ${piloto.nombre} ${piloto.equipado ? 'equipado' : 'desequipado'}.`,
    }
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
    limpiarEstadoLigaActiva,
    invertirEnClausula,
    ejecutarClausulaRival,
    alternarCoche,
    alternarPiloto,
  }
})
