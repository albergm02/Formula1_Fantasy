<script setup>
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'

import { Form } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'
import { ref } from 'vue'

const email = ref('')
const password = ref('')

const iniciarSesion = () => {
  console.log(email.value, password.value)
}
</script>

<template>
  <div class="h-screen w-full flex justify-center items-center bg-zinc-900">
    <Card class="shadow-2xl p-8 w-full max-w-md !bg-zinc-800">
      <template #title>
        <h1 class="mb-8 text-4xl font-bold text-white text-center">
          ¡Bienvenido a Formula 1 Fantasy!
        </h1>
      </template>
      <template #content>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label for="email" class="text-white">Email</label>
            <InputText
              id="email"
              type="email"
              class="w-full"
              v-model="email"
              placeholder="ejemplo@gmail.com"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label for="password" class="text-white">Password</label>
            <InputText id="password" type="password" placeholder="********" />
          </div>
        </div>
        <div class="flex justify-center mt-8">
          <Button label="Iniciar sesión" class="w-full" @click="iniciarSesion" />
        </div>
      </template>
    </Card>
  </div>
</template>
