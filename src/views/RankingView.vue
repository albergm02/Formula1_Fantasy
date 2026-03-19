<template>
  <div class="min-h-screen bg-[#15151E] font-sans pb-24">
    <Header />

    <main class="mx-auto w-full max-w-4xl p-4 flex flex-col gap-4 mt-4">
      
      <div class="flex justify-center border-b border-[#FFFFFF]/50 pb-2">
        <h2 class="text-2xl font-black text-white uppercase">Clasificación general</h2>
      </div>

      <!-- En caso de que no se hayan cargado los datos -->
      <div v-if="cargando" class="flex flex-col items-center justify-center py-10 gap-3">
        <i class="pi pi-spinner text-4xl text-[#00E5E5] animate-spin"></i>
        <p class="text-[#00E5E5] text-sm font-bold uppercase tracking-widest animate-pulse">Cargando clasificación...</p>
      </div>

      <!-- En caso de que si se hayan cargado los datos -->
      <div v-else class="flex flex-col gap-3">
        <!-- Mostramos usuarios, resaltamos al usuario actual -->
        <div v-for="(jugador, index) in clasificacion" :key="jugador.id"
          class="flex items-center justify-between p-4 border border-white"
          :class="{'!border-[#FF1E00] !bg-[#FF1E00]/10': jugador.email === authStore.usuarioGlobal.emailAuth}">
          
          <div class="flex items-center gap-4">
            <!-- Lo pongo arriba a la izquierda, dependiendo del index de clasificación le pongo un color u otro -->
            <div class="text-2xl font-black italic -top-4 relative"
              :class="{
              'text-yellow-400': index === 0,
              'text-gray-200': index === 1,
              'text-amber-600': index === 2,
              'text-[#FFFFFF]': index > 2
              }">{{ index + 1 }}º</div>
            <div class="flex flex-col">
              <span class="font-bold text-lg uppercase text-white">
                {{ jugador.nombre }}
              </span>
              <span class="text-xs mt-1 text-[#D9D9D9]">
                Presupuesto: <span class="text-[#FF1E00] font-bold">${{ jugador.presupuesto }}M</span>
              </span>
            </div>
          </div>

          <div class="text-right flex flex-col items-end justify-center">
            <span class="text-3xl font-black text-[#00E5E5]">
              {{ jugador.puntos }}
            </span>
            <span class="text-xs uppercase font-bold mt-1 text-[#D9D9D9]"> <!-- W1P5YQ-->
              PTS
            </span>
          </div>
        </div>
      </div>
    </main>
    <Navbar />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useLigasStore } from '@/stores/storeLigas'
import { useAuthStore } from '@/stores/storeAuth'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'

import Navbar from '@/components/Navbar.vue'
import Header from '@/components/Header.vue'

const ligasStore = useLigasStore()
const authStore = useAuthStore()
const route = useRoute()

const clasificacion = ref([])
const cargando = ref(true)

/**
 * Función para cargar la clasificación de la liga activa. Se obtiene el ID de la liga ya sea por query o por estado global.
 * Luego se consulta la colección de participaciones para esa liga,
 * por cada participación se obtiene el nombre del usuario asociado (si existe) para mostrarlo en la clasificación. 
 * Finalmente, se ordena la clasificación por puntos y presupuesto.
 * Si ocurre algún error durante el proceso, se muestra un mensaje en la consola.
 */
const cargarClasificacion = async () => {
  cargando.value = true
  try {
    const ligaId = route.query.liga || ligasStore.ligaActiva
    if (!ligaId) {
      console.error('Error: No se encontró una liga activa (RankingView)')
      cargando.value = false
      return
    }
    
    ligasStore.ligaActiva = ligaId
    const participacionesRef = collection(db, 'participaciones')
    const q = query(participacionesRef, where('id_liga', '==', ligaId))
    const snap = await getDocs(q)
    const escuderiasData = []
    
    for (const docSnap of snap.docs) {
      const data = docSnap.data()
      let nombre = 'Desconocido'
      
      if (data.email_usuario) {
        const usuarioRef = doc(db, 'usuarios', data.email_usuario)
        const usuarioSnap = await getDoc(usuarioRef)
        if (usuarioSnap.exists()) {
          const usuarioData = usuarioSnap.data()
          nombre = usuarioData.username || usuarioData.nombre || 'Desconocido'
        }
      }
      
      escuderiasData.push({
        id: docSnap.id,
        email: data.email_usuario, 
        nombre: nombre,
        puntos: data.puntos || 0,
        presupuesto: data.presupuesto || 0,
      })
    }
    clasificacion.value = escuderiasData.sort((a, b) => b.puntos - a.puntos || b.presupuesto - a.presupuesto)

  } catch (error) {
    console.error('Error al cargar la clasificación (RankingView):', error)
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  cargarClasificacion()
})
</script>