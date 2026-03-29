<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  iniciarSesion,
  iniciarSesionConGoogle,
  restablecerContraseña
} from '@/services/servicioAutenticacion'
import { usarStoreAutenticacion } from '@/stores/storeAutenticacion'
import {
  obtenerMensajeErrorGoogle,
  obtenerMensajeErrorInicioSesion,
  popupGoogleCerrado
} from '@/utils/erroresAutenticacion'

import Hyperspeed from '@/components/vue-bits/Hyperspeed.vue'
import { hyperspeedPresets } from '@/components/vue-bits/HyperspeedPresets'
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
    email: z.string().min(1, 'El correo es obligatorio').email('Formato de correo inválido'),
    password: z.string().min(1, 'La contraseña es obligatoria')
  })
)

const enrutador = useRouter()
const notificacion = useToast()
const storeAutenticacion = usarStoreAutenticacion()

const cargando = ref(false)
const errorAutenticacion = ref('')
const valoresInicialesFormulario = ref({ email: '', password: '' })
const modalRecuperacionVisible = ref(false)
const correoRecuperacion = ref('')
const cargandoRecuperacion = ref(false)
const opcionesHyperspeed = ref(hyperspeedPresets.akira)

/**
 * Maneja el envío del formulario de inicio de sesión con email y contraseña.
 * Delega la autenticación al servicio y la carga de perfil al store.
 * Si el perfil no existe, el guardia del router redirige a completar registro.
 * @param {{ valid: boolean, values: { email: string, password: string } }} formulario
 */
const manejarInicioSesion = async ({ valid, values }) => {
  if (!valid) return
  cargando.value = true
  errorAutenticacion.value = ''

  try {
    const credencialUsuario = await iniciarSesion(values.email, values.password)
    await storeAutenticacion.verificarExistenciaPerfil(credencialUsuario.user.email)
    enrutador.push('/ligas')
  } catch (error) {
    errorAutenticacion.value = obtenerMensajeErrorInicioSesion(error)
  } finally {
    cargando.value = false
  }
}

/**
 * Maneja el inicio de sesión con Google mediante popup.
 * Si el perfil existe, navega a ligas. Si no, redirige a completar el registro.
 * El cierre manual del popup de Google no se trata como un error para el usuario.
 */
const manejarInicioSesionGoogle = async () => {
  errorAutenticacion.value = ''
  cargando.value = true

  try {
    const credencialUsuario = await iniciarSesionConGoogle()
    const correoGoogle = credencialUsuario.user.email.trim()

    // Verificamos que se haya obtenido un correo válido del proveedor de autenticación.
    if (!correoGoogle) {
      throw new Error('No se pudo obtener el correo de Google.')
    }

    // ¿Estaba ya registrado? ->
    const perfilEncontrado = await storeAutenticacion.verificarExistenciaPerfil(correoGoogle)

    // Sí.
    if (perfilEncontrado) {
      enrutador.push('/ligas')
      return
    }
    // No, es su primera vez, pedimos que complete su registro.
    enrutador.push('/registro-google')
  } catch (error) {
    if (!popupGoogleCerrado(error)) {
      // mostramos el error solo si no fue causado por el usuario cerrando el popup de Google
      errorAutenticacion.value = obtenerMensajeErrorGoogle(error)
    }
  } finally {
    cargando.value = false
  }
}

/**
 * Maneja el envío del formulario de recuperación de contraseña.
 * Por seguridad (evitar enumeración de usuarios), siempre muestra el mismo
 * mensaje de éxito independientemente de si el correo está registrado o no.
 */
const manejarRestablecerContraseña = async () => {
  const correoAEnviar = correoRecuperacion.value.trim()

  // Regex para validación básica del formato del correo electrónico.
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
      // Importante para la defensa: aunque el correo no exista, muestro el mensaje de éxito para evitar 
      // que un atacante pueda verificar qué correos están registrados en el sistema (enumeración de usuarios).
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

/**
 * Limpiamos el estado del modal de recuperación al cerrarlo.
 */
const alOcultarModalRecuperacion = () => {
  correoRecuperacion.value = ''
  cargandoRecuperacion.value = false
}

</script>

<!---------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!---------------------------------------------------------------------------------------------------------------------------->

<template>
  <!-- Contenedor principal -->
  <div class="relative flex items-center justify-center min-h-screen overflow-hidden p-4">

    <!-- Animación de fondo -->
    <div class="absolute inset-0 -z-10 pointer-events-none">
      <Hyperspeed :effect-options="opcionesHyperspeed" />
    </div>

    <!-- Tarjeta de inicio de sesión -->
    <Card class="w-full max-w-md p-2 lg:p-4 !bg-black/40 border rounded-xl shadow-2xl backdrop-blur-md border-zinc-800">

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
        <Form v-slot="$form" class="flex flex-col gap-4 mt-4" :initial-values="valoresInicialesFormulario"
          :resolver="esquemaValidacion" @submit="manejarInicioSesion">

          <!-- Campo de correo electrónico -->
          <div class="flex flex-col gap-1">
            <label for="email" class="ml-1 text-xs font-bold uppercase tracking-wider text-[#F0ECEC]">Email</label>
            <InputText id="email" type="email" name="email" autocomplete="email" placeholder="tu@correo.com"
              class="w-full p-3 !bg-[#1A1A1F] !text-[#F0ECEC] rounded-lg  !border-[#F0ECEC]" />
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
          <Message v-if="errorAutenticacion" severity="error" :closable="false" class="mt-2 text-sm">
            {{ errorAutenticacion }}
          </Message>

          <!-- Botones de acción -->
          <div class="flex flex-col gap-3 mt-4">

            <!-- Botón de inicio de sesión -->
            <Button type="submit" label="Iniciar sesión" :loading="cargando"
              class="w-full py-3 !bg-[#E10600] font-black uppercase !text-[#F0ECEC] rounded-lg shadow-lg transition-colors !border-none hover:!bg-[#C00500]" />

            <!-- Botón de inicio con Google -->
            <Button type="button" icon="pi pi-google" label="Entrar con Google"
              class="flex w-full items-center justify-center gap-2 py-3 !bg-white font-bold uppercase !text-black rounded-lg shadow-lg transition-colors !border-none hover:!bg-gray-300"
              @click="manejarInicioSesionGoogle" />

            <!-- Botón de contraseña olvidada -->
            <Button type="button" label="¿Olvidaste tu contraseña?" text
              class="w-full mt-1 !bg-transparent font-bold !text-[#D4A843] transition-colors !border-none hover:!text-[#C09638]"
              @click="modalRecuperacionVisible = true" />

            <!-- Enlace de registro -->
            <div class="mt-2 pt-5 pb-2 text-center border-t border-zinc-800">
              <span class="text-xs text-[#F0ECEC]">¿No tienes equipo? </span>
              <router-link to="/registro"
                class="ml-1 text-xs font-black uppercase tracking-widest text-[#D4A843] hover:text-white transition-colors">
                Regístrate aquí
              </router-link>
            </div>
          </div>
        </Form>
      </template>
    </Card>

    <!-- Modal de recuperación de contraseña -->
    <Dialog v-model:visible="modalRecuperacionVisible" modal header="Recuperar Contraseña"
      @hide="alOcultarModalRecuperacion"
      :headerStyle="{ backgroundColor: '#1A1A1F', color: 'white', borderBottom: '1px solid #2A2A32' }"
      :contentStyle="{ backgroundColor: '#1A1A1F', padding: '1.5rem' }"
      :style="{ width: '90vw', maxWidth: '400px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }">

      <div class="flex flex-col gap-4">
        <p class="text-sm text-[#F0ECEC]">Introduce tu correo y te enviaremos un enlace de recuperación.</p>

        <InputText v-model="correoRecuperacion" type="email" placeholder="tu@correo.com"
          class="w-full p-3 !bg-[#121218] text-white rounded-lg focus:!border-[#D4A843] !border-zinc-700"
          @keyup.enter="manejarRestablecerContraseña" />

        <Button label="ENVIAR CORREO" icon="pi pi-envelope" :loading="cargandoRecuperacion"
          class="mt-2 w-full py-3 !bg-[#D4A843] font-black tracking-widest !text-[#121218] rounded-lg !border-none hover:!bg-[#C09638]"
          @click="manejarRestablecerContraseña" />
      </div>
    </Dialog>
  </div>
</template>
