<script setup>
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Password from 'primevue/password'

import { Form } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'
import { ref } from 'vue'

import { useRouter } from 'vue-router'
import { signIn } from '@/services/authService'

const router = useRouter()
const loading = ref(false)
const firebaseError = ref('')

const initialValues = ref({
  email: '',
  password: '',
})

/**
 * Definimos el esquema de validación con Zod. Esto nos permite tener validaciones claras y mensajes personalizados.
 * El resolver de PrimeVue Forms se encargará de integrar esta validación en el formulario.
 */
const resolver = zodResolver(
  z.object({
    email: z.string().min(1, 'Correo electrónico requerido').email('Correo electrónico inválido'),
    password: z.string().min(1, 'Contraseña requerida'),
  }),
)

/**
 * Función para manejar el envío del formulario. Primero verifica que los datos sean válidos según el esquema de Zod.
 * Si son válidos, intenta iniciar sesión con Firebase. Si hay un error (como credenciales incorrectas), muestra un mensaje amigable.
 * El estado de "loading" se utiliza para mostrar un spinner en el botón mientras se procesa la solicitud, mejorando la experiencia del usuario.
 */
const iniciarSesion = async ({ valid, values }) => {
  if (!valid) return

  loading.value = true
  firebaseError.value = ''

  try {
    await signIn(values.email, values.password)
    router.push('/inicio')
  } catch (error) {
    firebaseError.value = 'Error al iniciar sesión. Revisa tus credenciales.'
    console.error("Error original:", error.message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 font-sans">
    <!-- Card de inicio de sesión -->
    <Card class="w-full max-w-md !bg-zinc-800 rounded !shadow-red-600/50">
      <template #title>
        <!-- Logo e información del título -->
        <div class="flex flex-col items-center gap-4">
          <img src="/logo_final.png" alt="F1 Fantasy Logo" class="w-32 h-32" />
          <div class="text-center">
            <h1 class="text-3xl font-black italic text-red-600">F1 FANTASY</h1>
          </div>
        </div>
      </template>

      <template #content>

        <!-- Formulario de inicio de sesión -->
        <Form v-slot="$form" class="flex flex-col gap-4 mt-4" :initial-values="initialValues" :resolver="resolver"
          @submit="iniciarSesion">

          <!-- Campo de correo electrónico -->
          <div class="flex flex-col gap-1">
            <label for="email" class="font-bold text-white text-sm">EMAIL</label>
            <InputText id="email" type="email" name="email" autocomplete="email" placeholder="piloto@escuderia.com"
              class="w-full !bg-zinc-700 !text-white !border-zinc-700 focus:!border-red-600" fluid />
            <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple">
              {{ $form.email.error.message }}
            </Message>
          </div>

          <!-- Campo de contraseña -->
          <div class="flex flex-col gap-1">
            <label for="password" class="font-bold text-white text-sm">CONTRASEÑA</label>
            <Password inputId="password" name="password" autocomplete="current-password" placeholder="********"
              toggle-mask :feedback="false"
              class="w-full !bg-zinc-700 !text-white !border-zinc-700 focus:!border-red-600" fluid />
            <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">
              {{ $form.password.error.message }}
            </Message>

            <!-- Enlace para recuperar contraseña -->
            <div class="flex justify-end mt-2">
              <a href="#" class="text-xs font-bold text-zinc-400 hover:text-red-500 transition-colors">¿Olvidaste tu
                contraseña?</a>
            </div>
          </div>

          <!-- Mensaje de error general (como credenciales incorrectas) -->
          <Message v-if="firebaseError" severity="error" :closable="false" class="mt-2">
            {{ firebaseError }}
          </Message>

          <!-- Botón de iniciar sesión -->
          <div class="flex flex-col gap-2 mt-2">
            <Button type="submit" label="INICIAR SESIÓN" :loading="loading"
              class="w-full !bg-red-600 !border-red-600 font-bold !text-white hover:!bg-red-700 hover:!border-red-700 transition-colors" />
          </div>

          <!-- Botón para crear una nueva cuenta -->
          <div class="flex flex-col gap-2">
            <Button type="button" label="CREAR CUENTA" @click="router.push('/registro')"
              class="w-full !bg-zinc-700 !border-zinc-700 font-bold !text-white hover:!bg-zinc-600 hover:!border-zinc-600 transition-colors" />
          </div>

        </Form>
      </template>
    </Card>
  </div>
</template>