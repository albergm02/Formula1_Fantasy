<script setup>
/* ============================================================================
/* IMPORTACIONES */
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card' // <-- Importamos el componente Card de PrimeVue
import { signOut } from '@/services/authService'
import { useFantasyStore } from '@/stores/storeFantasy'

/* ============================================================================
/* ESTADOS Y VARIABLES */
const router = useRouter()
const almacenFantasy = useFantasyStore()

/* ============================================================================
/* FUNCIONES */
const cerrarSesion = async () => {
  try {
    await signOut()
    router.push('/')
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
  }
}
</script>


<template>
  <div class="min-h-screen w-full bg-[#15151e] p-4 pb-32 relative font-sans">
    <div class="mx-auto w-full max-w-5xl flex flex-col gap-8">
      
      <!-- Header fijo -->
      <header class="fixed top-0 left-0 w-full bg-[#15151e] border-b border-[#2e2e38] p-4 z-40 flex items-center justify-between">
        <div class="mx-auto w-full max-w-5xl flex items-center justify-between">
          
          <!-- Información del usuario -->
          <div class="flex items-center gap-2">
            <div class="w-12 h-12 rounded bg-[#e10600] flex items-center justify-center text-white font-black shadow-lg shadow-red-900/20">
              {{ almacenFantasy.usuario.iniciales }}
            </div>
            
            <div class="flex flex-col justify-center">
              <h2 class="text-xl font-black text-white uppercase">
                {{ almacenFantasy.usuario.nombre }}
              </h2>
              
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs text-[#8a8a9d] font-medium">
                  Puntos: <strong class="text-[#ffb800]">{{ almacenFantasy.usuario.puntos }}</strong>
                </span>
                <span class="text-xs text-[#2e2e38]">|</span>
                <span class="text-xs text-[#10b981] font-bold tracking-wide">
                  {{ almacenFantasy.usuario.presupuesto }}M
                </span>
              </div>
            </div>
          </div>

          <!-- Botón de cerrar sesión -->
          <Button
            @click="cerrarSesion"
            class="w-10 h-10 rounded-lg !bg-[#2e2e38] !text-[#8a8a9d] !border-none flex items-center justify-center hover:!bg-[#e10600] hover:!text-white !transition-colors"
          >
            <i class="pi pi-sign-out" style="font-size: 1.2rem"></i>
          </Button>
           
        </div>
      </header>

      <!-- Contenido principal -->
      <main class="mt-28 flex flex-col gap-4 w-full">

        <!-- Tarjeta de próxima carrera -->
        <Card class="!bg-[#15151e] !border !border-[#2e2e38] !border-l-4 !border-l-[#e10600] !shadow-lg !rounded-xl">
          <template #content>
            <div class="flex justify-between items-center">
              <div class="flex flex-col">
                <span class="text-[10px] text-[#e10600] font-bold uppercase tracking-widest">Próxima Carrera</span>
                <h4 class="text-white font-black uppercase italic text-xl leading-tight mt-1">GP de Bahrein</h4>
                <span class="text-xs text-[#8a8a9d] mt-2 flex items-center gap-1">
                  <i class="pi pi-clock text-[10px]"></i> Sábado, 16:00 h
                </span>
              </div>
              <div class="w-14 h-14 rounded-full bg-[#2e2e38]/50 flex items-center justify-center">
                <i class="pi pi-flag-fill text-2xl text-[#8a8a9d]"></i>
              </div>
            </div>
          </template>
        </Card>
        <!-- Fin tarjeta de próxima carrera -->


      </main>
      
    </div>

    <nav class="fixed bottom-0 left-0 w-full bg-[#15151e] border-t border-[#2e2e38] p-2 flex justify-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
      <div class="w-full max-w-4xl flex justify-around items-center gap-2">
        
        <Button class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-[#2e2e38]/50 !transition-colors">
          <i class="pi pi-home" style="font-size: 1.3rem; color: #e10600"></i>
          <span class="text-[9px] text-[#e10600] mt-1 font-black tracking-widest whitespace-nowrap">INICIO</span>
        </Button>

        <Button class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-[#2e2e38]/50 !transition-colors">
          <i class="pi pi-chart-bar" style="font-size: 1.3rem; color: #8a8a9d"></i>
          <span class="text-[9px] text-[#8a8a9d] mt-1 font-medium tracking-widest whitespace-nowrap">RANKING</span>
        </Button>

        <Button @click="router.push('/garaje')" class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-[#2e2e38]/50 !transition-colors">
          <i class="pi pi-warehouse" style="font-size: 1.3rem; color: #8a8a9d"></i>
          <span class="text-[9px] text-[#8a8a9d] mt-1 font-medium tracking-widest whitespace-nowrap">GARAJE</span>
        </Button>

        <Button @click="router.push('/mercado')" class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-[#2e2e38]/50 !transition-colors">
          <i class="pi pi-shopping-cart" style="font-size: 1.3rem; color: #8a8a9d"></i>
          <span class="text-[9px] text-[#8a8a9d] mt-1 font-medium tracking-widest whitespace-nowrap">MERCADO</span>
        </Button>

        <Button class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-[#2e2e38]/50 !transition-colors">
          <i class="pi pi-bell" style="font-size: 1.3rem; color: #8a8a9d"></i>
          <span class="text-[9px] text-[#8a8a9d] mt-1 font-medium tracking-widest whitespace-nowrap">AVISOS</span>
        </Button>

        <Button class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-[#2e2e38]/50 !transition-colors">
          <i class="pi pi-cog" style="font-size: 1.3rem; color: #8a8a9d"></i>
          <span class="text-[9px] text-[#8a8a9d] mt-1 font-medium tracking-widest whitespace-nowrap">AJUSTES</span>
        </Button>
        
      </div>
    </nav>
  </div>
</template>