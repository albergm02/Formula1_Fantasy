import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { usarStoreAutenticacion } from './storeAutenticacion'
import { usarStoreLigas } from './storeLigas'
import {
  cargarActividadLiga,
  registrarActividad,
  TIPOS_ACTIVIDAD,
} from '@/services/servicioNotificaciones'

export const usarStoreNotificaciones = defineStore('notificaciones', () => {
  const storeAutenticacion = usarStoreAutenticacion()
  const storeLigas = usarStoreLigas()

  const actividad = ref([])
  const cargando = ref(false)

  /**
   * Número de eventos registrados en las últimas 24 horas.
   * Se usa como badge indicador de actividad reciente en la barra de navegación.
   * @returns {number}
   */
  const actividadReciente = computed(() => {
    const haceVeinticuatroHoras = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return actividad.value.filter((evento) => evento.fecha > haceVeinticuatroHoras).length
  })

  /**
   * Carga el feed de actividad de la liga activa del usuario.
   * @returns {Promise<void>}
   */
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

  /**
   * Registra que el usuario actual ha fichado un elemento y actualiza el feed en memoria.
   * @param {string} nombreElemento - Nombre del piloto, coche o potenciador fichado.
   * @param {string} tipoElemento - Tipo legible del elemento ('piloto', 'coche', 'potenciador').
   * @returns {Promise<void>}
   */
  async function registrarFichaje(nombreElemento, tipoElemento) {
    const idLiga = storeLigas.idLigaActiva
    const nombreUsuario = storeAutenticacion.usuarioActual.nombreVisible

    await registrarActividad(idLiga, {
      nombreUsuario,
      tipo: TIPOS_ACTIVIDAD.COMPRA,
      descripcion: `ha fichado ${tipoElemento} ${nombreElemento}`,
    })

    await cargarActividad()
  }

  /**
   * Registra que el usuario actual ha vendido un elemento y actualiza el feed en memoria.
   * @param {string} nombreElemento - Nombre del elemento vendido.
   * @param {string} tipoElemento - Tipo legible del elemento.
   * @returns {Promise<void>}
   */
  async function registrarVenta(nombreElemento, tipoElemento) {
    const idLiga = storeLigas.idLigaActiva
    const nombreUsuario = storeAutenticacion.usuarioActual.nombreVisible

    await registrarActividad(idLiga, {
      nombreUsuario,
      tipo: TIPOS_ACTIVIDAD.VENTA,
      descripcion: `ha liberado ${tipoElemento} ${nombreElemento}`,
    })

    await cargarActividad()
  }

  return {
    actividad,
    cargando,
    actividadReciente,
    cargarActividad,
    registrarFichaje,
    registrarVenta,
  }
})
