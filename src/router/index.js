import { createRouter, createWebHistory } from 'vue-router'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'

const routes = [
  {
    path: '/',
    name: 'login',
    // 1. OJO AQUÍ: La raíz (/) TIENE que ser el LoginView, no el Dashboard.
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
    // 2. OJO AQUÍ: /inicio carga tu DashboardView
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
    path: '/clasificacion',
    name: 'clasificacion',
    component: () => import('../views/RankingView.vue'),
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

// 3. El Guardia de Seguridad (Guard)
router.beforeEach(async (to) => {
  const user = await getCurrentUser()

  // Si la ruta requiere estar logueado y NO hay usuario, patada al login
  if (to.meta.requiresAuth && !user) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Si la ruta es para invitados (Login/Registro) y YA estás logueado, patada al Dashboard
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
