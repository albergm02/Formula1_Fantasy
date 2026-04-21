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

const enrutador = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: rutas,
})

enrutador.beforeEach(async (to) => {
  const usuario = await obtenerUsuarioActual()
  const storeAutenticacion = usarStoreAutenticacion()
  const storeLigas = usarStoreLigas()

  // Si hay usuario pero aún no se han cargado sus datos, los inicializamos
  if (usuario && !storeAutenticacion.datosCargados) {
    await storeAutenticacion.verificarExistenciaPerfil(usuario.email)
  }

  // Si no hay sesión activa, limpiamos el store para ocultar el spinner
  if (!usuario && !storeAutenticacion.datosCargados) {
    storeAutenticacion.limpiarSesion()
  }

  // Si la ruta requiere autenticación pero no hay usuario, redirigimos al login
  if (to.meta.requiresAuth && !usuario) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Si el usuario no ha verificado su correo, lo bloqueamos en la vista de verificación.
  // Las cuentas de Google ya vienen verificadas, por lo que este guard no les afecta.
  const rutaVerificacion = to.name === 'verificar-correo'
  if (usuario && !usuario.emailVerified && !rutaVerificacion) {
    return { name: 'verificar-correo' }
  }
  if (usuario && usuario.emailVerified && rutaVerificacion) {
    return { name: 'ligas' }
  }

  // Si la ruta requiere ser invitado pero hay usuario, redirigimos según su rol
  if (to.meta.requiresGuest && usuario) {
    if (!storeAutenticacion.perfilExiste) {
      return { name: 'registro-google' }
    }
    return { name: 'ligas' }
  }

  // Si el usuario tiene sesión pero no ha completado su perfil, redirigimos al registro de Google
  if (usuario && !storeAutenticacion.perfilExiste && !to.meta.requiresIncompleteProfile) {
    return { name: 'registro-google' }
  }

  // Si la ruta requiere perfil incompleto pero el perfil ya existe, redirigimos a ligas
  if (to.meta.requiresIncompleteProfile && storeAutenticacion.perfilExiste) {
    return { name: 'ligas' }
  }

  // Si la ruta requiere liga pero el usuario no tiene ligas, redirigimos a ligas,
  // si el usuario tiene ligas pero no se han cargado, las cargamos antes de permitir el acceso
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

export default enrutador
