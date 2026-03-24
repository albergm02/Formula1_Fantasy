import { createRouter, createWebHistory } from 'vue-router'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'
import { useAuthStore } from '@/stores/storeAuth'
import { useLigasStore } from '@/stores/storeLigas'

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
    component: () => import('../views/RegisterView.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/registro-google',
    name: 'registro-google',
    component: () => import('../views/GoogleUsernameView.vue'),
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
    component: () => import('../views/DashboardView.vue'),
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
    component: () => import('../views/RankingView.vue'),
    meta: { requiresAuth: true, requiresLiga: true },
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

router.beforeEach(async (to) => {
  const user = await getCurrentUser()
  const authStore = useAuthStore()
  const ligasStore = useLigasStore()

  if (user && !authStore.usuarioGlobal.emailAuth) {
    await authStore.initializeUserData(user.email, user.displayName, {
      createIfMissing: false,
    })
  }

  if (to.meta.requiresAuth && !user) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresGuest && user) {
    if (!authStore.profileExists) {
      return { name: 'registro-google' }
    }

    return { name: 'ligas' }
  }

  if (user && !authStore.profileExists && !to.meta.requiresIncompleteProfile) {
    return { name: 'registro-google' }
  }

  if (to.meta.requiresIncompleteProfile && authStore.profileExists) {
    return { name: 'ligas' }
  }

  if (to.meta.requiresLiga) {
    if (
      authStore.usuarioGlobal.ligasIds.length > 0 &&
      ligasStore.leagueDetails.length === 0
    ) {
      await ligasStore.loadUserLeagues()
    }

    if (
      !authStore.usuarioGlobal ||
      !authStore.usuarioGlobal.ligasIds ||
      authStore.usuarioGlobal.ligasIds.length === 0
    ) {
      return { name: 'ligas' }
    }
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
