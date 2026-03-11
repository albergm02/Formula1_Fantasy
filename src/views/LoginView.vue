<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signIn } from '@/services/authService'

// PrimeVue & Validaciones
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { Form } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'

const router = useRouter()
const loading = ref(false)
const firebaseError = ref('')

const initialValues = ref({
  email: '',
  password: ''
})

// Clean Code: Validación de Zod
const resolver = zodResolver(
  z.object({
    email: z.string().min(1, 'Correo electrónico requerido').email('Correo electrónico inválido'),
    password: z.string().min(1, 'La contraseña es obligatoria')
  })
)

const iniciarSesion = async ({ valid, values }) => {
  if (!valid) return

  loading.value = true
  firebaseError.value = ''

  try {
    await signIn(values.email, values.password)
    // Redirigimos al inicio real (Dashboard)
    router.push('/inicio')
  } catch (error) {
    // Manejo de errores de Firebase en español para mejor UX
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

<template>
  <div class="min-h-screen flex items-center justify-center p-4 font-sans">
    <Card class="w-full max-w-md !bg-zinc-800 rounded !shadow-red-600/50">

      <template #title>
        <div class="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="Logo F1" class="h-16 w-16 object-contain" />
          <div class="text-center">
            <h1 class="text-3xl font-black italic text-red-600">INICIAR SESIÓN</h1>
          </div>
        </div>
      </template>

      <template #content>
        <Form v-slot="$form" class="flex flex-col gap-4 mt-4" :initial-values="initialValues" :resolver="resolver"
          @submit="iniciarSesion">

          <div class="flex flex-col gap-1">
            <label for="email" class="font-bold text-white text-sm">EMAIL</label>
            <InputText id="email" type="email" name="email" autocomplete="email" placeholder="piloto@escuderia.com"
              class="w-full !bg-zinc-700 !text-white !border-zinc-700 focus:!border-red-600 transition-colors" fluid />
            <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple">
              {{ $form.email.error.message }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label for="password" class="font-bold text-white text-sm">CONTRASEÑA</label>
            <Password inputId="password" name="password" autocomplete="current-password" placeholder="********"
              toggle-mask :feedback="false"
              class="w-full !bg-zinc-700 !text-white !border-zinc-700 focus:!border-red-600 transition-colors" fluid />
            <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">
              {{ $form.password.error.message }}
            </Message>
          </div>

          <Message v-if="firebaseError" severity="error" :closable="false" class="mt-2">
            {{ firebaseError }}
          </Message>

          <div class="flex flex-col gap-3 mt-4">
            <Button type="submit" label="ENTRAR AL PADDOCK" :loading="loading"
              class="w-full !bg-red-600 !border-red-600 font-bold !text-white hover:!bg-red-700 hover:!border-red-700 transition-colors shadow-lg" />

            <div class="text-center mt-2">
              <span class="text-zinc-400 text-sm">¿No tienes equipo? </span>
              <router-link to="/registro" class="text-red-500 hover:text-red-400 font-bold transition-colors">
                Regístrate aquí
              </router-link>
            </div>
          </div>

        </Form>
      </template>
    </Card>
  </div>
</template>