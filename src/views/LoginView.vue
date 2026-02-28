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

const resolver = zodResolver(
  z.object({
    email: z.string().min(1, 'Correo electrónico requerido').email('Correo electrónico inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  }),
)

const iniciarSesion = async ({ valid, values }) => {
  if (!valid) return
  loading.value = true
  firebaseError.value = ''

  try {
    await signIn(values.email, values.password)
    router.push('/dashboard')
  } catch (error) {
    firebaseError.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans">
    <Card class="w-full max-w-md !bg-zinc-800 rounded !shadow-red-600/50">
      <template #title>
        <div class="flex flex-col items-center gap-4">
          <img src="../assets/logo_final.png" alt="F1 Fantasy Logo" class="w-32 h-32" />
          <div class="text-center">
            <h1 class="text-3xl font-black italic text-red-600">F1 FANTASY</h1>
          </div>
        </div>
      </template>
      <template #content>
        <Form
          v-slot="$form"
          class="flex flex-col gap-4 mt-4"
          :initial-values="initialValues"
          :resolver="resolver"
          @submit="iniciarSesion"
        >
          <div class="flex flex-col gap-1">
            <label for="email" class="font-bold text-white">EMAIL</label>
            <InputText
              id="email"
              type="email"
              name="email"
              placeholder="piloto@escuderia.com"
              class="w-full !bg-zinc-700 !text-white !border-zinc-700"
              fluid
            />
            <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple">
              {{ $form.email.error.message }}
            </Message>
          </div>
          <div class="flex flex-col gap-1">
            <label for="password" class="font-bold text-white">CONTRASEÑA</label>
            <Password
              id="password"
              name="password"
              placeholder="********"
              toggle-mask
              :feedback="false"
              class="w-full !bg-zinc-700 !text-white !border-zinc-700"
              fluid
            />
            <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">
              {{ $form.password.error.message }}
            </Message>
            <div class="flex justify-end mt-2">
              <a href="#" class="font-bold text-zinc-400 hover:text-zinc-200 transition-colors"
                >¿Olvidaste tu contraseña?</a
              >
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <Button
              type="submit"
              label="INICIAR SESIÓN"
              class="w-full !bg-red-600 !border-red-600 font-bold !text-white hover:!bg-red-700 hover:!border-red-700 transition-colors"
            />
          </div>

          <div class="flex flex-col gap-2">
            <Button
              type="button"
              label="CREAR CUENTA"
              @click="$router.push('/register')"
              class="w-full !bg-zinc-700 !border-zinc-700 font-bold !text-white hover:!bg-zinc-600 hover:!border-zinc-600 transition-colors"
            />
          </div>
        </Form>
      </template>
    </Card>
  </div>
</template>
