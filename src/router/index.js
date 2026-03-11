import { createRouter, createWebHistory } from 'vue-router'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'

const routes = [
  {
    path: '/',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/registro',
    name: 'registro',
    component: () => import('../views/RegistroView.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/inicio',
    name: 'inicio',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/mercado',
    name: 'mercado',
    component: () => import('../views/MercadoView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/garaje',
    name: 'garaje',
    component: () => import('../views/GarajeView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

/* Protege las rutas que requieren autenticación y redirige a la página de inicio de sesión si el usuario no está autenticado. 
También redirige a la página de inicio si el usuario ya está autenticado y trata de acceder a las rutas de inicio de sesión o registro. */

router.beforeEach(async (to) => {
  const user = await getCurrentUser()
  if (to.meta.requiresAuth && !user) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresGuest && user) {
    return { name: 'inicio' }
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
