<template>
  <div class="relative min-h-screen flex items-center justify-center p-4 font-sans overflow-hidden">
    <!-- Fondo animado -->
    <MagicRings class="absolute inset-0 -z-30" color="#FFFFFF" :ringCount="1" :radiusStep="0.05"  />
    <Card class="w-full max-w-md rounded !bg-transparent !text-[#FFFFFF]">
      <template #title>
        <div class="text-center">
          <h1 class="text-2xl font-black text-[#FF1E00] uppercase">Regístrate</h1>
        </div>
      </template>
      <!-- Contenido del formulario de registro -->
      <template #content>
        <Form v-slot="$form" class="flex flex-col gap-4 mt-4" :initial-values="initialValues" :resolver="resolver"
          @submit="crearCuenta">
          <div class="flex flex-col gap-1">
            <label for="username" class="font-bold text-xs text-[#D9D9D9] uppercase">Nombre de usuario</label>
            <InputText id="username" type="text" name="username" placeholder="Tu nombre de usuario"
              class="w-full !bg-[#15151E] !text-[#FFFFFF] !border-[#D9D9D9]" fluid />
            <Message v-if="$form.username?.invalid" severity="error" size="small" variant="simple">
              {{ $form.username.error.message }}
            </Message>
          </div>
          <div class="flex flex-col gap-1">
            <label for="email" class="font-bold text-xs text-[#D9D9D9] uppercase">Email</label>
            <InputText id="email" type="email" name="email" autocomplete="email" placeholder="piloto@escuderia.com"
              class="w-full !bg-[#15151E] !text-[#FFFFFF] !border-[#D9D9D9]" fluid />
            <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple">
              {{ $form.email.error.message }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label for="password" class="font-bold text-xs text-[#D9D9D9] uppercase">Contraseña</label>
            <Password inputId="password" name="password" autocomplete="new-password" placeholder="********" toggle-mask
              :feedback="false"
              inputClass="w-full !bg-[#15151E] !text-[#FFFFFF] !border-[#D9D9D9]" fluid />
            <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">
              {{ $form.password.error.message }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label for="confirmPassword" class="font-bold text-xs text-[#D9D9D9] uppercase">Confirmar Contraseña</label>
            <Password inputId="confirmPassword" name="confirmPassword" autocomplete="new-password"
              placeholder="********" toggle-mask :feedback="false"
              inputClass="w-full !bg-[#15151E] !text-[#FFFFFF] !border-[#D9D9D9]" fluid />
            <Message v-if="$form.confirmPassword?.invalid" severity="error" size="small" variant="simple">
              {{ $form.confirmPassword.error.message }}
            </Message>
          </div>

          <Message v-if="firebaseError" severity="error" :closable="false" class="mt-2">
            {{ firebaseError }}
          </Message>

          <div class="flex flex-col gap-4 mt-4">
            <Button type="submit" label="CREAR CUENTA" :loading="loading"
              class="w-full font-bold !bg-[#FF1E00] !border-none !text-[#FFFFFF]" />
            <Button type="button" label="VOLVER" @click="router.push('/')"
              class="w-full font-bold !bg-transparent !border-none !text-[#00E5E5]" />
            <div class="text-center mt-2">
              <span class="text-sm text-[#D9D9D9]">¿Ya tienes equipo? </span>
              <router-link to="/" class="font-bold text-sm text-[#00E5E5]">
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

/**
 * Crea una nueva cuenta utilizando el servicio de autenticación. 
 * Si el registro es exitoso, se inicializan los datos globales del usuario y se redirige a la página de ligas.
 * @param param0 Objeto que contiene la validez del formulario y los valores ingresados.
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