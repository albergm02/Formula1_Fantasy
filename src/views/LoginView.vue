<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

/* Servicios de autenticación */
import { signIn, signInWithGoogle, resetPassword } from '@/services/authService'
import { useAuthStore } from '@/stores/storeAuth'

/* Componentes UI y customizados */
import MagicRings from '@/components/MagicRings.vue'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'

/* Validación de formularios con Zod */
import { Form } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

/* Estado del formulario de login */
const isLoading = ref(false)
const authError = ref('')
const initialValues = ref({
  email: '',
  password: ''
})

/* Estado del modal de recuperación de contraseña */
const showResetModal = ref(false)
const resetEmail = ref('')
const isResetLoading = ref(false)

/* Esquema de validación con Zod */
const validationSchema = zodResolver(
  z.object({
    email: z.string().min(1, 'El correo es obligatorio').email('Formato de correo inválido'),
    password: z.string().min(1, 'La contraseña es obligatoria')
  })
)

/* Handler para el login con email y contraseña */
const handleLogin = async ({ valid, values }) => {
  if (!valid) return

  // Flag de carga y reset de errores
  isLoading.value = true
  authError.value = ''

  try {
    // Intentamos iniciar sesión con email y contraseña
    const userCredential = await signIn(values.email, values.password)
    // Todo: renombrar iniciarDatosGlobales a initializeUserData o algo más genérico
    await authStore.iniciarDatosGlobales(userCredential.user.email, userCredential.user.displayName)
    router.push('/ligas')
    // Manejo de errores. Firebase devuelve códigos de error específicos que podemos usar para mostrar mensajes más amigables al usuario.
  } catch (error) {
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      authError.value = 'Correo o contraseña incorrectos.'
    } else if (error.code === 'auth/too-many-requests') {
      authError.value = 'Demasiados intentos. Inténtalo más tarde.'
    } else {
      authError.value = 'Error al iniciar sesión: ' + error.message
    }
  } finally {
    isLoading.value = false
  }
}

/* Handler para el login con Google */
const handleGoogleLogin = async () => {
  // Reset de errores antes de intentar el login con Google
  authError.value = ''
  try {
    // Intentamos iniciar sesión con Google.
    const userCredential = await signInWithGoogle()
    await authStore.iniciarDatosGlobales(userCredential.user.email, userCredential.user.displayName)
    router.push('/ligas')
  } catch (error) {
    // Si el usuario cierra el popup de Google, simplemente ignoramos.
    if (error.code !== 'auth/popup-closed-by-user') {
      authError.value = 'Error al iniciar con Google: ' + error.message
    }
  }
}

/* Handler para la recuperación de contraseña */
const handlePasswordReset = async () => {
  // Validación básica del correo antes de intentar enviar el email de recuperación
  if (!resetEmail.value || !resetEmail.value.includes('@')) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Introduce un correo válido.', life: 3000 })
    return
  }

  // Flag de carga mientras se envía el correo de recuperación
  isResetLoading.value = true
  try {
    // Intento de restablecimiento de contraseña. Si no esta registrado, Firebase lanzará un error.
    await resetPassword(resetEmail.value)
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Correo de recuperación enviado.', life: 5000 })
    // Si el correo se envió correctamente, cerramos el modal y reseteamos el campo de email.
    showResetModal.value = false
    resetEmail.value = ''
    // Manejo de errores.
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No hay ninguna cuenta con este correo.', life: 3000 })
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar el correo.', life: 3000 })
    }
  } finally {
    isResetLoading.value = false
  }
}
</script>

<!---------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!---------------------------------------------------------------------------------------------------------------------------->

<template>
  <div class="relative flex items-center justify-center min-h-screen p-4 overflow-hidden">

    <MagicRings class="absolute inset-0 -z-10" color="#FF1E00" :ringCount="2" />

    <Card class="w-full max-w-md p-2 border shadow-2xl md:p-4 rounded-xl backdrop-blur-md border-zinc-800 !bg-black/40">

      <template #title>
        <div class="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="Logo F1" class="w-16 h-16 object-contain" />
          <div class="text-center">
            <h1 class="text-3xl font-black uppercase tracking-widest text-[#FF1E00]">F1 Fantasy</h1>
          </div>
        </div>
      </template>

      <template #content>
        <Form v-slot="$form" class="flex flex-col gap-4 mt-4" :initial-values="initialValues"
          :resolver="validationSchema" @submit="handleLogin">

          <div class="flex flex-col gap-1">
            <label for="email" class="ml-1 text-xs font-bold uppercase tracking-wider text-[#D9D9D9]">Email</label>
            <InputText id="email" type="email" name="email" autocomplete="email" placeholder="piloto@correo.com"
              class="w-full p-3 rounded-lg focus:ring-1 focus:ring-[#FF1E00] !bg-[#15151E] !border-[#D9D9D9] !text-[#D9D9D9]" />
            <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple" class="ml-1">
              {{ $form.email.error.message }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label for="password"
              class="ml-1 text-xs font-bold uppercase tracking-wider text-[#D9D9D9]">Contraseña</label>
            <Password inputId="password" name="password" autocomplete="current-password" placeholder="********"
              toggle-mask :feedback="false" class="w-full [&>input]:w-full"
              inputClass="w-full p-3 rounded-lg focus:ring-1 focus:ring-[#FF1E00] !bg-[#15151E] !border-[#D9D9D9] !text-[#D9D9D9]" />
            <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple" class="ml-1">
              {{ $form.password.error.message }}
            </Message>
          </div>

          <Message v-if="authError" severity="error" :closable="false" class="mt-2 text-sm">
            {{ authError }}
          </Message>

          <div class="flex flex-col gap-3 mt-4">

            <Button type="submit" label="ENTRAR AL PADDOCK" :loading="isLoading"
              class="w-full py-3 font-black tracking-widest transition-colors rounded-lg shadow-lg hover:!bg-red-600 !bg-[#FF1E00] !text-[#D9D9D9] !border-none" />

            <Button type="button" icon="pi pi-google" label="Entrar con Google"
              class="flex items-center justify-center w-full gap-2 py-3 font-bold text-black transition-colors bg-white rounded-lg shadow-lg hover:!bg-gray-200 !border-none"
              @click="handleGoogleLogin" />

            <Button type="button" label="¿Olvidaste tu contraseña?" text
              class="w-full mt-1 font-bold transition-colors hover:!text-cyan-400 !text-[#00E5E5] !bg-transparent !border-none"
              @click="showResetModal = true" />

            <div class="pt-5 pb-2 mt-2 text-center border-t border-zinc-800">
              <span class="text-xs text-[#D9D9D9]">¿No tienes equipo? </span>
              <router-link to="/registro"
                class="ml-1 text-xs font-black uppercase tracking-widest transition-colors hover:text-white text-[#00E5E5]">
                Regístrate aquí
              </router-link>
            </div>
          </div>
        </Form>
      </template>
    </Card>

    <Dialog v-model:visible="showResetModal" modal header="Recuperar Contraseña"
      :headerStyle="{ backgroundColor: '#15151E', color: 'white', borderBottom: '1px solid #27272a' }"
      :contentStyle="{ backgroundColor: '#15151E', padding: '1.5rem' }"
      :style="{ width: '90vw', maxWidth: '400px', border: '1px solid #27272a', borderRadius: '0.75rem' }">

      <div class="flex flex-col gap-4">
        <p class="text-sm text-[#D9D9D9]">Introduce tu correo y te enviaremos un enlace de recuperación.</p>

        <InputText v-model="resetEmail" type="email" placeholder="tu@correo.com"
          class="w-full p-3 text-white rounded-lg focus:ring-1 focus:!border-[#00E5E5] focus:ring-[#00E5E5] !bg-[#111111] !border-zinc-700"
          @keyup.enter="handlePasswordReset" />

        <Button label="ENVIAR CORREO" icon="pi pi-envelope" :loading="isResetLoading" @click="handlePasswordReset"
          class="w-full py-3 mt-2 font-black tracking-widest rounded-lg hover:!bg-cyan-400 !bg-[#00E5E5] !text-[#111111] !border-none" />
      </div>
    </Dialog>

  </div>
</template>