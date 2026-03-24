<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

/* Servicios de autenticación */
import { signUp } from '@/services/authService'
import { useAuthStore } from '@/stores/storeAuth'

/* Componentes UI */
import MagicRings from '@/components/MagicRings.vue'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'

/* Validación con Zod */
import { Form } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'
import { usernameSchema } from '@/utils/authValidations'
import { normalizeTextFields } from '@/utils/text'
import { getRegisterErrorMessage } from '@/utils/authErrors'

const router = useRouter()
const authStore = useAuthStore()

/* Estados del formulario de registro */
const isLoading = ref(false)
const authError = ref('')
const initialFormValues = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

/* Esquema de validación con Zod */
const validationSchema = zodResolver(
  z.object({
    username: usernameSchema,
    email: z.string().min(1, 'El correo es obligatorio').email('Formato de correo inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
)

/* Handler Registro utilizando email / contraseña */
const handleRegister = async ({ valid, values }) => {
  if (!valid) return
  const normalizedValues = normalizeTextFields(values, ['email', 'username'])
  const trimmedEmail = normalizedValues.email
  const trimmedUsername = normalizedValues.username

  isLoading.value = true
  authError.value = ''
  try {
    const userCredential = await signUp(trimmedEmail, values.password)
    await authStore.initializeUserData(userCredential.user.email, trimmedUsername)
    router.push('/ligas')
  } catch (error) {
    authError.value = getRegisterErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}
</script>

<!---------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!---------------------------------------------------------------------------------------------------------------------------->

<template>
  <div class="relative flex items-center justify-center min-h-screen p-4 overflow-hidden">

    <!-- Animación de fondo -->
    <MagicRings class="absolute inset-0 -z-10" color="#FF1E00" :ringCount="2" />

    <!-- Tarjeta principal de registro -->
    <Card class="w-full max-w-md p-2 border shadow-2xl md:p-4 rounded-xl backdrop-blur-md border-zinc-800 !bg-black/40">

      <!-- Encabezado con logo y título -->
      <template #title>
        <div class="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="Logo F1" class="w-16 h-16 object-contain" />
          <div class="text-center">
            <h1 class="text-2xl font-black uppercase tracking-widest text-[#FF1E00]">Regístrate</h1>
          </div>
        </div>
      </template>

      <!-- Contenido del formulario -->
      <template #content>
        <Form v-slot="$form" class="flex flex-col gap-4 mt-4" :initial-values="initialFormValues"
          :resolver="validationSchema" @submit="handleRegister">

          <!-- Campo: Nombre de Piloto -->
          <div class="flex flex-col gap-1">
            <label for="username" class="ml-1 text-xs font-bold uppercase tracking-wider text-[#D9D9D9]">Nombre de
              Piloto</label>
            <InputText id="username" type="text" name="username" placeholder="MagicAlonso33"
              class="w-full p-3 rounded-lg focus:ring-1 focus:ring-[#FF1E00] !border-[#D9D9D9] !bg-[#15151E] !text-[#D9D9D9]" />
            <Message v-if="$form.username?.invalid" severity="error" size="small" variant="simple" class="ml-1">
              {{ $form.username.error.message }}
            </Message>
          </div>

          <!-- Campo: Email -->
          <div class="flex flex-col gap-1">
            <label for="email" class="ml-1 text-xs font-bold uppercase tracking-wider text-[#D9D9D9]">Email</label>
            <InputText id="email" type="email" name="email" autocomplete="email" placeholder="piloto@escuderia.com"
              class="w-full p-3 rounded-lg focus:ring-1 focus:ring-[#FF1E00] !border-[#D9D9D9] !bg-[#15151E] !text-[#D9D9D9]" />
            <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple" class="ml-1">
              {{ $form.email.error.message }}
            </Message>
          </div>

          <!-- Campo: Contraseña -->
          <div class="flex flex-col gap-1">
            <label for="password"
              class="ml-1 text-xs font-bold uppercase tracking-wider text-[#D9D9D9]">Contraseña</label>
            <Password inputId="password" name="password" autocomplete="new-password" placeholder="********" toggle-mask
              :feedback="false" class="w-full [&>input]:w-full"
              inputClass="w-full p-3 rounded-lg focus:ring-1 focus:ring-[#FF1E00] !border-[#D9D9D9] !bg-[#15151E] !text-[#D9D9D9]" />
            <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple" class="ml-1">
              {{ $form.password.error.message }}
            </Message>
          </div>

          <!-- Campo: Confirmar Contraseña -->
          <div class="flex flex-col gap-1">
            <label for="confirmPassword"
              class="ml-1 text-xs font-bold uppercase tracking-wider text-[#D9D9D9]">Confirmar Contraseña</label>
            <Password inputId="confirmPassword" name="confirmPassword" autocomplete="new-password"
              placeholder="********" toggle-mask :feedback="false" class="w-full [&>input]:w-full"
              inputClass="w-full p-3 rounded-lg focus:ring-1 focus:ring-[#FF1E00] !border-[#D9D9D9] !bg-[#15151E] !text-[#D9D9D9]" />
            <Message v-if="$form.confirmPassword?.invalid" severity="error" size="small" variant="simple" class="ml-1">
              {{ $form.confirmPassword.error.message }}
            </Message>
          </div>

          <!-- Mensaje de error de autenticación -->
          <Message v-if="authError" severity="error" :closable="false" class="mt-2 text-sm">
            {{ authError }}
          </Message>

          <!-- Botones de acción -->
          <div class="flex flex-col gap-3 mt-4">

            <Button type="submit" label="CREAR EQUIPO" :loading="isLoading"
              class="w-full py-3 font-black uppercase transition-colors shadow-lg rounded-lg !border-none !bg-[#FF1E00] !text-[#D9D9D9] hover:!bg-red-600" />

            <!-- Enlace a login -->
            <div class="pt-5 pb-2 mt-2 text-center border-t border-zinc-800">
              <span class="text-xs text-[#D9D9D9]">¿Ya tienes equipo? </span>
              <router-link to="/"
                class="ml-1 text-xs font-black uppercase tracking-widest transition-colors text-[#00E5E5] hover:text-white">
                Inicia sesión aquí
              </router-link>
            </div>

          </div>
        </Form>
      </template>
    </Card>
  </div>
</template>