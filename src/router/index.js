import { createRouter, createWebHistory } from 'vue-router'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/servicioFirebase'
import { usarStoreAutenticacion } from '@/stores/storeAutenticacion'
import { usarStoreLigas } from '@/stores/storeLigas'

const rutas = [
  {
    path: '/',
    name: 'login',
    component: () => import('../views/InicioSesionView.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/registro',
    name: 'registro',
    component: () => import('../views/RegistroView.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/registro-google',
    name: 'registro-google',
    component: () => import('../views/RegistroGoogleUsuarioView.vue'),
    meta: { requiresAuth: true, requiresIncompleteProfile: true },
  },
  {
    path: '/ligas',
    name: 'ligas',
    component: () => import('../views/MisLigasView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/dashboard',
    name: 'inicio',
    component: () => import('../views/InicioView.vue'),
    meta: { requiresAuth: true, requiresLiga: true },
  },
  {
    path: '/mercado',
    name: 'mercado',
    component: () => import('../views/MercadoView.vue'),
    meta: { requiresAuth: true, requiresLiga: true },
  },
  {
    path: '/garaje',
    name: 'garaje',
    component: () => import('../views/GarajeView.vue'),
    meta: { requiresAuth: true, requiresLiga: true },
  },
  {
    path: '/clasificacion',
    name: 'clasificacion',
    component: () => import('../views/ClasificacionView.vue'),
    meta: { requiresAuth: true, requiresLiga: true },
  },
  {
    path: '/notificaciones',
    name: 'notificaciones',
    component: () => import('../views/NotificacionesView.vue'),
    meta: { requiresAuth: true, requiresLiga: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const enrutador = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: rutas,
})

enrutador.beforeEach(async (to) => {
  const usuario = await obtenerUsuarioActual()
  const storeAutenticacion = usarStoreAutenticacion()
  const storeLigas = usarStoreLigas()

  // Si hay usuario pero aÃºn no se han cargado sus datos, los inicializamos
  if (usuario && !storeAutenticacion.datosCargados) {
    await storeAutenticacion.verificarExistenciaPerfil(usuario.email)
  }

  // Si no hay sesiÃ³n activa, limpiamos el store para ocultar el spinner
  if (!usuario && !storeAutenticacion.datosCargados) {
    storeAutenticacion.limpiarSesion()
  }

  if (to.meta.requiresAuth && !usuario) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresGuest && usuario) {
    if (!storeAutenticacion.perfilExiste) {
      return { name: 'registro-google' }
    }

    return { name: 'ligas' }
  }

  if (usuario && !storeAutenticacion.perfilExiste && !to.meta.requiresIncompleteProfile) {
    return { name: 'registro-google' }
  }

  if (to.meta.requiresIncompleteProfile && storeAutenticacion.perfilExiste) {
    return { name: 'ligas' }
  }

  if (to.meta.requiresLiga) {
    if (
      storeAutenticacion.usuarioActual.idsLigas.length > 0 &&
      storeLigas.detallesLigas.length === 0
    ) {
      await storeLigas.cargarLigasUsuario()
    }

    if (
      !storeAutenticacion.usuarioActual ||
      !storeAutenticacion.usuarioActual.idsLigas ||
      storeAutenticacion.usuarioActual.idsLigas.length === 0
    ) {
      return { name: 'ligas' }
    }
  }

  return true
})

function obtenerUsuarioActual() {
  return new Promise((resolve, reject) => {
    const desuscribir = onAuthStateChanged(
      auth,
      (usuario) => {
        desuscribir()
        resolve(usuario)
      },
      reject,
    )
  })
}

export default enrutador
