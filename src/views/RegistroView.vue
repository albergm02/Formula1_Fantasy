<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'

import { usarStoreAutenticacion } from '@/stores/storeAutenticacion'
import { mensajeErrorFirebase } from '@/services/servicioAutenticacion'

import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'

import { Form } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'

const esquemaValidacion = zodResolver(
  z
    .object({
      username: z
        .string()
        .trim()
        .min(3, 'El nombre debe tener al menos 3 caracteres.')
        .max(12, 'El nombre no debe exceder los 12 caracteres.'),
      email: z.string().min(1, 'El correo es obligatorio.').email('Formato de correo inválido.'),
      password: z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres.')
        .regex(/[a-z]/, 'La contraseña debe incluir al menos una letra minúscula.')
        .regex(/[A-Z]/, 'La contraseña debe incluir al menos una letra mayúscula.')
        .regex(/[0-9]/, 'La contraseña debe incluir al menos un número.'),
      confirmPassword: z.string().min(1, 'Confirma tu contraseña.'),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Las contraseñas no coinciden.',
      path: ['confirmPassword'],
    }),
)

const router = useRouter()
const notificacion = useToast()
const storeAutenticacion = usarStoreAutenticacion()

const cargando = ref(false)
const errorAutenticacion = ref('')
const valoresInicialesFormulario = ref({ username: '', email: '', password: '', confirmPassword: '' })

const handleRegistro = async ({ valid, values }) => {
  if (!valid) return
  const correoNormalizado = values.email.trim()
  const nombreNormalizado = values.username.trim()

  cargando.value = true
  errorAutenticacion.value = ''
  try {
    await storeAutenticacion.procesarRegistro(correoNormalizado, values.password, nombreNormalizado)
    notificarRegistroSolicitado()
    router.push('/')
  } catch (error) {
    if (error?.code === 'auth/email-already-in-use') {
      notificarRegistroSolicitado()
      router.push('/')
      return
    }
    errorAutenticacion.value = mensajeErrorFirebase(error)
  } finally {
    cargando.value = false
  }
}

const notificarRegistroSolicitado = () => {
  notificacion.add({
    severity: 'info',
    summary: 'Solicitud recibida',
    detail:
      'Si el correo no estaba registrado, recibirás un mensaje de verificación. Revisa tu bandeja de entrada antes de iniciar sesión.',
    life: 8000,
  })
}
</script>

<template>
  <div class="flex items-center justify-center relative min-h-screen p-4 overflow-hidden">
    <Card class="w-full max-w-md !bg-black/20 backdrop-blur-md border border-zinc-800">
      <template #title>
        <div class="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="Logo F1" class="w-16 h-16 object-contain" />
          <div class="text-center">
            <h1 class="text-2xl font-black uppercase tracking-widest text-[#D4A843]">Regístrate aquí</h1>
          </div>
        </div>
      </template>

      <template #content>
        <Form v-slot="$form" class="flex flex-col gap-4 mt-4" :initial-values="valoresInicialesFormulario"
          :resolver="esquemaValidacion" @submit="handleRegistro">
          <div class="flex flex-col gap-1">
            <label for="username" class="ml-1 text-xs font-bold uppercase tracking-wider text-[#F0ECEC]">Nombre de
              usuario</label>
            <InputText id="username" type="text" name="username" placeholder="Escribe aquí tu nombre de usuario..."
              autocomplete="username" class="w-full p-3 !bg-[#1A1A1F] !border-[#F0ECEC] !text-[#F0ECEC]" />
            <Message v-if="$form.username?.invalid" severity="error" size="small" variant="simple" class="ml-1">
              {{ $form.username.error.message }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label for="email" class="ml-1 text-xs font-bold uppercase tracking-wider text-[#F0ECEC]">Email</label>
            <InputText id="email" type="email" name="email" autocomplete="email" placeholder="Escribe aquí tu correo..."
              class="w-full p-3 !bg-[#1A1A1F] !border-[#F0ECEC] !text-[#F0ECEC]" />
            <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple" class="ml-1">
              {{ $form.email.error.message }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label for="password"
              class="ml-1 text-xs font-bold uppercase tracking-wider text-[#F0ECEC]">Contraseña</label>
            <Password inputId="password" name="password" autocomplete="new-password"
              placeholder="Escribe aquí tu contraseña..." toggle-mask :feedback="false" class="w-full [&>input]:w-full"
              inputClass="w-full p-3 !bg-[#1A1A1F] !border-[#F0ECEC] !text-[#F0ECEC]" />
            <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple" class="ml-1">
              {{ $form.password.error.message }}
            </Message>
          </div>

          <div class="flex flex-col gap-1">
            <label for="confirmPassword"
              class="ml-1 text-xs font-bold uppercase tracking-wider text-[#F0ECEC]">Confirmar Contraseña</label>
            <Password inputId="confirmPassword" name="confirmPassword" autocomplete="new-password"
              placeholder="Escribe aquí tu contraseña..." toggle-mask :feedback="false" class="w-full [&>input]:w-full"
              inputClass="w-full p-3 !bg-[#1A1A1F] !border-[#F0ECEC] !text-[#F0ECEC]" />
            <Message v-if="$form.confirmPassword?.invalid" severity="error" size="small" variant="simple" class="ml-1">
              {{ $form.confirmPassword.error.message }}
            </Message>
          </div>

          <Message v-if="errorAutenticacion" severity="error" :closable="false" class="mt-2 text-sm">
            {{ errorAutenticacion }}
          </Message>

          <div class="flex flex-col gap-3 mt-4">
            <Button type="submit" label="REGISTRARSE" :loading="cargando"
              class="w-full py-3 !bg-[#D4A843] !border-none shadow-lg font-black uppercase !text-black" />

            <div class="mt-2 pt-5 pb-2 text-center border-t border-zinc-800">
              <span class="text-xs text-[#F0ECEC]">¿Ya tienes cuenta? </span>
              <router-link to="/" class="ml-1 text-xs font-black uppercase tracking-widest text-[#D4A843]">
                Inicia sesión aquí
              </router-link>
            </div>
          </div>
        </Form>
      </template>
    </Card>
  </div>
</template>
