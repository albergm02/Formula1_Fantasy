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

/* Utilidades */
import { getGoogleErrorMessage, getLoginErrorMessage, isGooglePopupClosed } from '@/utils/authErrors'

/* Validación con Zod */
import { Form } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'
/* Esquema de validación con Zod */
const validationSchema = zodResolver(
  z.object({
    email: z.string().min(1, 'El correo es obligatorio').email('Formato de correo inválido'),
    password: z.string().min(1, 'La contraseña es obligatoria')
  })
)

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

/* Estados */
const isLoading = ref(false)
const authError = ref('')
const initialFormValues = ref({ email: '', password: '' })
const isResetModalVisible = ref(false)
const resetEmailAddress = ref('')
const isResetLoading = ref(false)

/* Mensajes */
const genericResetMessage = 'Si el correo está registrado, recibirás un enlace de recuperación.'

/* Handler Login utilizando email / contraseña */
const handleLogin = async ({ valid, values }) => {
  // Zod se encarga de mostrar errores.
  if (!valid) return
  isLoading.value = true
  authError.value = ''

  try {
    // Intentamos iniciar sesión con email y contraseña
    const userCredential = await signIn(values.email, values.password)
    // Si el inicio de sesión es exitoso, inicializamos los datos del usuario en el store
    await authStore.initializeUserData(userCredential.user.email, userCredential.user.displayName)
    router.push('/ligas')
  } catch (error) {
    authError.value = getLoginErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

/* Handler login vía Google */
const handleGoogleLogin = async () => {
  authError.value = ''
  isLoading.value = true

  try {
    const userCredential = await signInWithGoogle()
    const googleEmail = userCredential.user.email.trim()

    // Si no obtenemos un correo válido de Google, mostramos un error
    if (!googleEmail) {
      throw new Error('No se pudo obtener el correo de Google.')
    }

    // Intentamos inicializar los datos del usuario.
    const profileExists = await authStore.initializeUserData(googleEmail, userCredential.user.displayName, {
      createIfMissing: false,
    })

    // Si el perfil existe, vamos a ligas. Si no, vamos a completar registro.
    if (profileExists) {
      router.push('/ligas')
      return
    }

    // Si no existe perfil, redirigimos a completar registro con Google
    router.push('/registro-google')
  } catch (error) {
    // Si el error se debe a que el usuario cerró la ventana emergente de Google, no mostramos un mensaje de error.
    if (!isGooglePopupClosed(error)) {
      authError.value = getGoogleErrorMessage(error)
    }
  } finally {
    isLoading.value = false
  }
}

/* Handler Recuperar Contraseña (Mejorado) */
const handlePasswordReset = async () => {
  const emailToSend = resetEmailAddress.value.trim()

  // Validamos el formato del correo antes de intentar enviar el email de recuperación
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToSend)) {
    toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Por favor, introduce un correo válido (ej: piloto@correo.com).', life: 4000 })
    return
  }
  // Intentamos enviar el correo de recuperación. 
  // Para evitar revelar si un correo está registrado o no, mostramos el mismo mensaje de éxito tanto para correos válidos como para no registrados.
  isResetLoading.value = true
  try {
    await resetPassword(emailToSend)
    toast.add({ severity: 'success', summary: 'Revisa tu correo', detail: genericResetMessage, life: 6000 })
    isResetModalVisible.value = false
    resetEmailAddress.value = ''
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      toast.add({ severity: 'success', summary: 'Revisa tu correo', detail: genericResetMessage, life: 6000 })
      isResetModalVisible.value = false
      resetEmailAddress.value = ''
    } else {
      toast.add({ severity: 'error', summary: 'Error de conexión', detail: 'Hubo un problema de red. Inténtalo de nuevo más tarde.', life: 4000 })
    }
  } finally {
    isResetLoading.value = false
  }
}

/* Handler para limpiar el estado del modal de recuperación al cerrarlo */
const onResetModalHide = () => {
  resetEmailAddress.value = ''
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
    <MagicRings class="absolute inset-0 -z-10" color="#E10600" :ringCount="2" />

    <!-- Tarjeta de inicio de sesión -->
    <Card class="w-full max-w-md border rounded-xl shadow-2xl backdrop-blur-md border-zinc-800 !bg-black/40 p-2 lg:p-4">

      <!-- Encabezado: Logo y título -->
      <template #title>
        <div class="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="Logo F1" class="w-16 h-16 object-contain" />
          <div class="text-center">
            <h1 class="text-3xl font-black uppercase tracking-widest text-[#E10600]">F1 Fantasy</h1>
          </div>
        </div>
      </template>

      <!-- Contenido: Formulario de inicio de sesión -->
      <template #content>
        <Form v-slot="$form" class="flex flex-col gap-4 mt-4" :initial-values="initialFormValues"
          :resolver="validationSchema" @submit="handleLogin">

          <!-- Campo de correo electrónico -->
          <div class="flex flex-col gap-1">
            <label for="email" class="ml-1 text-xs font-bold uppercase tracking-wider text-[#F0ECEC]">Email</label>
            <InputText id="email" type="email" name="email" autocomplete="email" placeholder="piloto@correo.com"
              class="w-full rounded-lg p-3 focus:ring-1 focus:ring-[#E10600] !border-[#F0ECEC] !bg-[#1A1A1F] !text-[#F0ECEC]" />
            <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple" class="ml-1">
              {{ $form.email.error.message }}
            </Message>
          </div>

          <!-- Campo de contraseña -->
          <div class="flex flex-col gap-1">
            <label for="password"
              class="ml-1 text-xs font-bold uppercase tracking-wider text-[#F0ECEC]">Contraseña</label>
            <Password inputId="password" name="password" autocomplete="current-password" placeholder="********"
              toggle-mask :feedback="false" class="w-full [&>input]:w-full"
              inputClass="w-full rounded-lg p-3 focus:ring-1 focus:ring-[#E10600] !border-[#F0ECEC] !bg-[#1A1A1F] !text-[#F0ECEC]" />
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
              class="w-full rounded-lg py-3 font-black uppercase shadow-lg transition-colors !border-none !bg-[#E10600] !text-[#F0ECEC] hover:!bg-[#C00500]" />

            <!-- Botón de inicio con Google -->
            <Button type="button" icon="pi pi-google" label="Entrar con Google"
              class="flex w-full items-center justify-center gap-2 rounded-lg py-3 font-bold uppercase shadow-lg transition-colors !border-none !bg-white !text-black hover:!bg-gray-300"
              @click="handleGoogleLogin" />

            <!-- Botón de contraseña olvidada -->
            <Button type="button" label="¿Olvidaste tu contraseña?" text
              class="w-full mt-1 font-bold transition-colors !border-none !bg-transparent !text-[#D4A843] hover:!text-[#C09638]"
              @click="isResetModalVisible = true" />

            <!-- Enlace de registro -->
            <div class="mt-2 border-t border-zinc-800 pt-5 pb-2 text-center">
              <span class="text-xs text-[#F0ECEC]">¿No tienes equipo? </span>
              <router-link to="/registro"
                class="ml-1 text-xs font-black uppercase tracking-widest transition-colors text-[#D4A843] hover:text-white">
                Regístrate aquí
              </router-link>
            </div>
          </div>
        </Form>
      </template>
    </Card>

    <!-- Modal de recuperación de contraseña -->
    <Dialog v-model:visible="isResetModalVisible" modal header="Recuperar Contraseña" @hide="onResetModalHide"
      :headerStyle="{ backgroundColor: '#1A1A1F', color: 'white', borderBottom: '1px solid #2A2A32' }"
      :contentStyle="{ backgroundColor: '#1A1A1F', padding: '1.5rem' }"
      :style="{ width: '90vw', maxWidth: '400px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }">

      <div class="flex flex-col gap-4">
        <p class="text-sm text-[#F0ECEC]">Introduce tu correo y te enviaremos un enlace de recuperación.</p>

        <InputText v-model="resetEmailAddress" type="email" placeholder="tu@correo.com"
          class="w-full rounded-lg p-3 text-white focus:ring-1 focus:!border-[#D4A843] focus:ring-[#D4A843] !border-zinc-700 !bg-[#121218]"
          @keyup.enter="handlePasswordReset" />

        <Button label="ENVIAR CORREO" icon="pi pi-envelope" :loading="isResetLoading"
          class="mt-2 w-full rounded-lg py-3 font-black tracking-widest !border-none !bg-[#D4A843] !text-[#121218] hover:!bg-[#C09638]"
          @click="handlePasswordReset" />
      </div>
    </Dialog>
  </div>
</template>