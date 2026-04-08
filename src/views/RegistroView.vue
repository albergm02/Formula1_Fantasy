<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { registrarse, enviarVerificacionCorreo } from '@/services/servicioAutenticacion'
import { usarStoreAutenticacion } from '@/stores/storeAutenticacion'

import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'

import { Form } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'

const esquemaValidacion = zodResolver(
  z.object({
    username: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres').max(10, 'El nombre no debe exceder los 10 caracteres'),
    email: z.string().min(1, 'El correo es obligatorio').email('Formato de correo inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
)

const enrutador = useRouter()
const storeAutenticacion = usarStoreAutenticacion()

const cargando = ref(false)
const errorAutenticacion = ref('')
const valoresInicialesFormulario = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

/**
 * Maneja el envío del formulario de registro con email y contraseña.
 * Crea la cuenta en Firebase Auth y luego genera el perfil en Firestore.
 * @param {{ valid: boolean, values: { username: string, email: string, password: string } }} formulario
 */
const manejarRegistro = async ({ valid, values }) => {
  if (!valid) return
  const correoNormalizado = values.email.trim()
  const nombreNormalizado = values.username.trim()

  cargando.value = true
  errorAutenticacion.value = ''
  try {
    const credencialUsuario = await registrarse(correoNormalizado, values.password)
    await enviarVerificacionCorreo()
    await storeAutenticacion.cargarOCrearPerfil(credencialUsuario.user.email, nombreNormalizado)
    enrutador.push('/verificar-correo')
  } catch (error) {
    if (error?.code === 'auth/email-already-in-use') {
      errorAutenticacion.value = 'El correo electrónico ya está registrado.'
    } else if (error?.code === 'auth/invalid-email') {
      errorAutenticacion.value = 'El correo electrónico no es válido.'
    } else if (error?.code === 'auth/weak-password') {
      errorAutenticacion.value = 'La contraseña es demasiado débil.'
    } else {
      errorAutenticacion.value = `Error al registrar: ${error?.message || 'Error desconocido.'}`
    }
  } finally {
    cargando.value = false
  }
}
</script>

<!---------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!---------------------------------------------------------------------------------------------------------------------------->

<template>
  <div class="flex items-center justify-center relative min-h-screen p-4 overflow-hidden">

    <!-- Tarjeta principal de registro -->
    <Card class="w-full max-w-md p-2 lg:p-4 !bg-black/40 backdrop-blur-md border border-zinc-800 shadow-2xl">

      <!-- Encabezado con logo y título -->
      <template #title>
        <div class="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="Logo F1" class="w-16 h-16 object-contain" />
          <div class="text-center">
            <h1 class="text-2xl font-black uppercase tracking-widest text-[#E10600]">Regístrate</h1>
          </div>
        </div>
      </template>

      <!-- Contenido del formulario -->
      <template #content>
        <Form v-slot="$form" class="flex flex-col gap-4 mt-4" :initial-values="valoresInicialesFormulario"
          :resolver="esquemaValidacion" @submit="manejarRegistro">

          <!-- Campo: Nombre de usuario -->
          <div class="flex flex-col gap-1">
            <label for="username" class="ml-1 text-xs font-bold uppercase tracking-wider text-[#F0ECEC]">Nombre de
              usuario</label>
            <InputText id="username" type="text" name="username" placeholder="MagicAlonso33"
              class="w-full p-3 !bg-[#1A1A1F] !border-[#F0ECEC] !text-[#F0ECEC] focus:ring-1 focus:ring-[#E10600]" />
            <Message v-if="$form.username?.invalid" severity="error" size="small" variant="simple" class="ml-1">
              {{ $form.username.error.message }}
            </Message>
          </div>

          <!-- Campo: Email -->
          <div class="flex flex-col gap-1">
            <label for="email" class="ml-1 text-xs font-bold uppercase tracking-wider text-[#F0ECEC]">Email</label>
            <InputText id="email" type="email" name="email" autocomplete="email" placeholder="usuario@email.com"
              class="w-full p-3 !bg-[#1A1A1F] !border-[#F0ECEC] !text-[#F0ECEC] focus:ring-1 focus:ring-[#E10600]" />
            <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple" class="ml-1">
              {{ $form.email.error.message }}
            </Message>
          </div>

          <!-- Campo: Contraseña -->
          <div class="flex flex-col gap-1">
            <label for="password"
              class="ml-1 text-xs font-bold uppercase tracking-wider text-[#F0ECEC]">Contraseña</label>
            <Password inputId="password" name="password" autocomplete="new-password" placeholder="********" toggle-mask
              :feedback="false" class="w-full [&>input]:w-full"
              inputClass="w-full p-3 !bg-[#1A1A1F] !border-[#F0ECEC] !text-[#F0ECEC] focus:ring-1 focus:ring-[#E10600]" />
            <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple" class="ml-1">
              {{ $form.password.error.message }}
            </Message>
          </div>

          <!-- Campo: Confirmar Contraseña -->
          <div class="flex flex-col gap-1">
            <label for="confirmPassword"
              class="ml-1 text-xs font-bold uppercase tracking-wider text-[#F0ECEC]">Confirmar Contraseña</label>
            <Password inputId="confirmPassword" name="confirmPassword" autocomplete="new-password"
              placeholder="********" toggle-mask :feedback="false" class="w-full [&>input]:w-full"
              inputClass="w-full p-3 !bg-[#1A1A1F] !border-[#F0ECEC] !text-[#F0ECEC] focus:ring-1 focus:ring-[#E10600]" />
            <Message v-if="$form.confirmPassword?.invalid" severity="error" size="small" variant="simple" class="ml-1">
              {{ $form.confirmPassword.error.message }}
            </Message>
          </div>

          <!-- Mensaje de error de autenticación -->
          <Message v-if="errorAutenticacion" severity="error" :closable="false" class="mt-2 text-sm">
            {{ errorAutenticacion }}
          </Message>

          <!-- Botones de acción -->
          <div class="flex flex-col gap-3 mt-4">

            <Button type="submit" label="CREAR EQUIPO" :loading="cargando"
              class="w-full py-3 !bg-[#E10600] !border-none shadow-lg font-black uppercase !text-[#F0ECEC] transition-colors hover:!bg-[#C00500]" />

            <!-- Enlace a login -->
            <div class="mt-2 pt-5 pb-2 text-center border-t border-zinc-800">
              <span class="text-xs text-[#F0ECEC]">¿Ya tienes equipo? </span>
              <router-link to="/"
                class="ml-1 text-xs font-black uppercase tracking-widest text-[#D4A843] transition-colors hover:text-white">
                Inicia sesión aquí
              </router-link>
            </div>

          </div>
        </Form>
      </template>
    </Card>
  </div>
</template>
