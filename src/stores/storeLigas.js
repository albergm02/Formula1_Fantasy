import { ref } from 'vue'
import { defineStore } from 'pinia'
import { usarStoreUsuario } from './storeUsuario'
import {
  cargarLigasPorIds,
  cargarLiga,
  buscarLigaPorCodigo,
  crearDocumentoLiga,
  actualizarLiga,
  eliminarLigaComoOrganizador,
  expulsarParticipanteComoOrganizador,
  crearParticipacion,
  cargarParticipacionesLiga,
  actualizarParticipacion,
  eliminarParticipacion,
  contarLigasAdministradas,
  vincularLigaAlUsuario,
  desvincularLigaDelUsuario,
  cargarRankingLiga,
  inicializarMercadoLiga,
  cargarGarajeDeParticipante,
} from '@/services/servicioLigas'
import { registrarActividad, TIPOS_ACTIVIDAD } from '@/services/servicioNotificaciones'
import { eliminarMisPujasDeLiga } from '@/services/servicioMercado'
import { usarStoreNotificaciones } from './storeNotificaciones'

const MAX_LIGAS = 5
const alcanzoLimiteLigas = (idsLigas = []) =>
  Array.isArray(idsLigas) && idsLigas.length >= MAX_LIGAS
const generarCodigoInvitacionLiga = () => Math.random().toString(36).substring(2, 10).toUpperCase()
const crearGarajeVacio = () => ({ coches: [], pilotos: [], potenciadores: [] })

// Hereda el rol el miembro con mayor antigüedad (fecha_union más antigua).
const elegirSiguienteAdministrador = (participaciones) =>
  [...participaciones].sort((a, b) => a.fecha_union.toMillis() - b.fecha_union.toMillis())[0]

export const usarStoreLigas = defineStore('ligas', () => {
  const detallesLigas = ref([])
  const idLigaActiva = ref(null)

  async function cargarLigasUsuario() {
    const storeUsuario = usarStoreUsuario()
    const idsAlmacenados = storeUsuario.usuarioActual.idsLigas

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
        const uid = storeUsuario.usuarioActual.uid
        for (const idHuerfano of idsHuerfanos) {
          await desvincularLigaDelUsuario(uid, idHuerfano)
        }
        storeUsuario.usuarioActual.idsLigas = idsValidos
      }
    } catch (error) {
      detallesLigas.value = []
      throw new Error(`Error al cargar las ligas del usuario: ${error.message}`)
    }
  }

  async function crearLiga(nombreLiga) {
    const storeUsuario = usarStoreUsuario()
    const correoUsuario = storeUsuario.usuarioActual.correoAutenticacion
    const uid = storeUsuario.usuarioActual.uid

    if (alcanzoLimiteLigas(storeUsuario.usuarioActual.idsLigas)) {
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
        nombre_usuario: storeUsuario.usuarioActual.nombreVisible,
        rol: 'organizador',
        presupuesto: 50.0,
        puntos: 0,
        garaje: crearGarajeVacio(),
        fecha_union: new Date(),
      })

      await vincularLigaAlUsuario(uid, idLiga)
      storeUsuario.usuarioActual.idsLigas.push(idLiga)

      inicializarMercadoLiga(idLiga).catch(() => {})

      const storeNotificaciones = usarStoreNotificaciones()
      storeNotificaciones.registrarCreacionLiga(idLiga, nombreLiga).catch(() => {})

      await cargarLigasUsuario()
      return { success: true, message: `Liga creada. Código: ${codigoInvitacion}` }
    } catch (error) {
      return { success: false, message: 'Error al crear la liga. Inténtalo de nuevo.' }
    }
  }

  async function unirseALiga(codigoInvitacion) {
    const storeUsuario = usarStoreUsuario()
    const correoUsuario = storeUsuario.usuarioActual.correoAutenticacion
    const uid = storeUsuario.usuarioActual.uid

    if (alcanzoLimiteLigas(storeUsuario.usuarioActual.idsLigas)) {
      return { success: false, message: 'Solo puedes pertenecer a un máximo de 5 ligas.' }
    }

    try {
      const liga = await buscarLigaPorCodigo(codigoInvitacion)
      if (!liga) {
        return { success: false, message: 'Código de invitación no válido.' }
      }

      if (storeUsuario.usuarioActual.idsLigas.includes(liga.id)) {
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
        nombre_usuario: storeUsuario.usuarioActual.nombreVisible,
        rol: 'miembro',
        presupuesto: 50.0,
        puntos: 0,
        garaje: crearGarajeVacio(),
        fecha_union: new Date(),
      })

      await actualizarLiga(liga.id, { participantes: liga.participantes + 1 })
      await vincularLigaAlUsuario(uid, liga.id)
      storeUsuario.usuarioActual.idsLigas.push(liga.id)

      registrarActividad(liga.id, {
        nombreUsuario: storeUsuario.usuarioActual.nombreVisible,
        tipo: TIPOS_ACTIVIDAD.INCORPORACION,
        descripcion: `se ha unido al campeonato ${liga.nombre}`,
      }).catch(() => {})

      await cargarLigasUsuario()
      return { success: true, message: 'Te has unido a la liga.' }
    } catch (error) {
      return { success: false, message: 'Error al unirse a la liga. Inténtalo de nuevo.' }
    }
  }

  async function abandonarLiga(idLiga) {
    const storeUsuario = usarStoreUsuario()
    const correoUsuario = storeUsuario.usuarioActual.correoAutenticacion

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
        nombreUsuario: storeUsuario.usuarioActual.nombreVisible,
        tipo: TIPOS_ACTIVIDAD.ABANDONO,
        descripcion: `ha abandonado el campeonato ${datosLiga.nombre}`,
      }).catch(() => {})

      await eliminarMisPujasDeLiga(idLiga)
      await eliminarParticipacion(participacionPropia.id)
      await desvincularLigaDelUsuario(storeUsuario.usuarioActual.uid, idLiga)

      storeUsuario.usuarioActual.idsLigas = storeUsuario.usuarioActual.idsLigas.filter(
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

  async function expulsarParticipante(idLiga, emailParticipante) {
    try {
      const resultado = await expulsarParticipanteComoOrganizador(idLiga, emailParticipante)
      return {
        success: true,
        message: `${resultado.nombreExpulsado} ha sido expulsado.`,
      }
    } catch (error) {
      return { success: false, message: `Error al expulsar al participante: ${error.message}` }
    }
  }

  async function cargarParticipantesLiga(idLiga) {
    try {
      return await cargarParticipacionesLiga(idLiga)
    } catch (error) {
      throw new Error(`Error al cargar los participantes de la liga ${idLiga}: ${error.message}`)
    }
  }

  async function eliminarLiga(idLiga) {
    const storeUsuario = usarStoreUsuario()

    try {
      await eliminarLigaComoOrganizador(idLiga)

      storeUsuario.usuarioActual.idsLigas = storeUsuario.usuarioActual.idsLigas.filter(
        (id) => id !== idLiga,
      )

      if (idLigaActiva.value === idLiga) {
        idLigaActiva.value = null
      }

      await cargarLigasUsuario()
      return { success: true, message: 'Has eliminado la liga.' }
    } catch (error) {
      return { success: false, message: `Error al eliminar la liga: ${error.message}` }
    }
  }

  async function cargarClasificacion(idLiga) {
    try {
      return await cargarRankingLiga(idLiga)
    } catch (error) {
      throw new Error(`Error al cargar la clasificación de la liga ${idLiga}: ${error.message}`)
    }
  }

  async function cargarGarajeRival(idParticipacion) {
    try {
      return await cargarGarajeDeParticipante(idParticipacion)
    } catch (error) {
      throw new Error(`Error al cargar el garaje del rival ${idParticipacion}: ${error.message}`)
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
    cargarGarajeRival,
  }
})
