<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'

/* Stores */
import { usarStoreLigas } from '@/stores/storeLigas'
import { usarStoreAutenticacion } from '@/stores/storeAutenticacion'
import { usarStoreEscuderia } from '@/stores/storeEquipo'
import { db } from '@/services/servicioFirebase'

/* Componentes UI */
import BarraNavegacion from '@/components/BarraNavegacion.vue'
import Cabecera from '@/components/Cabecera.vue'

const ligasStore = usarStoreLigas()
const storeAutenticacion = usarStoreAutenticacion()
const escuderiaStore = usarStoreEscuderia()
const route = useRoute()

/* Estados */
const ranking = ref([])
const isLoading = ref(true)

/* Carga la clasificaciÃ³n de la liga activa desde Firestore */
const loadRanking = async () => {
  isLoading.value = true

  try {
    const leagueId = route.query.liga || ligasStore.idLigaActiva
    if (!leagueId) {
      isLoading.value = false
      return
    }

    ligasStore.idLigaActiva = leagueId

    // Consultamos todas las participaciones de esta liga
    const participantsRef = collection(db, 'participaciones')
    const leagueQuery = query(participantsRef, where('id_liga', '==', leagueId))
    const participantsSnapshot = await getDocs(leagueQuery)
    const participantRows = []

    // Para cada participante, buscamos su nombre de usuario en la colecciÃ³n de usuarios
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
        puntos: participantData.puntos || 0,
        presupuesto: participantData.presupuesto || 0,
      })
    }

    // Ordenamos: primero por puntos (desc), luego por presupuesto (desc) como desempate
    ranking.value = participantRows.sort(
      (firstPlayer, secondPlayer) =>
        secondPlayer.puntos - firstPlayer.puntos || secondPlayer.presupuesto - firstPlayer.presupuesto,
    )
  } catch (error) {
    // Si falla la carga, el ranking queda vacÃ­o
  } finally {
    isLoading.value = false
  }
}

/* Si no hay liga activa, la recuperamos de la query. Luego cargamos el ranking */
onMounted(async () => {
  if (!escuderiaStore.idLigaActiva && route.query.liga) {
    await escuderiaStore.cargarEquipo(route.query.liga)
  }

  await loadRanking()
})
</script>

<!-------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!-------------------------------------------------------------------------------------------------------------------------->

<template>
  <div class="min-h-screen bg-[#1A1A1F] font-sans pb-24">
    <Cabecera />

    <main class="mx-auto w-full max-w-md p-4 flex flex-col gap-4 mt-4">

      <!-- TÃ­tulo de la clasificaciÃ³n -->
      <div class="flex justify-center border-b border-[#FFFFFF]/50 pb-2">
        <h2 class="text-2xl font-black text-white uppercase">ClasificaciÃ³n general</h2>
      </div>

      <!-- Spinner de carga -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-10 gap-3">
        <i class="pi pi-spinner text-4xl text-[#D4A843] animate-spin"></i>
        <p class="text-[#D4A843] text-sm font-bold uppercase tracking-widest animate-pulse">Cargando clasificaciÃ³n...
        </p>
      </div>

      <!-- Listado de jugadores ordenados por puntos -->
      <div v-else class="flex flex-col gap-3">
        <div v-for="(player, index) in ranking" :key="player.id"
          class="flex items-center justify-between p-4 border border-white"
          :class="{ '!border-[#E10600] !bg-[#E10600]/10': player.email === storeAutenticacion.usuarioActual.correoAutenticacion }">
          <div class="flex items-center gap-4">
            <div class="text-2xl font-black italic -top-4 relative" :class="{
              'text-yellow-400': index === 0,
              'text-gray-200': index === 1,
              'text-amber-600': index === 2,
              'text-[#FFFFFF]': index > 2
            }">{{ index + 1 }}Âº</div>
            <div class="flex flex-col">
              <span class="font-bold text-lg uppercase text-white">
                {{ player.name }}
              </span>
              <span class="text-xs mt-1 text-[#F0ECEC]">
                Presupuesto: <span class="text-[#E10600] font-bold">${{ player.presupuesto }}M</span>
              </span>
            </div>
          </div>

          <div class="text-right flex flex-col items-end justify-center">
            <span class="text-3xl font-black text-[#D4A843]">
              {{ player.puntos }}
            </span>
            <span class="text-xs uppercase font-bold mt-1 text-[#F0ECEC]">
              PTS
            </span>
          </div>
        </div>
      </div>
    </main>
    <BarraNavegacion />
  </div>
</template>


