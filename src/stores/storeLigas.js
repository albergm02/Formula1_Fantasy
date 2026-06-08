import { ref } from 'vue'
import { defineStore } from 'pinia'
import { usarStoreAutenticacion } from './storeAutenticacion'

import {
  cargarLigasPorIds,
  cargarLiga,
  buscarLigaPorCodigo,
  crearDocumentoLiga,
  actualizarLiga,
  eliminarDocumentoLiga,
  crearParticipacion,
  cargarParticipacionesLiga,
  actualizarParticipacion,
  eliminarParticipacion,
  contarLigasAdministradas,
  vincularLigaAlUsuario,
  desvincularLigaDelUsuario,
  cargarRankingLiga,
  inicializarMercadoLiga,
  añadirEmailExpulsado,
} from '@/services/servicioLigas'

import { registrarActividad, TIPOS_ACTIVIDAD } from '@/services/servicioNotificaciones'
import { buscarUidPorCorreo } from '@/services/servicioAutenticacion'
import { usarStoreNotificaciones } from './storeNotificaciones'

const MAX_LIGAS = 5
const alcanzoLimiteLigas = (idsLigas = []) =>
  Array.isArray(idsLigas) && idsLigas.length >= MAX_LIGAS
const generarCodigoInvitacionLiga = () => Math.random().toString(36).substring(2, 10).toUpperCase()
const crearGarajeVacio = () => ({ coches: [], pilotos: [], potenciadores: [] })

/**
 * Elige al siguiente administrador de una liga basándose en quién lleva más tiempo en ella.
 * El criterio es el `fecha_union` más antiguo (Timestamp de Firestore ascendente).
 * @param {Array} participaciones - Participaciones restantes, excluido el admin saliente.
 * @returns {Object} La participación del miembro con mayor antigüedad.
 */
const elegirSiguienteAdministrador = (participaciones) =>
  [...participaciones].sort((a, b) => a.fecha_union.toMillis() - b.fecha_union.toMillis())[0]

export const usarStoreLigas = defineStore('ligas', () => {
  const detallesLigas = ref([])
  const idLigaActiva = ref(null)

  /**
   * Carga las ligas a las que pertenece el usuario y actualiza el estado global.
   * Realiza limpieza lazy: si algún ID apunta a una liga ya eliminada,
   * lo desvincula automáticamente para mantener la coherencia entre Firestore y el estado local.
   * @returns {Promise<void>}
   */
  async function cargarLigasUsuario() {
    const storeAutenticacion = usarStoreAutenticacion()
    const idsAlmacenados = storeAutenticacion.usuarioActual.idsLigas

    // Comprobar si hay ids
    if (!idsAlmacenados.length) {
      detallesLigas.value = []
      return
    }

    try {
      const ligasCargadas = await cargarLigasPorIds(idsAlmacenados)
      detallesLigas.value = ligasCargadas

      const idsValidos = ligasCargadas.map((liga) => liga.id)
      const idsHuerfanos = idsAlmacenados.filter((id) => !idsValidos.includes(id))

      if (idsHuerfanos.length > 0) {
        const uid = storeAutenticacion.usuarioActual.uid
        for (const idHuerfano of idsHuerfanos) {
          await desvincularLigaDelUsuario(uid, idHuerfano)
        }
        storeAutenticacion.usuarioActual.idsLigas = idsValidos
      }
    } catch (error) {
      detallesLigas.value = []
      throw new Error(`Error al cargar las ligas del usuario: ${error.message}`)
    }
  }

  /**
   * Crea una nueva liga y asigna al usuario actual como administrador.
   * El mercado de la liga se inicializa en segundo plano sin bloquear la respuesta.
   * @param {string} nombreLiga - Nombre visible de la liga.
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async function crearLiga(nombreLiga) {
    const storeAutenticacion = usarStoreAutenticacion()
    const correoUsuario = storeAutenticacion.usuarioActual.correoAutenticacion
    const uid = storeAutenticacion.usuarioActual.uid

    if (alcanzoLimiteLigas(storeAutenticacion.usuarioActual.idsLigas)) {
      return { success: false, message: 'Solo puedes pertenecer a un máximo de 5 ligas.' }
    }

    try {
      const ligasAdministradas = await contarLigasAdministradas(correoUsuario)
      if (ligasAdministradas >= 2) {
        return {
          success: false,
          message: 'Has alcanzado el límite máximo de 2 ligas creadas.',
        }
      }

      const codigoInvitacion = generarCodigoInvitacionLiga()
      const idLiga = await crearDocumentoLiga({
        nombre: nombreLiga,
        correoOrganizador: correoUsuario,
        codigo_invitacion: codigoInvitacion,
        participantes: 1,
        fecha_creacion: new Date(),
      })

      await crearParticipacion({
        id_liga: idLiga,
        uid_usuario: uid,
        email_usuario: correoUsuario,
        nombre_usuario: storeAutenticacion.usuarioActual.nombreVisible,
        rol: 'organizador',
        presupuesto: 50.0,
        puntos: 0,
        garaje: crearGarajeVacio(),
        fecha_union: new Date(),
      })

      await vincularLigaAlUsuario(uid, idLiga)
      storeAutenticacion.usuarioActual.idsLigas.push(idLiga)

      inicializarMercadoLiga(idLiga).catch(() => {})

      const storeNotificaciones = usarStoreNotificaciones()
      storeNotificaciones.registrarCreacionLiga(idLiga, nombreLiga).catch(() => {})

      await cargarLigasUsuario()
      return { success: true, message: `Liga creada. Código: ${codigoInvitacion}` }
    } catch (error) {
      return { success: false, message: 'Error al crear la liga. Inténtalo de nuevo.' }
    }
  }

  /**
   * Une al usuario a una liga existente usando su código de invitación.
   * @param {string} codigoInvitacion - Código de 6 caracteres (se normaliza a mayúsculas en la vista).
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async function unirseALiga(codigoInvitacion) {
    const storeAutenticacion = usarStoreAutenticacion()
    const correoUsuario = storeAutenticacion.usuarioActual.correoAutenticacion
    const uid = storeAutenticacion.usuarioActual.uid

    if (alcanzoLimiteLigas(storeAutenticacion.usuarioActual.idsLigas)) {
      return { success: false, message: 'Solo puedes pertenecer a un máximo de 5 ligas.' }
    }

    try {
      const liga = await buscarLigaPorCodigo(codigoInvitacion)
      if (!liga) {
        return { success: false, message: 'Código de invitación no válido.' }
      }

      if (storeAutenticacion.usuarioActual.idsLigas.includes(liga.id)) {
        return { success: false, message: 'Ya perteneces a esta liga.' }
      }

      const expulsados = liga.expulsados || []
      if (expulsados.includes(correoUsuario)) {
        return {
          success: false,
          message: 'Has sido expulsado de esta liga y no puedes volver a unirte.',
        }
      }

      await crearParticipacion({
        id_liga: liga.id,
        uid_usuario: uid,
        email_usuario: correoUsuario,
        nombre_usuario: storeAutenticacion.usuarioActual.nombreVisible,
        rol: 'miembro',
        presupuesto: 50.0,
        puntos: 0,
        garaje: crearGarajeVacio(),
        fecha_union: new Date(),
      })

      await actualizarLiga(liga.id, { participantes: liga.participantes + 1 })
      await vincularLigaAlUsuario(uid, liga.id)
      storeAutenticacion.usuarioActual.idsLigas.push(liga.id)

      registrarActividad(liga.id, {
        nombreUsuario: storeAutenticacion.usuarioActual.nombreVisible,
        tipo: TIPOS_ACTIVIDAD.INCORPORACION,
        descripcion: `se ha unido al campeonato ${liga.nombre}`,
      }).catch(() => {})

      await cargarLigasUsuario()
      return { success: true, message: 'Te has unido a la liga.' }
    } catch (error) {
      return { success: false, message: 'Error al unirse a la liga. Inténtalo de nuevo.' }
    }
  }

  /**
   * Abandona una liga activa.
   * Si es el último participante, elimina la liga completa.
   * Si es el creador, cede el rol al siguiente participante que se unió (por `fecha_union` ascendente).
   * @param {string} idLiga
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async function abandonarLiga(idLiga) {
    const storeAutenticacion = usarStoreAutenticacion()
    const correoUsuario = storeAutenticacion.usuarioActual.correoAutenticacion

    try {
      const datosLiga = await cargarLiga(idLiga)
      if (!datosLiga) {
        return { success: false, message: 'La liga no existe.' }
      }

      const participaciones = await cargarParticipacionesLiga(idLiga)
      const participacionPropia = participaciones.find((p) => p.email_usuario === correoUsuario)
      const participacionesRestantes = participaciones.filter(
        (p) => p.email_usuario !== correoUsuario,
      )

      if (!participacionPropia) {
        return { success: false, message: 'No estás en esta liga.' }
      }

      if (participacionesRestantes.length === 0) {
        return await eliminarLiga(idLiga)
      }

      if (participacionPropia.rol === 'organizador') {
        const siguienteOrganizador = elegirSiguienteAdministrador(participacionesRestantes)
        await actualizarParticipacion(siguienteOrganizador.id, { rol: 'organizador' })
        await actualizarLiga(idLiga, {
          correoOrganizador: siguienteOrganizador.email_usuario,
          participantes: datosLiga.participantes - 1,
        })
      } else {
        await actualizarLiga(idLiga, { participantes: datosLiga.participantes - 1 })
      }

      registrarActividad(idLiga, {
        nombreUsuario: storeAutenticacion.usuarioActual.nombreVisible,
        tipo: TIPOS_ACTIVIDAD.ABANDONO,
        descripcion: `ha abandonado el campeonato ${datosLiga.nombre}`,
      }).catch(() => {})

      await eliminarParticipacion(participacionPropia.id)
      await desvincularLigaDelUsuario(storeAutenticacion.usuarioActual.uid, idLiga)

      storeAutenticacion.usuarioActual.idsLigas = storeAutenticacion.usuarioActual.idsLigas.filter(
        (id) => id !== idLiga,
      )

      if (idLigaActiva.value === idLiga) {
        idLigaActiva.value = null
      }

      await cargarLigasUsuario()
      return { success: true, message: 'Has abandonado la liga.' }
    } catch (error) {
      return { success: false, message: 'Error al abandonar la liga.' }
    }
  }

  /**
   * Expulsa a un participante concreto de la liga.
   * Solo el administrador puede ejecutar esta acción.
   * No se puede expulsar al propio administrador mediante esta función.
   * @param {string} idLiga
   * @param {string} emailParticipante - Email del participante a expulsar.
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async function expulsarParticipante(idLiga, emailParticipante) {
    const storeAutenticacion = usarStoreAutenticacion()
    const correoAdmin = storeAutenticacion.usuarioActual.correoAutenticacion

    if (emailParticipante === correoAdmin) {
      return { success: false, message: 'No puedes expulsarte a ti mismo. Usa "Abandonar liga".' }
    }

    try {
      const datosLiga = await cargarLiga(idLiga)
      if (!datosLiga) return { success: false, message: 'La liga no existe.' }

      if (datosLiga.correoOrganizador !== correoAdmin) {
        return { success: false, message: 'Solo el administrador puede expulsar participantes.' }
      }

      const participaciones = await cargarParticipacionesLiga(idLiga)
      const participacionExpulsado = participaciones.find(
        (p) => p.email_usuario === emailParticipante,
      )

      if (!participacionExpulsado) {
        return { success: false, message: 'El participante no pertenece a esta liga.' }
      }

      await eliminarParticipacion(participacionExpulsado.id)

      const uidExpulsado =
        participacionExpulsado.uid_usuario || (await buscarUidPorCorreo(emailParticipante))
      if (uidExpulsado) await desvincularLigaDelUsuario(uidExpulsado, idLiga)

      await añadirEmailExpulsado(idLiga, emailParticipante)
      await actualizarLiga(idLiga, { participantes: datosLiga.participantes - 1 })

      registrarActividad(idLiga, {
        nombreUsuario: participacionExpulsado.nombre_usuario || emailParticipante,
        tipo: TIPOS_ACTIVIDAD.ABANDONO,
        descripcion: `ha sido expulsado del campeonato ${datosLiga.nombre}`,
      }).catch(() => {})

      return {
        success: true,
        message: `${participacionExpulsado.nombre_usuario || emailParticipante} ha sido expulsado.`,
      }
    } catch (error) {
      return { success: false, message: `Error al expulsar al participante: ${error.message}` }
    }
  }

  /**
   * Devuelve la lista de participantes de una liga con sus datos básicos.
   * @param {string} idLiga
   * @returns {Promise<Array>}
   */
  async function cargarParticipantesLiga(idLiga) {
    try {
      return await cargarParticipacionesLiga(idLiga)
    } catch (error) {
      throw new Error(`Error al cargar los participantes de la liga ${idLiga}: ${error.message}`)
    }
  }

  /**
   * Elimina la liga y expulsa a todos sus participantes.
   * Solo puede ejecutarla el administrador de la liga.
   * @param {string} idLiga
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async function eliminarLiga(idLiga) {
    const storeAutenticacion = usarStoreAutenticacion()
    const correoUsuario = storeAutenticacion.usuarioActual.correoAutenticacion

    try {
      const datosLiga = await cargarLiga(idLiga)
      if (!datosLiga) {
        return { success: false, message: 'La liga no existe.' }
      }

      if (datosLiga.correoOrganizador !== correoUsuario) {
        return { success: false, message: 'Acceso denegado: No eres el administrador.' }
      }

      const participaciones = await cargarParticipacionesLiga(idLiga)
      for (const participacion of participaciones) {
        const uidParticipante =
          participacion.uid_usuario || (await buscarUidPorCorreo(participacion.email_usuario))
        if (uidParticipante) {
          await desvincularLigaDelUsuario(uidParticipante, idLiga)
        }
        await eliminarParticipacion(participacion.id)
      }

      await eliminarDocumentoLiga(idLiga)
      storeAutenticacion.usuarioActual.idsLigas = storeAutenticacion.usuarioActual.idsLigas.filter(
        (id) => id !== idLiga,
      )

      if (idLigaActiva.value === idLiga) {
        idLigaActiva.value = null
      }

      await cargarLigasUsuario()
      return { success: true, message: 'Has eliminado la liga.' }
    } catch (error) {
      console.error(`Error al eliminar la liga ${idLiga}:`, error)
      return { success: false, message: `Error al eliminar la liga: ${error.message}` }
    }
  }

  /**
   * Carga el ranking de puntos de todos los participantes de una liga.
   * @param {string} idLiga - ID de la liga cuya clasificación se quiere obtener.
   * @returns {Promise<Array>} Array de participantes ordenado por puntos descendente.
   */
  async function cargarClasificacion(idLiga) {
    try {
      return await cargarRankingLiga(idLiga)
    } catch (error) {
      throw new Error(`Error al cargar la clasificación de la liga ${idLiga}: ${error.message}`)
    }
  }

  return {
    detallesLigas,
    idLigaActiva,
    cargarLigasUsuario,
    crearLiga,
    unirseALiga,
    abandonarLiga,
    expulsarParticipante,
    cargarParticipantesLiga,
    eliminarLiga,
    cargarClasificacion,
  }
})
