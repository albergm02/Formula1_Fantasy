import { ref } from 'vue'
import { defineStore } from 'pinia'
import { usarStorePerfil } from './storePerfil'
import * as servicioLigas from '@/services/servicioLigas'

const MAX_LIGAS = 5
const alcanzoLimiteLigas = (idsLigas = []) => Array.isArray(idsLigas) && idsLigas.length >= MAX_LIGAS

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

    if (alcanzoLimiteLigas(storePerfil.usuarioActual.idsLigas)) {
      return { success: false, message: 'Solo puedes pertenecer a un máximo de 5 ligas.' }
    }

    try {
      const resultado = await servicioLigas.crearLiga(nombreLiga)
      storePerfil.usuarioActual.idsLigas.push(resultado.idLiga)
      await cargarLigasUsuario()
      return { success: true, message: `Liga creada. Código: ${resultado.codigoInvitacion}` }
    } catch (error) {
      return { success: false, message: error.message || 'Error al crear la liga. Inténtalo de nuevo.' }
    }
  }

    async function unirseALiga(codigoInvitacion) {
    const storePerfil = usarStorePerfil()

    if (alcanzoLimiteLigas(storePerfil.usuarioActual.idsLigas)) {
      return { success: false, message: 'Solo puedes pertenecer a un máximo de 5 ligas.' }
    }

    try {
      const resultado = await servicioLigas.unirseALiga(codigoInvitacion)
      storePerfil.usuarioActual.idsLigas.push(resultado.idLiga)
      await cargarLigasUsuario()
      return { success: true, message: 'Te has unido a la liga.' }
    } catch (error) {
      return { success: false, message: error.message || 'Error al unirse a la liga. Inténtalo de nuevo.' }
    }
  }

    async function abandonarLiga(idLiga) {
    try {
      await servicioLigas.abandonarLiga(idLiga)

      const storePerfil = usarStorePerfil()
      storePerfil.usuarioActual.idsLigas = storePerfil.usuarioActual.idsLigas.filter((id) => id !== idLiga)

      if (idLigaActiva.value === idLiga) idLigaActiva.value = null

      await cargarLigasUsuario()
      return { success: true, message: 'Has abandonado la liga.' }
    } catch (error) {
      return { success: false, message: 'Error al abandonar la liga.' }
    }
  }

    async function expulsarParticipante(idLiga, emailParticipante) {
    try {
      const resultado = await servicioLigas.expulsarParticipante(idLiga, emailParticipante)
      return { success: true, message: `${resultado.nombreExpulsado} ha sido expulsado.` }
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
      storePerfil.usuarioActual.idsLigas = storePerfil.usuarioActual.idsLigas.filter((id) => id !== idLiga)
      if (idLigaActiva.value === idLiga) idLigaActiva.value = null

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
