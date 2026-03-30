<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { cerrarSesion } from '@/services/servicioAutenticacion'
import { usarStoreAutenticacion } from '@/stores/storeAutenticacion'

import MagicRings from '@/components/vue-bits/MagicRings.vue'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'

import { Form } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'

const esquemaValidacion = zodResolver(
  z.object({
    username: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres').max(10, 'El nombre no debe exceder los 10 caracteres'),
  })
)

const enrutador = useRouter()
const storeAutenticacion = usarStoreAutenticacion()

const cargando = ref(false)
const errorAutenticacion = ref('')
const valoresInicialesFormulario = ref({
  username: '',
})

/**
 * Maneja el envío del formulario de completar perfil para usuarios de Google.
 * El correo ya está en el store (cargado por verificarExistenciaPerfil al iniciar con Google).
 * Solo necesita el nombre de piloto elegido para crear el documento en Firestore.
 * @param {{ valid: boolean, values: { username: string } }} formulario
 */
const manejarCompletarPerfilGoogle = async ({ valid, values }) => {
  if (!valid) return
  const nombreNormalizado = values.username.trim()
  cargando.value = true
  errorAutenticacion.value = ''

  try {
    if (!storeAutenticacion.usuarioActual.correoAutenticacion) {
      throw new Error('No se encontró una sesión válida de Google.')
    }

    await storeAutenticacion.cargarOCrearPerfil(
      storeAutenticacion.usuarioActual.correoAutenticacion,
      nombreNormalizado
    )
    enrutador.push('/ligas')
  } catch (error) {
    errorAutenticacion.value = `Error al completar el registro con Google: ${error.message}`
  } finally {
    cargando.value = false
  }
}

/**
 * Cancela el proceso de registro con Google, cierra la sesión activa y vuelve al login.
 * No actúa si hay una operación en curso para evitar estados inconsistentes.
 */
const cancelarRegistroConGoogle = async () => {
  if (cargando.value) return

  await cerrarSesion()
  enrutador.push('/')
}
</script>

<!-------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!-------------------------------------------------------------------------------------------------------------------------->

<template>
  <div class="flex items-center justify-center relative min-h-screen p-4 overflow-hidden">

    <!-- Animación de fondo -->
    <MagicRings class="absolute inset-0 -z-10" color="#E10600" :ringCount="2" />

    <!-- Tarjeta principal -->
    <Card class="w-full max-w-md p-2 lg:p-4 !bg-black/40 backdrop-blur-md border border-zinc-800 shadow-2xl">

      <!-- Encabezado con logo y título -->
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
          :resolver="esquemaValidacion" @submit="manejarCompletarPerfilGoogle">

          <p class="text-center text-sm text-[#F0ECEC]">
            Es tu primera vez entrando con Google. Elige tu nombre de piloto para continuar.
          </p>

          <div class="flex flex-col gap-1">
            <label for="username" class="ml-1 text-xs font-bold uppercase tracking-wider text-[#F0ECEC]">
              Nombre de Piloto
            </label>
            <InputText id="username" type="text" name="username" placeholder="MagicAlonso33"
              class="w-full p-3 !bg-[#1A1A1F] !border-[#F0ECEC] !text-[#F0ECEC] focus:ring-1 focus:ring-[#E10600]" />
            <Message v-if="$form.username?.invalid" severity="error" size="small" variant="simple" class="ml-1">
              {{ $form.username.error.message }}
            </Message>
          </div>

          <Message v-if="errorAutenticacion" severity="error" :closable="false" class="mt-2 text-sm">
            {{ errorAutenticacion }}
          </Message>

          <div class="flex flex-col gap-3 mt-4">
            <Button type="submit" label="Continuar" :loading="cargando"
              class="w-full py-3 !bg-[#E10600] !border-none shadow-lg font-black uppercase !text-[#F0ECEC] transition-colors hover:!bg-[#C00500]" />

            <Button type="button" label="Cancelar" :disabled="cargando"
              class="w-full py-3 !bg-transparent !border border-[#D4A843] shadow-lg font-black uppercase !text-[#D4A843] transition-colors hover:!bg-[#D4A843]/10"
              @click="cancelarRegistroConGoogle" />
          </div>
        </Form>
      </template>
    </Card>
  </div>
</template>
