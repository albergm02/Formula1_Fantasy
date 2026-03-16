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
import { signUp } from '@/services/authService'

const router = useRouter()
const loading = ref(false)
const firebaseError = ref('')

const initialValues = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

/**
 * Definimos el esquema de validación con Zod. Esto nos permite tener validaciones claras y mensajes personalizados.
 * El resolver de PrimeVue Forms se encargará de integrar esta validación en el formulario.
 */
const resolver = zodResolver(
  z
    .object({
      name: z
        .string()
        .min(1, 'Nombre requerido')
        .min(3, 'El nombre debe tener al menos 3 caracteres'),
      email: z.string().min(1, 'Correo electrónico requerido').email('Correo electrónico inválido'),
      password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
      confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Las contraseñas no coinciden',
      path: ['confirmPassword'],
    }),
)

/****
 * Función para manejar el envío del formulario. Primero verifica que los datos sean válidos según el esquema de Zod.
 * Si son válidos, intenta registrar al usuario con Firebase. Si hay un error (como correo ya registrado), muestra un mensaje amigable.
 * El estado de "loading" se utiliza para mostrar un spinner en el botón mientras se procesa la solicitud, mejorando la experiencia del usuario.
 */
const crearCuenta = async ({ valid, values }) => {
  if (!valid) return

  loading.value = true
  firebaseError.value = ''

  try {
    await signUp(values.email, values.password)
    router.push('/ligas')
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      firebaseError.value = 'El correo electrónico ya está registrado.'
    } else {
      firebaseError.value = 'Error al registrar: ' + error.message
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 font-sans">
    <Card class="w-full max-w-md !bg-zinc-800 rounded !shadow-red-600/50">
      <template #title>
        <div class="flex flex-col items-center gap-4">
          <div class="text-center">
            <h1 class="text-3xl font-black italic text-red-600">REGÍSTRATE</h1>
          </div>
        </div>
      </template>
      <template #content>
        <Form v-slot="$form" class="flex flex-col gap-4 mt-4" :initial-values="initialValues" :resolver="resolver"
          @submit="crearCuenta">

          <div class="flex flex-col gap-1">
            <label for="name" class="font-bold text-white text-sm">NOMBRE</label>
            <InputText id="name" type="text" name="name" placeholder="Tu nombre completo"
              class="w-full !bg-zinc-700 !text-white !border-zinc-700 focus:!border-red-600" fluid />
            <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">
              {{ $form.name.error.message }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label for="email" class="font-bold text-white text-sm">EMAIL</label>
            <InputText id="email" type="email" name="email" autocomplete="email" placeholder="piloto@escuderia.com"
              class="w-full !bg-zinc-700 !text-white !border-zinc-700 focus:!border-red-600" fluid />
            <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple">
              {{ $form.email.error.message }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label for="password" class="font-bold text-white text-sm">CONTRASEÑA</label>
            <Password inputId="password" name="password" autocomplete="new-password" placeholder="********" toggle-mask
              :feedback="false" inputClass="w-full !bg-zinc-700 !text-white !border-zinc-700 focus:!border-red-600" fluid />
            <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">
              {{ $form.password.error.message }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label for="confirmPassword" class="font-bold text-white text-sm">CONFIRMAR CONTRASEÑA</label>
            <Password inputId="confirmPassword" name="confirmPassword" autocomplete="new-password"
              placeholder="********" toggle-mask :feedback="false"
              inputClass="w-full !bg-zinc-700 !text-white !border-zinc-700 focus:!border-red-600" fluid />
            <Message v-if="$form.confirmPassword?.invalid" severity="error" size="small" variant="simple">
              {{ $form.confirmPassword.error.message }}
            </Message>
          </div>

          <Message v-if="firebaseError" severity="error" :closable="false" class="mt-2">
            {{ firebaseError }}
          </Message>

          <div class="flex flex-col gap-2 mt-2">
            <Button type="submit" label="CREAR CUENTA" :loading="loading"
              class="w-full !bg-red-600 !border-red-600 font-bold !text-white hover:!bg-red-700 hover:!border-red-700 transition-colors" />
          </div>

          <div class="flex flex-col gap-2">
            <Button type="button" label="VOLVER" @click="router.push('/')"
              class="w-full !bg-zinc-700 !border-zinc-700 font-bold !text-white hover:!bg-zinc-600 hover:!border-zinc-600 transition-colors" />
          </div>

        </Form>
      </template>
    </Card>
  </div>
</template>