<script setup>
import { useRouter } from 'vue-router'
import { useFantasyStore } from '@/stores/storeFantasy'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

import Button from 'primevue/button'
import Card from 'primevue/card'
import { signOut } from '@/services/authService'

const router = useRouter()
const fantasyStore = useFantasyStore()
const toast = useToast()
const confirm = useConfirm()

const cerrarSesion = async () => {
  try {
    await signOut()
    router.push('/')
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
  }
}

const confirmarVenta = (elemento, tipo) => {
  confirm.require({
    message: `¿Estás seguro de que quieres vender a ${elemento.nombre} por ${elemento.precio}M?`,
    header: 'Confirmar Venta',
    icon: 'pi pi-shopping-bag',
    acceptLabel: 'Sí, vender',
    rejectLabel: 'Cancelar',
    accept() {
      fantasyStore.venderElemento(tipo, elemento.idInstancia)
      toast.add({
        severity: 'success',
        summary: 'Venta completada',
        detail: `Has recuperado ${elemento.precio}M`,
        life: 3000,
      })
    }
  })
}

const intentarEquiparPieza = (idInstancia) => {
  const respuesta = fantasyStore.toggleEquiparPieza(idInstancia)
  
  // Si el Store nos bloquea (porque no hay coche), mostramos la alerta
  if (respuesta && !respuesta.exito) {
    toast.add({
      severity: 'warn',
      summary: 'Acción denegada',
      detail: respuesta.mensaje,
      life: 3000,
    })
  }
}
</script>

<template>
  <div class="mt-20 min-h-screen w-full bg-[#15151e] p-4 pb-32 relative font-sans">
    <div class="mx-auto w-full max-w-5xl flex flex-col gap-8">
      
      <header class="fixed top-0 left-0 w-full bg-[#15151e] border-b border-[#2e2e38] p-4 z-40 flex items-center justify-between shadow-sm">
        <div class="mx-auto w-full max-w-5xl flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-12 h-12 rounded bg-[#e10600] flex items-center justify-center text-white font-black shadow-lg shadow-red-900/20">
              {{ fantasyStore.usuario.iniciales }}
            </div>
            <div class="flex flex-col justify-center">
              <h2 class="text-xl font-black text-white uppercase">{{ fantasyStore.usuario.nombre }}</h2>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs text-[#8a8a9d] font-medium">
                  Puntos: <strong class="text-[#ffb800]">{{ fantasyStore.usuario.puntos }}</strong>
                </span>
                <span class="text-xs text-[#2e2e38]">|</span>
                <span class="text-xs text-[#10b981] font-bold tracking-wide">{{ fantasyStore.usuario.presupuesto }}M</span>
              </div>
            </div>
          </div>
          <Button @click="cerrarSesion" icon="pi pi-sign-out" class="!w-10 !h-10 !bg-[#2e2e38] !text-[#8a8a9d] !border-none hover:!bg-[#e10600] hover:!text-white" />
        </div>
      </header>

      <section>
        <h2 class="text-lg font-black italic text-white uppercase tracking-wide border-l-4 border-[#e10600] pl-2 mb-4">
          Mi Monoplaza (1/1)
        </h2>
        
        <Card v-if="fantasyStore.garaje.coche" class="!bg-[#15151e] !border !border-[#2e2e38] !shadow-none w-full md:w-1/2 overflow-hidden">
          <template #header>
            <div class="relative aspect-[4/3] bg-[#2e2e38]/30">
              <img :src="fantasyStore.garaje.coche.imagen" class="absolute inset-0 w-full h-full object-cover" />
              <div class="absolute top-2 left-2 bg-[#15151e]/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-black text-white">
                {{ fantasyStore.garaje.coche.nombre }} <span class="text-[#10b981] ml-1">{{ fantasyStore.garaje.coche.precio }}M</span>
              </div>
            </div>
          </template>
          <template #footer>
            <Button @click="confirmarVenta(fantasyStore.garaje.coche, 'coche')" label="VENDER" icon="pi pi-shopping-bag" class="!w-full !bg-transparent !text-[#8a8a9d] !border !border-[#2e2e38] hover:!border-red-500 hover:!text-red-500 !text-xs !font-black" />
          </template>
        </Card>

        <div v-else class="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#2e2e38] rounded-xl text-[#8a8a9d]">
          <i class="pi pi-car text-3xl mb-2"></i>
          <span class="text-xs font-bold uppercase">Sin Chasis</span>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-black italic text-white uppercase tracking-wide border-l-4 border-[#e10600] pl-2 mb-4">
          Mis Asientos ({{ fantasyStore.garaje.pilotos.length }}/2)
        </h2>

        <div v-if="fantasyStore.garaje.pilotos.length > 0" class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card v-for="piloto in fantasyStore.garaje.pilotos" :key="piloto.idInstancia" class="!bg-[#15151e] !border !border-[#2e2e38] !shadow-none overflow-hidden flex flex-col h-full">
            <template #header>
              <div class="relative aspect-[3/4] bg-[#2e2e38]/30">
                <img :src="piloto.imagen" class="absolute inset-0 w-full h-full object-cover" />
                <div class="absolute bottom-2 left-2 right-2 bg-[#15151e]/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-black text-white truncate text-center">
                  {{ piloto.nombre }}
                </div>
              </div>
            </template>
            <template #footer>
              <Button @click="confirmarVenta(piloto, 'piloto')" label="VENDER" class="!w-full !p-2 !bg-transparent !text-[#8a8a9d] !border !border-[#2e2e38] hover:!border-red-500 hover:!text-red-500 !text-xs !font-black" />
            </template>
          </Card>
        </div>

        <div v-else class="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#2e2e38] rounded-xl text-[#8a8a9d]">
          <i class="pi pi-users text-3xl mb-2"></i>
          <span class="text-xs font-bold uppercase">Asientos Vacíos</span>
        </div>
      </section>

      <section class="mb-32">
        <h2 class="text-lg font-black italic text-white uppercase tracking-wide border-l-4 border-[#e10600] pl-2 mb-4">
          Mi Inventario de Piezas
        </h2>

        <div v-if="fantasyStore.garaje.potenciadores.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card v-for="pieza in fantasyStore.garaje.potenciadores" :key="pieza.idInstancia" class="!bg-[#15151e] !border !shadow-none overflow-hidden" :class="pieza.equipado ? '!border-[#e10600]' : '!border-[#2e2e38]'">
            <template #header>
              <div class="relative aspect-square p-4 bg-[#2e2e38]/10 flex items-center justify-center">
                <img :src="pieza.imagen" class="w-full h-full object-contain drop-shadow-lg transition-all" :class="!pieza.equipado && 'opacity-50 grayscale'" />
                
                <Button 
                  @click="intentarEquiparPieza(pieza.idInstancia)"
                  :icon="pieza.equipado ? 'pi pi-minus' : 'pi pi-plus'" 
                  class="!absolute !top-2 !right-2 !w-8 !h-8 !rounded-full !p-0 !text-white transition-colors"
                  :class="pieza.equipado ? '!bg-[#e10600] !border-none' : '!bg-[#2e2e38] !border-none'"
                />
              </div>
            </template>
            <template #content>
               <div class="text-center pt-2">
                 <p class="text-[10px] font-black uppercase text-white truncate">{{ pieza.nombre }}</p>
                 <span class="text-[9px] font-bold" :class="pieza.equipado ? 'text-[#10b981]' : 'text-[#8a8a9d]'">
                   {{ pieza.equipado ? 'INSTALADO' : 'EN LA CAJA' }}
                 </span>
               </div>
            </template>
          </Card>
        </div>

        <div v-else class="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#2e2e38] rounded-xl text-[#8a8a9d]">
          <i class="pi pi-cog text-3xl mb-2"></i>
          <span class="text-xs font-bold uppercase">Sin Mejoras Compradas</span>
        </div>
      </section>    
    </div>



    <!-- Navegación inferior -->
    <nav class="fixed bottom-0 left-0 w-full bg-[#15151e] border-t border-[#2e2e38] p-2 flex justify-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
      <div class="w-full max-w-4xl flex justify-around items-center gap-2">
        
        <Button @click="router.push('/inicio')" class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-[#2e2e38]/50 !transition-colors">
          <i class="pi pi-home" style="font-size: 1.3rem; color: #8a8a9d"></i>
          <span class="text-[9px] text-[#8a8a9d] mt-1 font-medium tracking-widest whitespace-nowrap">INICIO</span>
        </Button>

        <Button class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-[#2e2e38]/50 !transition-colors">
          <i class="pi pi-chart-bar" style="font-size: 1.3rem; color: #8a8a9d"></i>
          <span class="text-[9px] text-[#8a8a9d] mt-1 font-medium tracking-widest whitespace-nowrap">RANKING</span>
        </Button>

        <Button class="flex-1 flex-col items-center !p-2 !bg-transparent !border-none hover:!bg-[#2e2e38]/50 !transition-colors">
          <i class="pi pi-warehouse" style="font-size: 1.3rem; color: #e10600"></i>
          <span class="text-[9px] text-[#e10600] mt-1 font-black tracking-widest whitespace-nowrap">GARAJE</span>
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
    <!-- Fin de navegación inferior -->
  </div>
</template>
