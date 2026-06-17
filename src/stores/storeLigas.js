import { ref } from 'vue'
import { defineStore } from 'pinia'
import { usarStorePerfil } from './storePerfil'
import * as servicioLigas from '@/services/servicioLigas'
import { registrarActividad, TIPOS_ACTIVIDAD } from '@/services/servicioActividad'
import * as servicioMercado from '@/services/servicioMercado'
import { usarStoreActividad } from './storeActividad'

const MAX_LIGAS = 5
const alcanzoLimiteLigas = (idsLigas = []) =>
  Array.isArray(idsLigas) && idsLigas.length >= MAX_LIGAS
const generarCodigoInvitacionLiga = () => Math.random().toString(36).substring(2, 10).toUpperCase()
const crearGarajeVacio = () => ({ coches: [], pilotos: [], potenciadores: [] })

// Hereda el rol el miembro con mayor antig�edad (fecha_union m�s antigua).
const elegirSiguienteOrganizador = (participaciones) =>
  [...participaciones].sort((a, b) => a.fecha_union.toMillis() - b.fecha_union.toMillis())[0]

export const usarStoreLigas = defineStore('ligas', () => {
  const detallesLigas = ref([])
  const idLigaActiva = ref(null)

  async function cargarLigasUsuario() {
    const storePerfil = usarStorePerfil()
    const idsAlmacenados = storePerfil.usuarioActual.idsLigas

    if (!idsAlmacenados.length) {
      detallesLigas.value = []
      return
    }

    try {
      const ligasCargadas = await servicioLigas.cargarLigas(idsAlmacenados)
      detallesLigas.value = ligasCargadas

      const idsValidos = ligasCargadas.map((liga) => liga.id)
      const idsHuerfanos = idsAlmacenados.filter((id) => !idsValidos.includes(id))

      if (idsHuerfanos.length > 0) {
        const uid = storePerfil.usuarioActual.uid
        for (const idHuerfano of idsHuerfanos) {
          await servicioLigas.desvincularLigaDelUsuario(uid, idHuerfano)
        }
        storePerfil.usuarioActual.idsLigas = idsValidos
      }
    } catch (error) {
      detallesLigas.value = []
      throw new Error(`Error al cargar las ligas del usuario: ${error.message}`)
    }
  }

  async function crearLiga(nombreLiga) {
    const storePerfil = usarStorePerfil()
    const correoUsuario = storePerfil.usuarioActual.correoAutenticacion
    const uid = storePerfil.usuarioActual.uid

    if (alcanzoLimiteLigas(storePerfil.usuarioActual.idsLigas)) {
      return { success: false, message: 'Solo puedes pertenecer a un máximo de 5 ligas.' }
    }

    try {
      const ligasAdministradas = await servicioLigas.contarLigasOrganizadas(correoUsuario)
      if (ligasAdministradas >= 2) {
        return {
          success: false,
          message: 'Has alcanzado el límite máximo de 2 ligas creadas.',
        }
      }

      const codigoInvitacion = generarCodigoInvitacionLiga()
      const idLiga = await servicioLigas.crearLiga({
        nombre: nombreLiga,
        correoOrganizador: correoUsuario,
        codigo_invitacion: codigoInvitacion,
        participantes: 1,
        fecha_creacion: new Date(),
      })

      await servicioLigas.crearParticipacion({
        presupuesto: 50.0,
        puntos: 0,
        garaje: crearGarajeVacio(),
        fecha_union: new Date(),
      })

      await servicioLigas.vincularLigaAlUsuario(uid, idLiga)
      storePerfil.usuarioActual.idsLigas.push(idLiga)

      servicioLigas.inicializarMercado(idLiga).catch(() => {})

      const storeActividad = usarStoreActividad()
      storeActividad.registrarCreacionLiga(idLiga, nombreLiga).catch(() => {})

      await cargarLigasUsuario()
      return { success: true, message: `Liga creada. Código: ${codigoInvitacion}` }
    } catch (error) {
      return { success: false, message: 'Error al crear la liga. Inténtalo de nuevo.' }
    }
  }

  async function unirseALiga(codigoInvitacion) {
    const storePerfil = usarStorePerfil()
    const correoUsuario = storePerfil.usuarioActual.correoAutenticacion
    const uid = storePerfil.usuarioActual.uid

    if (alcanzoLimiteLigas(storePerfil.usuarioActual.idsLigas)) {
      return { success: false, message: 'Solo puedes pertenecer a un máximo de 5 ligas.' }
    }

    try {
      const liga = await servicioLigas.buscarLigaPorCodigo(codigoInvitacion)
      if (!liga) {
        return { success: false, message: 'Código de invitación no válido.' }
      }

      if (storePerfil.usuarioActual.idsLigas.includes(liga.id)) {
        return { success: false, message: 'Ya perteneces a esta liga.' }
      }

      const expulsados = liga.expulsados || []
      if (expulsados.includes(correoUsuario)) {
        return {
          success: false,
          message: 'Has sido expulsado de esta liga y no puedes volver a unirte.',
        }
      }

      await servicioLigas.crearParticipacion({
        id_liga: liga.id,
        uid_usuario: uid,
        email_usuario: correoUsuario,
        nombre_usuario: storePerfil.usuarioActual.nombreVisible,
        rol: 'miembro',
        presupuesto: 50.0,
        puntos: 0,
        garaje: crearGarajeVacio(),
        fecha_union: new Date(),
      })

      await servicioLigas.actualizarLiga(liga.id, { participantes: liga.participantes + 1 })
      await servicioLigas.vincularLigaAlUsuario(uid, liga.id)
      storePerfil.usuarioActual.idsLigas.push(liga.id)

      registrarActividad(liga.id, {
        nombreUsuario: storePerfil.usuarioActual.nombreVisible,
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
    const storePerfil = usarStorePerfil()
    const correoUsuario = storePerfil.usuarioActual.correoAutenticacion

    try {
      const datosLiga = await servicioLigas.cargarLiga(idLiga)
      if (!datosLiga) {
        return { success: false, message: 'La liga no existe.' }
      }

      const participaciones = await servicioLigas.cargarParticipantes(idLiga)
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
        const siguienteOrganizador = elegirSiguienteOrganizador(participacionesRestantes)
        await servicioLigas.actualizarParticipacion(siguienteOrganizador.id, { rol: 'organizador' })
        await servicioLigas.actualizarLiga(idLiga, {
          correoOrganizador: siguienteOrganizador.email_usuario,
          participantes: datosLiga.participantes - 1,
        })
      } else {
        await servicioLigas.actualizarLiga(idLiga, { participantes: datosLiga.participantes - 1 })
      }

      registrarActividad(idLiga, {
        nombreUsuario: storePerfil.usuarioActual.nombreVisible,
        tipo: TIPOS_ACTIVIDAD.ABANDONO,
        descripcion: `ha abandonado el campeonato ${datosLiga.nombre}`,
      }).catch(() => {})

      await servicioMercado.eliminarPujas(idLiga)
      await servicioLigas.eliminarParticipacion(participacionPropia.id)
      await servicioLigas.desvincularLigaDelUsuario(storePerfil.usuarioActual.uid, idLiga)

      storePerfil.usuarioActual.idsLigas = storePerfil.usuarioActual.idsLigas.filter(
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
      const resultado = await servicioLigas.expulsarParticipante(idLiga, emailParticipante)
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
      return await servicioLigas.cargarParticipantes(idLiga)
    } catch (error) {
      throw new Error(`Error al cargar los participantes de la liga ${idLiga}: ${error.message}`)
    }
  }

  async function eliminarLiga(idLiga) {
    const storePerfil = usarStorePerfil()

    try {
      await servicioLigas.eliminarLiga(idLiga)

      storePerfil.usuarioActual.idsLigas = storePerfil.usuarioActual.idsLigas.filter(
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
      return await servicioLigas.cargarClasificacion(idLiga)
    } catch (error) {
      throw new Error(`Error al cargar la clasificación de la liga ${idLiga}: ${error.message}`)
    }
  }

  async function cargarGarajeRival(idParticipacion) {
    try {
      return await servicioLigas.cargarGarajeRival(idParticipacion)
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
