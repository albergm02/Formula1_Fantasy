<template>
  <Header />

  <main class="mx-auto w-full max-w-4xl p-4 flex flex-col gap-6 mt-4 mb-20">
    <div class="flex flex-col gap-3">
      <div v-for="(jugador, index) in clasificacion" :key="jugador.id"
        class="flex items-center justify-between p-4 rounded-xl border shadow-md transition-all duration-300 hover:scale-[1.01]">
        <div class="flex items-center gap-4">
          <div class="w-8 text-center">
            <span class="text-2xl font-black italic">{{ index + 1 }}º</span>
          </div>
          <div class="flex flex-col">
            <span class="font-bold text-lg leading-none uppercase tracking-wider">
              {{ jugador.nombre }}
            </span>
            <span class="text-xs opacity-70 mt-1 font-mono">
              Presupuesto: {{ jugador.presupuesto }}M
            </span>
          </div>
        </div>

        <div class="text-right flex flex-col items-end justify-center">
          <span class="text-3xl font-black italic leading-none drop-shadow-sm">
            {{ jugador.puntos }}
          </span>
          <span class="text-[10px] uppercase font-bold tracking-widest opacity-80 mt-1">
            PTS
          </span>
        </div>
      </div>

      <div v-if="clasificacion.length === 0" class="text-center py-10">
        <i class="pi pi-flag text-4xl text-zinc-600 mb-2"></i>
        <p class="text-zinc-500 font-bold uppercase tracking-widest">No hay pilotos en la parrilla.</p>
      </div>
    </div>

  </main>

  <Navbar />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useEscuderiaStore } from '@/stores/storeEscuderia'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/services/firebase'
import Navbar from '@/components/Navbar.vue'
import Header from '@/components/Header.vue'

const escuderiaStore = useEscuderiaStore()
const clasificacion = ref([])

const cargarClasificacion = async () => {
  try {
    const ligaId = escuderiaStore.ligaActivaId
    if (!ligaId) {
      console.error('Error: No se encontró una liga activa (RankingView)')
      return
    }

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
          nombre = usuarioData.nombre || 'Desconocido'
        }
      }
      escuderiasData.push({
        id: docSnap.id,
        nombre: nombre,
        puntos: data.puntos || 0,
        presupuesto: data.presupuesto || 0,
      })
    }
    clasificacion.value = escuderiasData.sort((a, b) => b.puntos - a.puntos || b.presupuesto - a.presupuesto)

  } catch (error) {
    console.error('Error al cargar la clasificación (RankingView):', error)
  }
}

onMounted(() => {
  cargarClasificacion()
})

</script>
