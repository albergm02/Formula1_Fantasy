import { ref } from 'vue'
import { defineStore } from 'pinia'
import { usarStoreAutenticacion } from './storeAutenticacion'
const crearGarajeVacio = () => ({ coche: null, pilotos: [], potenciadores: [], ruedas: null })
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
} from '@/services/servicioLigas'
import { registrarActividad, TIPOS_ACTIVIDAD } from '@/services/servicioNotificaciones'

const MAX_LIGAS = 8
const alcanzoLimiteLigas = (idsLigas = []) =>
  Array.isArray(idsLigas) && idsLigas.length >= MAX_LIGAS
const generarCodigoInvitacionLiga = () => Math.random().toString(36).substring(2, 8).toUpperCase()

export const usarStoreLigas = defineStore('ligas', () => {
  const detallesLigas = ref([])
  const idLigaActiva = ref(null)

  /**
   * Carga las ligas a las que pertenece el usuario y las guarda en el estado.
   * @returns {Promise<void>}
   */
  async function cargarLigasUsuario() {
    const storeAutenticacion = usarStoreAutenticacion()

    if (!storeAutenticacion.usuarioActual.idsLigas.length) {
      detallesLigas.value = []
      return
    }

    try {
      detallesLigas.value = await cargarLigasPorIds(storeAutenticacion.usuarioActual.idsLigas)
    } catch (error) {
      detallesLigas.value = []
      throw new Error(`Error al cargar las ligas del usuario: ${error.message}`)
    }
  }

  /**
   * Crea una nueva liga y registra al usuario como administrador.
   * Aplica dos límites: máximo 8 ligas por usuario y máximo 2 ligas creadas.
   * @param {string} nombreLiga - Nombre de la liga (3–15 caracteres, validado en la vista).
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async function crearLiga(nombreLiga) {
    const storeAutenticacion = usarStoreAutenticacion()
    const correoUsuario = storeAutenticacion.usuarioActual.correoAutenticacion

    if (alcanzoLimiteLigas(storeAutenticacion.usuarioActual.idsLigas)) {
      return { success: false, message: 'Solo puedes pertenecer o crear un máximo de 8 ligas.' }
    }

    try {
      const ligasAdministradas = await contarLigasAdministradas(correoUsuario)
      if (ligasAdministradas >= 2) {
        return {
          success: false,
          message: 'Reglamento FIA: Has alcanzado el límite máximo de 2 ligas creadas.',
        }
      }

      const codigoInvitacion = generarCodigoInvitacionLiga()
      const idLiga = await crearDocumentoLiga({
        nombre: nombreLiga,
        admin: correoUsuario,
        codigo_invitacion: codigoInvitacion,
        participantes: 1,
        fecha_creacion: new Date(),
      })

      await crearParticipacion({
        id_liga: idLiga,
        email_usuario: correoUsuario,
        rol: 'admin',
        presupuesto: 50.0,
        puntos: 0,
        garaje: crearGarajeVacio(),
      })

      await vincularLigaAlUsuario(correoUsuario, idLiga)
      storeAutenticacion.usuarioActual.idsLigas.push(idLiga)
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

    if (alcanzoLimiteLigas(storeAutenticacion.usuarioActual.idsLigas)) {
      return { success: false, message: 'Solo puedes pertenecer o crear un máximo de 8 ligas.' }
    }

    try {
      const liga = await buscarLigaPorCodigo(codigoInvitacion)
      if (!liga) {
        return { success: false, message: 'Código de invitación no válido.' }
      }

      if (storeAutenticacion.usuarioActual.idsLigas.includes(liga.id)) {
        return { success: false, message: 'Ya perteneces a esta liga.' }
      }

      await crearParticipacion({
        id_liga: liga.id,
        email_usuario: correoUsuario,
        rol: 'miembro',
        presupuesto: 50.0,
        puntos: 0,
        garaje: crearGarajeVacio(),
      })

      await actualizarLiga(liga.id, { participantes: liga.participantes + 1 })
      await vincularLigaAlUsuario(correoUsuario, liga.id)
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
   * Si es administrador, cede el rol al participante con más puntos antes de salir.
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

      if (participacionPropia.rol === 'admin') {
        const siguienteAdministrador = participacionesRestantes.sort(
          (primero, segundo) => segundo.puntos - primero.puntos,
        )[0]
        await actualizarParticipacion(siguienteAdministrador.id, { rol: 'admin' })
        await actualizarLiga(idLiga, {
          admin: siguienteAdministrador.email_usuario,
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
      await desvincularLigaDelUsuario(correoUsuario, idLiga)

      storeAutenticacion.usuarioActual.idsLigas = storeAutenticacion.usuarioActual.idsLigas.filter(
        (id) => id !== idLiga,
      )

      if (idLigaActiva.value === idLiga) {
        idLigaActiva.value = null
      }

      await cargarLigasUsuario()
      return { success: true, message: 'Has abandonado la liga.' }
    } catch (error) {
      return { success: false, message: 'Error de telemetría al abandonar.' }
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

      if (datosLiga.admin !== correoUsuario) {
        return { success: false, message: 'Acceso denegado: No eres la FIA (Admin).' }
      }

      const participaciones = await cargarParticipacionesLiga(idLiga)
      for (const participacion of participaciones) {
        await desvincularLigaDelUsuario(participacion.email_usuario, idLiga)
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
      return { success: true, message: 'Campeonato disuelto con éxito.' }
    } catch (error) {
      return { success: false, message: 'Error al destruir la liga.' }
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
    eliminarLiga,
    cargarClasificacion,
  }
})
