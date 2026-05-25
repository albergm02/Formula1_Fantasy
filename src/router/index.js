import { createRouter, createWebHistory } from 'vue-router'
import { obtenerUsuarioActual } from '@/services/servicioAutenticacion'
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
    path: '/jornada',
    name: 'jornada',
    component: () => import('../views/NoticiasJornadaView.vue'),
    meta: { requiresAuth: true, requiresLiga: true },
  },
  {
    path: '/admin',
    name: 'administracion',
    component: () => import('../views/AdministracionView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/perfil',
    name: 'perfil',
    component: () => import('../views/PerfilView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/verificar-correo',
    name: 'verificar-correo',
    component: () => import('../views/VerificacionCorreoView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: rutas,
})

router.beforeEach(async (to) => {
  const usuario = await obtenerUsuarioActual()
  const storeAutenticacion = usarStoreAutenticacion()
  const storeLigas = usarStoreLigas()

  if (usuario && !storeAutenticacion.datosCargados) {
    await storeAutenticacion.verificarExistenciaPerfil(usuario.email)
  }

  // En rutas de admin recargamos el perfil para asegurar el flag actualizado.
  if (usuario && to.meta.requiresAdmin) {
    await storeAutenticacion.verificarExistenciaPerfil(usuario.email)
  }

  if (!usuario && !storeAutenticacion.datosCargados) {
    storeAutenticacion.limpiarSesion()
  }

  if (to.meta.requiresAuth && !usuario) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // El correo sin verificar bloquea el acceso a todo salvo a la propia vista de verificación.
  const rutaVerificacion = to.name === 'verificar-correo'
  if (usuario && !usuario.emailVerified && !rutaVerificacion) {
    return { name: 'verificar-correo' }
  }
  if (usuario && usuario.emailVerified && rutaVerificacion) {
    return { name: 'ligas' }
  }

  if (to.meta.requiresGuest && usuario) {
    if (!storeAutenticacion.perfilExiste) {
      return { name: 'registro-google' }
    }
    if (storeAutenticacion.esAdministrador) {
      return { name: 'administracion' }
    }
    return { name: 'ligas' }
  }

  if (usuario && !storeAutenticacion.perfilExiste && !to.meta.requiresIncompleteProfile) {
    return { name: 'registro-google' }
  }

  if (to.meta.requiresIncompleteProfile && storeAutenticacion.perfilExiste) {
    return { name: 'ligas' }
  }

  if (to.meta.requiresAdmin && !storeAutenticacion.esAdministrador) {
    return { name: 'login' }
  }

  // Las rutas que requieren liga necesitan que el usuario tenga al menos una;
  // si las ligas no están cargadas todavía, las cargamos antes de continuar.
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

export default router
