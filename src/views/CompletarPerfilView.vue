<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { usarStoreAutenticacion } from '@/stores/storeAutenticacion'
import { usarStorePerfil } from '@/stores/storePerfil'

import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'

import { Form } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'

const esquemaValidacion = zodResolver(
  z.object({
    username: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres.').max(12, 'El nombre no debe exceder los 12 caracteres.'),
  })
)

const router = useRouter()
const storeAutenticacion = usarStoreAutenticacion()
const storePerfil = usarStorePerfil()

const cargando = ref(false)
const errorAutenticacion = ref('')
const valoresInicialesFormulario = ref({
  username: '',
})

const handleCompletarPerfil = async ({ valid, values }) => {
  if (!valid) return
  const nombreNormalizado = values.username.trim()
  cargando.value = true
  errorAutenticacion.value = ''

  try {
    if (!storePerfil.usuarioActual.correoAutenticacion) {
      throw new Error('No se encontró una sesión válida de Google.')
    }

    await storeAutenticacion.crearPerfil(nombreNormalizado)
    router.push('/ligas')
  } catch (error) {
    errorAutenticacion.value = `Error al completar el registro con Google: ${error.message}`
  } finally {
    cargando.value = false
  }
}

const cancelarRegistroConGoogle = async () => {
  if (cargando.value) return

  await storeAutenticacion.cerrarSesion()
  router.push('/')
}
</script>


<template>
  <div class="flex items-center justify-center relative min-h-screen p-4 overflow-hidden">

    <Card class="w-full max-w-md p-2 lg:p-4 !bg-black/20 backdrop-blur-md border border-zinc-800">

      <template #title>
        <div class="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="Logo F1" class="w-16 h-16 object-contain" />
          <div class="text-center">
            <h1 class="text-2xl font-black uppercase tracking-widest text-[#D4A843]">Completa tu perfil</h1>
          </div>
        </div>
      </template>

      <template #content>
        <Form v-slot="$form" class="flex flex-col gap-4 mt-4" :initial-values="valoresInicialesFormulario"
          :resolver="esquemaValidacion" @submit="handleCompletarPerfil">

          <p class="text-center text-sm text-[#F0ECEC]">
            Es tu primera vez entrando con Google. Elige tu nombre de piloto para continuar.
          </p>

          <div class="flex flex-col gap-1">
            <label for="username" class="ml-1 text-xs font-bold uppercase tracking-wider text-[#F0ECEC]">
              Nombre de Piloto
            </label>
            <InputText id="username" type="text" name="username" placeholder="Escribe aquí tu nombre de usuario..."
              class="w-full p-3 !bg-[#1A1A1F] !border-[#F0ECEC] !text-[#F0ECEC]" />
            <Message v-if="$form.username?.invalid" severity="error" size="small" variant="simple" class="ml-1">
              {{ $form.username.error.message }}
            </Message>
          </div>

          <Message v-if="errorAutenticacion" severity="error" :closable="false" class="mt-2 text-sm">
            {{ errorAutenticacion }}
          </Message>

          <div class="flex flex-col gap-3 mt-4">
            <Button type="submit" label="Continuar" :loading="cargando"
              class="w-full py-3 !bg-[#D4A843] !border-none shadow-lg font-black uppercase !text-black" />

            <Button type="button" label="Cancelar" :disabled="cargando"
              class="w-full py-3 !bg-gray-500/30 !border-none shadow-lg font-black uppercase !text-white"
              @click="cancelarRegistroConGoogle" />
          </div>
        </Form>
      </template>
    </Card>
  </div>
</template>
