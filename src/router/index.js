import { createRouter, createWebHistory } from 'vue-router'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'

const routes = [
  {
    path: '/',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresGuest: true }, // Protege la ruta de inicio de sesión para usuarios no autenticados
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue'),
    meta: { requiresGuest: true }, // Protege la ruta de registro para usuarios no autenticados
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true }, // Protege la ruta del dashboard para usuarios autenticados
  },
  {
    path: '/:pathMatch(.*)*', // Redirecciona todas las rutas no definidas a la página de inicio
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

/* Protege las rutas que requieren autenticación y redirige a la página de inicio de sesión si el usuario no está autenticado. 
También redirige a la página del dashboard si el usuario ya está autenticado y trata de acceder a las rutas de inicio de sesión o registro. */

router.beforeEach(async (to) => {
  const user = await getCurrentUser()
  if (to.meta.requiresAuth && !user) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresGuest && user) {
    return { name: 'dashboard' }
  }
  return true
})

function getCurrentUser() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe()
        resolve(user)
      },
      reject,
    )
  })
}

export default router
