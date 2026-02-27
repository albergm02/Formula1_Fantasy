<script setup>
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'

import { Form } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'
import { ref } from 'vue'

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
const iniciarSesion = ({ valid, values }) => {
  if (valid) {
    console.log('Iniciar sesión')
  } else {
    console.log('Formulario inválido')
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans">
    <Card class="w-full max-w-md !bg-zinc-800 rounded">
      <template #title>
        <div class="flex flex-col items-center -mt-12 mb-4">
          <img src="../assets/icon.png" alt="F1 Logo" class="mx-auto" />
          <div class="text-center -mt-10">
            <h1 class="text-3xl font-black italic tracking-tight text-red-600 uppercase">
              F1 Fantasy
            </h1>
          </div>
        </div>
      </template>
      <template #content>
        <Form
          v-slot="$form"
          :resolver="resolver"
          :initial-values="initialValues"
          @submit="iniciarSesion"
          class="flex flex-col gap-4 mt-4"
        >
          <div class="flex flex-col gap-1">
            <label for="email" class="font-bold text-white uppercase">Email</label>
            <InputText
              id="email"
              name="email"
              type="email"
              class="w-full !bg-zinc-700 !text-white !border-zinc-700"
              placeholder="piloto@escuderia.com"
            />
            <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple">
              {{ $form.email.error.message }}
            </Message>
          </div>
          <div class="flex flex-col gap-1">
            <label for="password" class="font-bold text-white uppercase">Contraseña</label>
            <InputText
              id="password"
              name="password"
              type="password"
              class="w-full !bg-zinc-700 !text-white !border-zinc-700"
              placeholder="********"
            />
            <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">
              {{ $form.password.error.message }}
            </Message>
            <div class="flex flex-col gap-1">
              <a href="#" class="font-bold text-white mt-2">¿Olvidaste tu contraseña?</a>
            </div>
          </div>

          <div class="flex flex-col gap-2 mt-4">
            <Button
              type="submit"
              label="Iniciar Sesión"
              class="w-full !bg-red-600 !border-red-600 font-bold text-white uppercase"
            />
          </div>

          <div class="flex flex-col gap-2">
            <Button
              type="button"
              label="Crear Cuenta"
              class="w-full !bg-zinc-700 !border-zinc-700 font-bold text-white uppercase"
            />
          </div>
        </Form>
      </template>
    </Card>
  </div>
</template>
