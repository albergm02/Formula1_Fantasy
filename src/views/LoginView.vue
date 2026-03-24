<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

/* Servicios de autenticación */
import { signIn, signInWithGoogle, resetPassword } from '@/services/authService'
import { useAuthStore } from '@/stores/storeAuth'

/* Componentes UI */
import MagicRings from '@/components/MagicRings.vue'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'

/* Validación con Zod */
import { Form } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

/* Estados */
const isLoading = ref(false)
const authError = ref('')
const initialValues = ref({ email: '', password: '' })
const showResetModal = ref(false)
const resetEmail = ref('')
const isResetLoading = ref(false)

const validationSchema = zodResolver(
  z.object({
    email: z.string().min(1, 'El correo es obligatorio').email('Formato de correo inválido'),
    password: z.string().min(1, 'La contraseña es obligatoria')
  })
)

/* Handler Login utilizando email / contraseña */
const handleLogin = async ({ valid, values }) => {
  if (!valid) return
  isLoading.value = true
  authError.value = ''

  try {
    const userCredential = await signIn(values.email, values.password)
    await authStore.initializeUserData(userCredential.user.email, userCredential.user.displayName)
    router.push('/ligas')
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

/* Handler login vía Google */
const handleGoogleLogin = async () => {
  authError.value = ''
  isLoading.value = true

  try {
    // Se espera hasta que el usuario complete la autenticación con Google (o la cancele) y se obtiene su información.
    const userCredential = await signInWithGoogle()
    // Cogemos los datos.
    const emailGoogle = userCredential.user.email
    const nombreGoogle = userCredential.user.displayName.trim() || emailGoogle.split('@')[0]
    // Guardamos y redirigimos a ligas.
    await authStore.initializeUserData(emailGoogle, nombreGoogle)
    router.push('/ligas')
  } catch (error) {
    // Ignoramos el error si el usuario cancela.
    if (error.code !== 'auth/popup-closed-by-user') {
      authError.value = 'Error al iniciar con Google: ' + error.message
    }
  } finally {
    isLoading.value = false
  }
}

/* Handler Recuperar Contraseña (Mejorado) */
const handlePasswordReset = async () => {
  // 1. Limpiamos espacios en blanco accidentales por si ha copiado y pegado
  const emailToSend = resetEmail.value.trim()

  // 2. Validación de formato de correo con Regex estándar
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailToSend || !emailRegex.test(emailToSend)) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Por favor, introduce un correo válido (ej: piloto@correo.com).', life: 4000 })
    return
  }

  isResetLoading.value = true
  try {
    await resetPassword(emailToSend)
    // Mostramos el mensaje genérico de éxito si todo va bien
    toast.add({ severity: 'success', summary: 'Revisa tu correo', detail: 'Si el correo está registrado, recibirás un enlace de recuperación.', life: 6000 })
    showResetModal.value = false
    resetEmail.value = ''
  } catch (error) {
    // Si Firebase nos dice que no existe, LO OCULTAMOS al usuario y mostramos el mismo éxito
    if (error.code === 'auth/user-not-found') {
      toast.add({ severity: 'success', summary: 'Revisa tu correo', detail: 'Si el correo está registrado, recibirás un enlace de recuperación.', life: 6000 })
      showResetModal.value = false
      resetEmail.value = ''
    } else {
      // Solo mostramos error si es un fallo real del servidor (ej. se cayó el internet)
      toast.add({ severity: 'error', summary: 'Error de conexión', detail: 'Hubo un problema de red. Inténtalo de nuevo más tarde.', life: 4000 })
    }
  } finally {
    isResetLoading.value = false
  }
}

/* Handler para limpiar el estado del modal de recuperación al cerrarlo */
const onResetModalHide = () => {
  resetEmail.value = ''
  isResetLoading.value = false
}

</script>

<!---------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!---------------------------------------------------------------------------------------------------------------------------->

<template>
  <!-- Contenedor principal -->
  <div class="relative flex items-center justify-center min-h-screen overflow-hidden p-4">

    <!-- Animación de fondo -->
    <MagicRings class="absolute inset-0 -z-10" color="#FF1E00" :ringCount="2" />

    <!-- Tarjeta de inicio de sesión -->
    <Card class="w-full max-w-md border rounded-xl shadow-2xl backdrop-blur-md border-zinc-800 !bg-black/40 p-2 md:p-4">

      <!-- Encabezado: Logo y título -->
      <template #title>
        <div class="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="Logo F1" class="w-16 h-16 object-contain" />
          <div class="text-center">
            <h1 class="text-3xl font-black uppercase tracking-widest text-[#FF1E00]">F1 Fantasy</h1>
          </div>
        </div>
      </template>

      <!-- Contenido: Formulario de inicio de sesión -->
      <template #content>
        <Form v-slot="$form" class="flex flex-col gap-4 mt-4" :initial-values="initialValues"
          :resolver="validationSchema" @submit="handleLogin">

          <!-- Campo de correo electrónico -->
          <div class="flex flex-col gap-1">
            <label for="email" class="ml-1 text-xs font-bold uppercase tracking-wider text-[#D9D9D9]">Email</label>
            <InputText id="email" type="email" name="email" autocomplete="email" placeholder="piloto@correo.com"
              class="w-full rounded-lg p-3 focus:ring-1 focus:ring-[#FF1E00] !border-[#D9D9D9] !bg-[#15151E] !text-[#D9D9D9]" />
            <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple" class="ml-1">
              {{ $form.email.error.message }}
            </Message>
          </div>

          <!-- Campo de contraseña -->
          <div class="flex flex-col gap-1">
            <label for="password"
              class="ml-1 text-xs font-bold uppercase tracking-wider text-[#D9D9D9]">Contraseña</label>
            <Password inputId="password" name="password" autocomplete="current-password" placeholder="********"
              toggle-mask :feedback="false" class="w-full [&>input]:w-full"
              inputClass="w-full rounded-lg p-3 focus:ring-1 focus:ring-[#FF1E00] !border-[#D9D9D9] !bg-[#15151E] !text-[#D9D9D9]" />
            <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple" class="ml-1">
              {{ $form.password.error.message }}
            </Message>
          </div>

          <!-- Mensaje de error -->
          <Message v-if="authError" severity="error" :closable="false" class="mt-2 text-sm">
            {{ authError }}
          </Message>

          <!-- Botones de acción -->
          <div class="flex flex-col gap-3 mt-4">

            <!-- Botón de inicio de sesión -->
            <Button type="submit" label="Iniciar sesión" :loading="isLoading"
              class="w-full rounded-lg py-3 font-black uppercase shadow-lg transition-colors !border-none !bg-[#FF1E00] !text-[#D9D9D9] hover:!bg-red-600" />

            <!-- Botón de inicio con Google -->
            <Button type="button" icon="pi pi-google" label="Entrar con Google"
              class="flex w-full items-center justify-center gap-2 rounded-lg py-3 font-bold uppercase shadow-lg transition-colors !border-none !bg-white text-black hover:!bg-gray-200"
              @click="handleGoogleLogin" />

            <!-- Botón de contraseña olvidada -->
            <Button type="button" label="¿Olvidaste tu contraseña?" text
              class="w-full mt-1 font-bold transition-colors !border-none !bg-transparent !text-[#00E5E5] hover:!text-cyan-400"
              @click="showResetModal = true" />

            <!-- Enlace de registro -->
            <div class="mt-2 border-t border-zinc-800 pt-5 pb-2 text-center">
              <span class="text-xs text-[#D9D9D9]">¿No tienes equipo? </span>
              <router-link to="/registro"
                class="ml-1 text-xs font-black uppercase tracking-widest transition-colors text-[#00E5E5] hover:text-white">
                Regístrate aquí
              </router-link>
            </div>
          </div>
        </Form>
      </template>
    </Card>

    <!-- Modal de recuperación de contraseña -->
    <Dialog v-model:visible="showResetModal" modal header="Recuperar Contraseña" @hide="onResetModalHide"
      :headerStyle="{ backgroundColor: '#15151E', color: 'white', borderBottom: '1px solid #27272a' }"
      :contentStyle="{ backgroundColor: '#15151E', padding: '1.5rem' }"
      :style="{ width: '90vw', maxWidth: '400px', border: '1px solid #27272a', borderRadius: '0.75rem' }">

      <div class="flex flex-col gap-4">
        <p class="text-sm text-[#D9D9D9]">Introduce tu correo y te enviaremos un enlace de recuperación.</p>

        <InputText v-model="resetEmail" type="email" placeholder="tu@correo.com"
          class="w-full rounded-lg p-3 text-white focus:ring-1 focus:!border-[#00E5E5] focus:ring-[#00E5E5] !border-zinc-700 !bg-[#111111]"
          @keyup.enter="handlePasswordReset" />

        <Button label="ENVIAR CORREO" icon="pi pi-envelope" :loading="isResetLoading"
          class="mt-2 w-full rounded-lg py-3 font-black tracking-widest !border-none !bg-[#00E5E5] !text-[#111111] hover:!bg-cyan-400"
          @click="handlePasswordReset" />
      </div>
    </Dialog>
  </div>
</template>