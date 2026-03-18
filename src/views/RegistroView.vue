<template>
  <div class="relative min-h-screen flex items-center justify-center p-4 font-sans overflow-hidden">
    <MagicRings class="absolute inset-0 -z-30" color="#FFFFFF" colorTwo="#FFFFFF" :ringCount="2" />
    <Card class="w-full max-w-md rounded !bg-transparent !text-[#FFFFFF]">
      <template #title>
        <div class="text-center">
          <h1 class="text-2xl font-black text-[#FF1E00] uppercase">Regístrate</h1>
        </div>
      </template>
      <template #content>
        <Form v-slot="$form" class="flex flex-col gap-4 mt-4" :initial-values="initialValues" :resolver="resolver"
          @submit="crearCuenta">
          <div class="flex flex-col gap-1">
            <label for="username" class="font-bold text-[#D9D9D9] text-xs uppercase">Nombre de usuario</label>
            <InputText id="username" type="text" name="username" placeholder="Tu nombre de usuario"
              class="w-full !bg-[#15151E] !text-[#FFFFFF] !border-[#D9D9D9] focus:!border-[#00E5E5]" fluid />
            <Message v-if="$form.username?.invalid" severity="error" size="small" variant="simple">
              {{ $form.username.error.message }}
            </Message>
          </div>
          <div class="flex flex-col gap-1">
            <label for="email" class="font-bold text-[#D9D9D9] text-xs uppercase">Email</label>
            <InputText id="email" type="email" name="email" autocomplete="email" placeholder="piloto@escuderia.com"
              class="w-full !bg-[#15151E] !text-[#FFFFFF] !border-[#D9D9D9] focus:!border-[#00E5E5]" fluid />
            <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple">
              {{ $form.email.error.message }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label for="password" class="font-bold text-[#D9D9D9] text-xs">CONTRASEÑA</label>
            <Password inputId="password" name="password" autocomplete="new-password" placeholder="********" toggle-mask
              :feedback="false"
              inputClass="w-full !bg-[#15151E] !text-[#FFFFFF] !border-[#D9D9D9] focus:!border-[#00E5E5]" fluid />
            <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">
              {{ $form.password.error.message }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label for="confirmPassword" class="font-bold text-[#D9D9D9] text-xs">CONFIRMAR CONTRASEÑA</label>
            <Password inputId="confirmPassword" name="confirmPassword" autocomplete="new-password"
              placeholder="********" toggle-mask :feedback="false"
              inputClass="w-full !bg-[#15151E] !text-[#FFFFFF] !border-[#D9D9D9] focus:!border-[#00E5E5]" fluid />
            <Message v-if="$form.confirmPassword?.invalid" severity="error" size="small" variant="simple">
              {{ $form.confirmPassword.error.message }}
            </Message>
          </div>

          <Message v-if="firebaseError" severity="error" :closable="false" class="mt-2">
            {{ firebaseError }}
          </Message>

          <div class="flex flex-col gap-4 mt-4">
            <Button type="submit" label="CREAR CUENTA" :loading="loading"
              class="w-full !bg-[#FF1E00] !border-none font-bold !text-[#FFFFFF] hover:!bg-[#D01800]" />
            <Button type="button" label="VOLVER" @click="router.push('/')"
              class="w-full !bg-transparent !border-none font-bold !text-[#00E5E5] hover:!text-[#FFFFFF] transition-colors" />
            <div class="text-center mt-2">
              <span class="text-[#D9D9D9] text-sm">¿Ya tienes equipo? </span>
              <router-link to="/" class="text-[#00E5E5] font-bold !text-sm hover:!text-[#FFFFFF]">
                Inicia sesión aquí
              </router-link>
            </div>
          </div>
        </Form>
      </template>
    </Card>
  </div>
</template>

<script setup>
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Password from 'primevue/password'

import MagicRings from '@/components/MagicRings.vue'

import { Form } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signUp } from '@/services/authService'
import { useAuthStore } from '@/stores/storeAuth'

const router = useRouter()
const loading = ref(false)
const firebaseError = ref('')
const authStore = useAuthStore()

const initialValues = ref({
  username: '',
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
      username: z
        .string()
        .min(1, 'Nombre requerido')
        .min(3, 'El nombre debe tener al menos 3 caracteres')
        .max(8, 'El nombre no debe exceder los 8 caracteres'),
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
    await authStore.iniciarDatosGlobales(values.email, values.username)
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