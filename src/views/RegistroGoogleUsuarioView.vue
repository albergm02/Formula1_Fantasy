<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

/* Servicios de autenticaciÃ³n */
import { cerrarSesion } from '@/services/servicioAutenticacion'
import { usarStoreAutenticacion } from '@/stores/storeAutenticacion'

/* Componentes UI */
import MagicRings from '@/components/MagicRings.vue'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'

/* ValidaciÃ³n con Zod */
import { Form } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'
import { esquemaNombreUsuario } from '@/utils/validacionesAutenticacion'

/* Esquema de validaciÃ³n con Zod */
const esquemaValidacion = zodResolver(
  z.object({
    username: esquemaNombreUsuario,
  })
)

const enrutador = useRouter()
const storeAutenticacion = usarStoreAutenticacion()

/* Estados */
const cargando = ref(false)
const errorAutenticacion = ref('')
const valoresInicialesFormulario = ref({
  username: '',
})

/* Handler Completar perfil de Google (elegir nombre de piloto) */
const handlerCompletarPerfilGoogle = async ({ valid, values }) => {
  if (!valid) return

  const usuarioNormalizado = values.username.trim()
  cargando.value = true
  errorAutenticacion.value = ''

  try {
    // Verificamos que exista una sesiÃ³n de Google activa antes de continuar
    if (!storeAutenticacion.usuarioActual.correoAutenticacion) {
      throw new Error('No se encontrÃ³ una sesiÃ³n vÃ¡lida de Google.')
    }

    // Creamos el perfil del usuario en Firestore con el nombre elegido
    await storeAutenticacion.inicializarDatosUsuario(storeAutenticacion.usuarioActual.correoAutenticacion, usuarioNormalizado)
    enrutador.push('/ligas')
  } catch (error) {
    errorAutenticacion.value = 'Error al completar el registro con Google: ' + error.message
  } finally {
    cargando.value = false
  }
}

/* Handler Cancelar registro con Google */
const cancelarRegistroGoogle = async () => {
  if (cargando.value) return

  await cerrarSesion()
  enrutador.push('/')
}
</script>

<!-------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!-------------------------------------------------------------------------------------------------------------------------->

<template>
  <div class="relative flex items-center justify-center min-h-screen overflow-hidden p-4">

    <!-- AnimaciÃ³n de fondo -->
    <MagicRings class="absolute inset-0 -z-10" color="#E10600" :ringCount="2" />

    <!-- Tarjeta principal -->
    <Card class="w-full max-w-md p-2 lg:p-4 !bg-black/40 border rounded-xl shadow-2xl backdrop-blur-md border-zinc-800">

      <!-- Encabezado con logo y tÃ­tulo -->
      <template #title>
        <div class="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="Logo F1" class="w-16 h-16 object-contain" />
          <div class="text-center">
            <h1 class="text-2xl font-black uppercase tracking-widest text-[#E10600]">Completa tu perfil</h1>
          </div>
        </div>
      </template>

      <!-- Contenido del formulario -->
      <template #content>
        <Form v-slot="$form" class="flex flex-col gap-4 mt-4" :initial-values="valoresInicialesFormulario"
          :resolver="esquemaValidacion" @submit="handlerCompletarPerfilGoogle">

          <p class="text-sm text-[#F0ECEC] text-center">
            Es tu primera vez entrando con Google. Elige tu nombre de piloto para continuar.
          </p>

          <div class="flex flex-col gap-1">
            <label for="username" class="ml-1 text-xs font-bold uppercase tracking-wider text-[#F0ECEC]">
              Nombre de Piloto
            </label>
            <InputText id="username" type="text" name="username" placeholder="MagicAlonso33"
              class="w-full p-3 !bg-[#1A1A1F] !text-[#F0ECEC] rounded-lg focus:ring-1 focus:ring-[#E10600] !border-[#F0ECEC]" />
            <Message v-if="$form.username?.invalid" severity="error" size="small" variant="simple" class="ml-1">
              {{ $form.username.error.message }}
            </Message>
          </div>

          <Message v-if="errorAutenticacion" severity="error" :closable="false" class="mt-2 text-sm">
            {{ errorAutenticacion }}
          </Message>

          <div class="flex flex-col gap-3 mt-4">
            <Button type="submit" label="Continuar" :loading="cargando"
              class="w-full py-3 !bg-[#E10600] font-black uppercase !text-[#F0ECEC] rounded-lg shadow-lg transition-colors !border-none hover:!bg-[#C00500]" />

            <Button type="button" label="Cancelar" :disabled="cargando"
              class="w-full py-3 !bg-transparent font-black uppercase !text-[#D4A843] rounded-lg shadow-lg transition-colors !border border-[#D4A843] hover:!bg-[#D4A843]/10"
              @click="cancelarRegistroGoogle" />
          </div>
        </Form>
      </template>
    </Card>
  </div>
</template>



