import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { usarStorePerfil } from './storePerfil'
import { usarStoreLigas } from './storeLigas'
import {
  cargarActividadLiga,
  registrarActividad,
  TIPOS_ACTIVIDAD,
} from '@/services/servicioNotificaciones'

export const usarStoreNotificaciones = defineStore('notificaciones', () => {
  const storePerfil = usarStorePerfil()
  const storeLigas = usarStoreLigas()

  const actividad = ref([])
  const cargando = ref(false)

  const actividadReciente = computed(() => {
    const haceVeinticuatroHoras = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return actividad.value.filter((evento) => evento.fecha > haceVeinticuatroHoras).length
  })

  async function cargarActividad() {
    const idLiga = storeLigas.idLigaActiva
    if (!idLiga) return

    cargando.value = true
    try {
      actividad.value = await cargarActividadLiga(idLiga)
    } catch (error) {
      actividad.value = []
      throw new Error(`Error al cargar la actividad de la liga: ${error.message}`)
    } finally {
      cargando.value = false
    }
  }

  async function registrarFichaje(nombreElemento, tipoElemento, precioElemento) {
    const idLiga = storeLigas.idLigaActiva
    const nombreUsuario = storePerfil.usuarioActual.nombreVisible

    await registrarActividad(idLiga, {
      nombreUsuario,
      tipo: TIPOS_ACTIVIDAD.COMPRA,
      descripcion: `ha fichado ${tipoElemento} ${nombreElemento} por ${precioElemento}M`,
    })

    await cargarActividad()
  }

  async function registrarVenta(nombreElemento, tipoElemento) {
    const idLiga = storeLigas.idLigaActiva
    const nombreUsuario = storePerfil.usuarioActual.nombreVisible

    await registrarActividad(idLiga, {
      nombreUsuario,
      tipo: TIPOS_ACTIVIDAD.VENTA,
      descripcion: `ha liberado ${tipoElemento} ${nombreElemento}`,
    })

    await cargarActividad()
  }

  async function registrarIncorporacion(nombreLiga) {
    const idLiga = storeLigas.idLigaActiva
    const nombreUsuario = storePerfil.usuarioActual.nombreVisible

    await registrarActividad(idLiga, {
      nombreUsuario,
      tipo: TIPOS_ACTIVIDAD.INCORPORACION,
      descripcion: `se ha unido al campeonato ${nombreLiga}`,
    })

    await cargarActividad()
  }

  async function registrarAbandono(idLiga, nombreLiga) {
    const nombreUsuario = storePerfil.usuarioActual.nombreVisible

    await registrarActividad(idLiga, {
      nombreUsuario,
      tipo: TIPOS_ACTIVIDAD.ABANDONO,
      descripcion: `ha abandonado el campeonato ${nombreLiga}`,
    })
  }

  async function registrarCreacionLiga(idLiga, nombreLiga) {
    const nombreUsuario = storePerfil.usuarioActual.nombreVisible

    await registrarActividad(idLiga, {
      nombreUsuario,
      tipo: TIPOS_ACTIVIDAD.CREACION,
      descripcion: `ha creado la liga ${nombreLiga}`,
    })
  }

  return {
    actividad,
    cargando,
    actividadReciente,
    cargarActividad,
    registrarFichaje,
    registrarVenta,
    registrarIncorporacion,
    registrarAbandono,
    registrarCreacionLiga,
  }
})
