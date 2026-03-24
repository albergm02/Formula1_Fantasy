<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'

/* Stores */
import { useLigasStore } from '@/stores/storeLeagues'
import { useAuthStore } from '@/stores/storeAuth'
import { useEscuderiaStore } from '@/stores/storeTeam'
import { db } from '@/services/firebase'

/* Componentes UI */
import Navbar from '@/components/Navbar.vue'
import Header from '@/components/Header.vue'

const ligasStore = useLigasStore()
const authStore = useAuthStore()
const escuderiaStore = useEscuderiaStore()
const route = useRoute()

/* Estados */
const ranking = ref([])
const isLoading = ref(true)

/* Carga la clasificación de la liga activa desde Firestore */
const loadRanking = async () => {
  isLoading.value = true

  try {
    const leagueId = route.query.liga || ligasStore.activeLeagueId
    if (!leagueId) {
      isLoading.value = false
      return
    }

    ligasStore.activeLeagueId = leagueId

    // Consultamos todas las participaciones de esta liga
    const participantsRef = collection(db, 'participaciones')
    const leagueQuery = query(participantsRef, where('id_liga', '==', leagueId))
    const participantsSnapshot = await getDocs(leagueQuery)
    const participantRows = []

    // Para cada participante, buscamos su nombre de usuario en la colección de usuarios
    for (const participantDocument of participantsSnapshot.docs) {
      const participantData = participantDocument.data()
      let playerName = 'Desconocido'

      if (participantData.email_usuario) {
        const userRef = doc(db, 'usuarios', participantData.email_usuario)
        const userSnapshot = await getDoc(userRef)
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data()
          playerName = userData.username || userData.nombre || 'Desconocido'
        }
      }

      participantRows.push({
        id: participantDocument.id,
        email: participantData.email_usuario,
        name: playerName,
        points: participantData.puntos || 0,
        budget: participantData.presupuesto || 0,
      })
    }

    // Ordenamos: primero por puntos (desc), luego por presupuesto (desc) como desempate
    ranking.value = participantRows.sort(
      (firstPlayer, secondPlayer) =>
        secondPlayer.points - firstPlayer.points || secondPlayer.budget - firstPlayer.budget,
    )
  } catch (error) {
    // Si falla la carga, el ranking queda vacío
  } finally {
    isLoading.value = false
  }
}

/* Si no hay liga activa, la recuperamos de la query. Luego cargamos el ranking */
onMounted(async () => {
  if (!escuderiaStore.activeLeagueId && route.query.liga) {
    await escuderiaStore.loadTeam(route.query.liga)
  }

  await loadRanking()
})
</script>

<!-------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!-------------------------------------------------------------------------------------------------------------------------->

<template>
  <div class="min-h-screen bg-[#15151E] font-sans pb-24">
    <Header />

    <main class="mx-auto w-full max-w-4xl p-4 flex flex-col gap-4 mt-4">

      <!-- Título de la clasificación -->
      <div class="flex justify-center border-b border-[#FFFFFF]/50 pb-2">
        <h2 class="text-2xl font-black text-white uppercase">Clasificación general</h2>
      </div>

      <!-- Spinner de carga -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-10 gap-3">
        <i class="pi pi-spinner text-4xl text-[#00E5E5] animate-spin"></i>
        <p class="text-[#00E5E5] text-sm font-bold uppercase tracking-widest animate-pulse">Cargando clasificación...
        </p>
      </div>

      <!-- Listado de jugadores ordenados por puntos -->
      <div v-else class="flex flex-col gap-3">
        <div v-for="(player, index) in ranking" :key="player.id"
          class="flex items-center justify-between p-4 border border-white"
          :class="{ '!border-[#FF1E00] !bg-[#FF1E00]/10': player.email === authStore.currentUser.authEmail }">
          <div class="flex items-center gap-4">
            <div class="text-2xl font-black italic -top-4 relative" :class="{
              'text-yellow-400': index === 0,
              'text-gray-200': index === 1,
              'text-amber-600': index === 2,
              'text-[#FFFFFF]': index > 2
            }">{{ index + 1 }}º</div>
            <div class="flex flex-col">
              <span class="font-bold text-lg uppercase text-white">
                {{ player.name }}
              </span>
              <span class="text-xs mt-1 text-[#D9D9D9]">
                Presupuesto: <span class="text-[#FF1E00] font-bold">${{ player.budget }}M</span>
              </span>
            </div>
          </div>

          <div class="text-right flex flex-col items-end justify-center">
            <span class="text-3xl font-black text-[#00E5E5]">
              {{ player.points }}
            </span>
            <span class="text-xs uppercase font-bold mt-1 text-[#D9D9D9]">
              PTS
            </span>
          </div>
        </div>
      </div>
    </main>
    <Navbar />
  </div>
</template>