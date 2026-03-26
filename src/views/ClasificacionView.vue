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
const ruta = useRoute()

/* Estados */
const ranking = ref([])
const cargando = ref(true)

/* Carga la clasificaciÃ³n de la liga activa desde Firestore */
const cargarClasificacion = async () => {
  cargando.value = true

  try {
    const idLiga = ruta.query.liga || ligasStore.idLigaActiva
    if (!idLiga) {
      cargando.value = false
      return
    }

    ligasStore.idLigaActiva = idLiga

    // Consultamos todas las participaciones de esta liga
    const referenciaParticipaciones = collection(db, 'participaciones')
    const consultaLiga = query(referenciaParticipaciones, where('id_liga', '==', idLiga))
    const instantaneaParticipaciones = await getDocs(consultaLiga)
    const filasParticipantes = []

    // Para cada participante, buscamos su nombre de usuario en la colecciÃ³n de usuarios
    for (const documentoParticipante of instantaneaParticipaciones.docs) {
      const datosParticipante = documentoParticipante.data()
      let nombreJugador = 'Desconocido'

      if (datosParticipante.email_usuario) {
        const referenciaUsuario = doc(db, 'usuarios', datosParticipante.email_usuario)
        const instantaneaUsuario = await getDoc(referenciaUsuario)
        if (instantaneaUsuario.exists()) {
          const datosUsuario = instantaneaUsuario.data()
          nombreJugador = datosUsuario.username || datosUsuario.nombre || 'Desconocido'
        }
      }

      filasParticipantes.push({
        id: documentoParticipante.id,
        email: datosParticipante.email_usuario,
        name: nombreJugador,
        puntos: datosParticipante.puntos || 0,
        presupuesto: datosParticipante.presupuesto || 0,
      })
    }

    // Ordenamos: primero por puntos (desc), luego por presupuesto (desc) como desempate
    ranking.value = filasParticipantes.sort(
      (primerJugador, segundoJugador) =>
        segundoJugador.puntos - primerJugador.puntos || segundoJugador.presupuesto - primerJugador.presupuesto,
    )
  } catch (error) {
    // Si falla la carga, el ranking queda vacÃ­o
  } finally {
    cargando.value = false
  }
}

/* Si no hay liga activa, la recuperamos de la query. Luego cargamos el ranking */
onMounted(async () => {
  if (!escuderiaStore.idLigaActiva && ruta.query.liga) {
    await escuderiaStore.cargarEquipo(ruta.query.liga)
  }

  await cargarClasificacion()
})
</script>

<!-------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!-------------------------------------------------------------------------------------------------------------------------->

<template>
  <div class="min-h-screen pb-24 bg-[#1A1A1F] font-sans">
    <Cabecera />

    <main class="mx-auto w-full max-w-md p-4 flex flex-col gap-4 mt-4">

      <!-- TÃ­tulo de la clasificaciÃ³n -->
      <div class="flex justify-center pb-2 border-b border-[#FFFFFF]/50">
        <h2 class="text-2xl font-black text-white uppercase">ClasificaciÃ³n general</h2>
      </div>

      <!-- Spinner de carga -->
      <div v-if="cargando" class="flex flex-col items-center justify-center py-10 gap-3">
        <i class="text-4xl text-[#D4A843] pi pi-spinner animate-spin"></i>
        <p class="text-[#D4A843] text-sm font-bold uppercase tracking-widest animate-pulse">Cargando clasificaciÃ³n...
        </p>
      </div>

      <!-- Listado de jugadores ordenados por puntos -->
      <div v-else class="flex flex-col gap-3">
        <div v-for="(player, index) in ranking" :key="player.id"
          class="flex items-center justify-between p-4 border border-white"
          :class="{ '!border-[#E10600] !bg-[#E10600]/10': player.email === storeAutenticacion.usuarioActual.correoAutenticacion }">
          <div class="flex items-center gap-4">
            <div class="relative text-2xl font-black italic -top-4" :class="{ 'text-yellow-400': index === 0, 'text-gray-200': index === 1, 'text-amber-600': index === 2, 'text-[#FFFFFF]': index > 2 }">{{ index + 1 }}Âº</div>
            <div class="flex flex-col">
              <span class="font-bold text-lg uppercase text-white">
                {{ player.name }}
              </span>
              <span class="mt-1 text-xs text-[#F0ECEC]">
                Presupuesto: <span class="text-[#E10600] font-bold">${{ player.presupuesto }}M</span>
              </span>
            </div>
          </div>

          <div class="flex flex-col items-end justify-center text-right">
            <span class="text-3xl font-black text-[#D4A843]">
              {{ player.puntos }}
            </span>
            <span class="mt-1 text-xs uppercase font-bold text-[#F0ECEC]">
              PTS
            </span>
          </div>
        </div>
      </div>
    </main>
    <BarraNavegacion />
  </div>
</template>



