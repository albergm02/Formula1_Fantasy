<template>
  <div class="relative min-h-screen overflow-hidden flex items-center justify-center p-4">
    <!-- Fondo animado -->
    <MagicRings class="absolute inset-0 -z-10" color="#FF1E00" :ringCount="2"/>
    <Card class="w-full max-w-md !bg-transparent">
      <template #title>
        <div class="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="Logo F1" class="h-16 w-16 object-contain" />
          <div class="text-center">
            <h1 class="uppercase text-3xl font-black text-[#FF1E00]">F1 Fantasy</h1>
          </div>
        </div>
      </template>

      <!-- Contenido del formulario de inicio de sesión -->
      <template #content>
        <Form v-slot="$form" class="flex flex-col gap-4 mt-4" :initial-values="initialValues" :resolver="resolver"
          @submit="iniciarSesion">
          <div class="flex flex-col gap-1">
            <label for="email" class="uppercase text-xs font-bold text-[#D9D9D9]">Email</label>
            <InputText id="email" type="email" name="email" autocomplete="email" placeholder="piloto@correo.com"
              class="w-full !border-[#D9D9D9] !bg-[#15151E] !text-[#D9D9D9]" />
            <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple">
              {{ $form.email.error.message }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label for="password" class="uppercase text-xs font-bold text-[#D9D9D9]">Contraseña</label>
            <Password inputId="password" name="password" autocomplete="current-password" placeholder="********"
              toggle-mask :feedback="false"
              inputClass="w-full !border-[#D9D9D9] !bg-[#15151E] !text-[#D9D9D9]" />
            <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">
              {{ $form.password.error.message }}
            </Message>
          </div>

          <Message v-if="firebaseError" severity="error" :closable="false" class="mt-2">
            {{ firebaseError }}
          </Message>

          <div class="flex flex-col gap-2 mt-4">
            <Button type="submit" label="ENTRAR AL PADDOCK" :loading="loading"
              class="w-full font-bold !border-none !bg-[#FF1E00] !text-[#D9D9D9]" />
            <Button type="button" label="¿Olvidaste tu contraseña?" text
              class="w-full font-bold !border-none !bg-transparent !text-[#00E5E5]"
              @click="router.push('/recuperar')" />
            <div class="text-center">
              <span class="text-sm text-[#D9D9D9]">¿No tienes equipo? </span>
              <router-link to="/registro" class="!text-sm font-bold text-[#00E5E5]">
                Regístrate aquí
              </router-link>
            </div>
          </div>

        </Form>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signIn } from '@/services/authService'

import MagicRings from '@/components/MagicRings.vue'

import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { Form } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'

import { useAuthStore } from '@/stores/storeAuth'

const router = useRouter()
const loading = ref(false)
const firebaseError = ref('')
const authStore = useAuthStore()

const initialValues = ref({
  email: '',
  password: ''
})

/**
 * Esquema de validación para el formulario de inicio de sesión.
 */
const resolver = zodResolver(
  z.object({
    email: z.string().min(1, 'Correo electrónico requerido').email('Correo electrónico inválido'),
    password: z.string().min(1, 'La contraseña es obligatoria')
  })
)

/**
 * Inicia sesión en la aplicación.
 * @param param0 Objeto que contiene la validez del formulario y los valores ingresados.
 */
const iniciarSesion = async ({ valid, values }) => {
  if (!valid) return

  loading.value = true
  firebaseError.value = ''

  try {
    await signIn(values.email, values.password)
    await authStore.iniciarDatosGlobales(values.email, values.displayName)
    router.push('/ligas')
  } catch (error) {
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      firebaseError.value = 'Correo o contraseña incorrectos.'
    } else {
      firebaseError.value = 'Error al iniciar sesión: ' + error.message
    }
  } finally {
    loading.value = false
  }
}
</script>