<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  iniciarSesion,
  iniciarSesionConGoogle,
  restablecerContraseña,
  verificarBloqueoAcceso,
  registrarIntentoFallido,
  reiniciarContadorIntentos,
  cerrarSesion,
} from '@/services/servicioAutenticacion'

import { usarStoreAutenticacion } from '@/stores/storeAutenticacion'

import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'
import { Form } from '@primevue/forms'

import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'

const esquemaValidacion = zodResolver(
  z.object({
    email: z.string().min(1, 'El correo es obligatorio.').email('Formato de correo inválido.'),
    password: z.string().min(1, 'La contraseña es obligatoria.')
  })
)

const router = useRouter()
const notificacion = useToast()
const cargando = ref(false)

const storeAuth = usarStoreAutenticacion()
const errorAuth = ref('')
const valoresInicialesFormulario = ref({ email: '', password: '' })

const modalRecuperacionVisible = ref(false)
const correoRecuperacion = ref('')
const cargandoRecuperacion = ref(false)

const handleInicioSesion = async ({ valid, values }) => {
  if (!valid) return
  cargando.value = true
  errorAuth.value = ''

  try {
    await verificarBloqueoAcceso(values.email.trim())
    const credencialUsuario = await iniciarSesion(values.email, values.password)
    if (!credencialUsuario.user.emailVerified) {
      await cerrarSesion()
      storeAuth.limpiarSesion()
      errorAuth.value = 'Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.'
      return
    }
    await reiniciarContadorIntentos()
    await storeAuth.verificarExistenciaPerfil(credencialUsuario.user.uid, credencialUsuario.user.email)
    const destino = storeAuth.esAdministrador ? '/admin' : '/ligas'
    router.push(destino)
  } catch (error) {
    const codigosCredencialesInvalidas = ['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password']
    if (error.message?.startsWith('Acceso bloqueado')) {
      errorAuth.value = error.message
    } else if (codigosCredencialesInvalidas.includes(error?.code)) {
      await registrarIntentoFallido(values.email.trim())
      errorAuth.value = 'Correo o contraseña incorrectos.'
    } else if (error?.code === 'auth/too-many-requests') {
      errorAuth.value = 'Demasiados intentos. Inténtalo más tarde.'
    } else {
      errorAuth.value = 'Correo o contraseña incorrectos.'
    }
  } finally {
    cargando.value = false
  }
}

const handleInicioSesionGoogle = async () => {
  errorAuth.value = ''
  cargando.value = true

  try {
    const credencialUsuario = await iniciarSesionConGoogle()
    const correoGoogle = credencialUsuario.user.email.trim()

    if (!correoGoogle) {
      throw new Error('No se pudo obtener el correo de Google.')
    }

    const perfilEncontrado = await storeAuth.verificarExistenciaPerfil(credencialUsuario.user.uid, correoGoogle)

    if (perfilEncontrado) {
      const destino = storeAuth.esAdministrador ? '/admin' : '/ligas'
      router.push(destino)
      return
    }
    router.push('/registro-google')
  } catch (error) {
    if (error?.code !== 'auth/popup-closed-by-user') {
      console.error('[InicioSesionGoogle] Error inesperado:', error)
      errorAuth.value = 'No se ha podido iniciar sesión con Google. Inténtalo de nuevo.'
    }
  } finally {
    cargando.value = false
  }
}

// Siempre devuelvo éxito genérico para no revelar si el correo existe
// (protección anti user enumeration).
const handleRecuperarContraseña = async () => {
  const correoAEnviar = correoRecuperacion.value.trim()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoAEnviar)) {
    notificacion.add({ severity: 'warn', summary: 'Aviso', detail: 'Por favor, introduce un correo válido (ej: piloto@correo.com).', life: 4000 })
    return
  }

  cargandoRecuperacion.value = true
  try {
    await restablecerContraseña(correoAEnviar)
    notificacion.add({ severity: 'success', summary: 'Revisa tu correo', detail: 'Si el correo está registrado, recibirás un enlace de recuperación.', life: 6000 })
    modalRecuperacionVisible.value = false
    correoRecuperacion.value = ''
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      notificacion.add({ severity: 'success', summary: 'Revisa tu correo', detail: 'Si el correo está registrado, recibirás un enlace de recuperación.', life: 6000 })
      modalRecuperacionVisible.value = false
      correoRecuperacion.value = ''
    } else {
      notificacion.add({ severity: 'error', summary: 'Error de conexión', detail: 'Hubo un problema de red. Inténtalo de nuevo más tarde.', life: 4000 })
    }
  } finally {
    cargandoRecuperacion.value = false
  }
}

const alOcultarModalRecuperacion = () => {
  correoRecuperacion.value = ''
  cargandoRecuperacion.value = false
}

</script>


<template>
  <div class="flex items-center justify-center relative min-h-screen p-4 overflow-hidden">

    <Card class="w-full max-w-md p-2 lg:p-4 !bg-black/20 shadow-2xl border border-[#2A2A32] backdrop-blur-sm">

      <template #title>
        <div class="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="Logo F1" class="w-16 h-16 object-contain" />
          <div class="text-center">
            <h1 class="text-3xl font-black tracking-widest text-[#D4A843]">F1 FANTASY</h1>
          </div>
        </div>
      </template>

      <template #content>
        <Form v-slot="$form" class="flex flex-col gap-4 mt-4" :initial-values="valoresInicialesFormulario"
          :resolver="esquemaValidacion" @submit="handleInicioSesion">

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
            <Password inputId="password" name="password" autocomplete="current-password"
              placeholder="Escribe aquí tu contraseña..." toggle-mask :feedback="false" class="w-full [&>input]:w-full"
              inputClass="w-full p-3 !bg-[#1A1A1F] !border-[#F0ECEC] !text-[#F0ECEC]" />
            <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple" class="ml-1">
              {{ $form.password.error.message }}
            </Message>
          </div>

          <Message v-if="errorAuth" severity="error" :closable="false" class="mt-2 text-sm">
            {{ errorAuth }}
          </Message>

          <div class="flex flex-col gap-3 mt-4">

            <Button type="submit" label="Iniciar sesión" :loading="cargando"
              class="w-full py-3 !bg-[#D4A843] !border-none shadow-lg font-black uppercase !text-black" />

            <Button type="button" icon="pi pi-google" label="Entrar con Google"
              class="flex items-center justify-center w-full py-3 gap-2 !bg-white !border-none shadow-lg font-bold uppercase !text-black"
              @click="handleInicioSesionGoogle" />

            <Button type="button" label="¿Olvidaste tu contraseña?" text
              class="w-full mt-1 !bg-transparent !border-none font-bold !text-[#D4A843]"
              @click="modalRecuperacionVisible = true" />

            <div class="mt-2 pt-5 pb-2 text-center border-t border-zinc-800">
              <span class="text-xs text-[#F0ECEC]">¿No tienes equipo? </span>
              <router-link to="/registro" class="ml-1 text-xs font-black uppercase tracking-widest text-[#D4A843]">
                Regístrate aquí
              </router-link>
            </div>
          </div>
        </Form>
      </template>
    </Card>

    <Dialog v-model:visible="modalRecuperacionVisible" modal header="Recuperar Contraseña"
      @hide="alOcultarModalRecuperacion"
      :headerStyle="{ backgroundColor: '#1A1A1F', color: 'white', borderBottom: '1px solid #2A2A32' }">

      <div class="flex flex-col gap-4">
        <p class="text-sm text-[#F0ECEC]">Introduzca aquí su correo y le enviaremos un enlace de recuperación.</p>

        <InputText v-model="correoRecuperacion" type="email" placeholder="Escribe aquí tu correo..."
          autocomplete="email" class="w-full p-3 !border-zinc-700 text-white !bg-[#1A1A1F]"
          @keyup.enter="handleRecuperarContraseña" />

        <Button label="ENVIAR CORREO" :loading="cargandoRecuperacion"
          class="w-full mt-2 py-3 !bg-[#D4A843] !border-none font-black tracking-widest !text-[#121218]"
          @click="handleRecuperarContraseña" />
      </div>
    </Dialog>
  </div>
</template>
