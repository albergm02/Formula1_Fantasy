<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

/* Servicios de autenticaciÃ³n */
import { registrarse } from '@/services/servicioAutenticacion'
import { usarStoreAutenticacion } from '@/stores/storeAutenticacion'

/* Componentes UI */
import Hyperspeed from '@/components/Hyperspeed.vue'
import { hyperspeedPresets } from '@/utils/HyperspeedPresets'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'

/* Utilidades de manejo de errores */
import { obtenerMensajeErrorRegistro } from '@/utils/erroresAutenticacion'

/* ValidaciÃ³n con Zod */
import { Form } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'
import { esquemaNombreUsuario } from '@/utils/validacionesAutenticacion'

/* Esquema de validaciÃ³n con Zod */
const esquemaValidacion = zodResolver(
  z.object({
    username: esquemaNombreUsuario,
    email: z.string().min(1, 'El correo es obligatorio').email('Formato de correo invÃ¡lido'),
    password: z.string().min(8, 'La contraseÃ±a debe tener al menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma tu contraseÃ±a'),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseÃ±as no coinciden',
    path: ['confirmPassword'],
  })
)

const enrutador = useRouter()
const storeAutenticacion = usarStoreAutenticacion()

/* Estados del formulario de registro */
const cargando = ref(false)
const errorAutenticacion = ref('')
const opcionesHyperspeed = ref(hyperspeedPresets.akira)
const valoresInicialesFormulario = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})


/* Handler Registro utilizando email / contraseÃ±a */
const handlerRegistro = async ({ valid, values }) => {
  if (!valid) return
  const correoNormalizado = values.email.trim()
  const usuarioNormalizado = values.username.trim()

  cargando.value = true
  errorAutenticacion.value = ''
  try {
    const credencialUsuario = await registrarse(correoNormalizado, values.password)
    await storeAutenticacion.cargarOCrearPerfil(credencialUsuario.user.email, usuarioNormalizado)
    enrutador.push('/ligas')
  } catch (error) {
    errorAutenticacion.value = obtenerMensajeErrorRegistro(error)
  } finally {
    cargando.value = false
  }
}
</script>

<!---------------------------------------------------------------------------------------------------------------------------->

<!-------------------------------------------------------TEMPLATE------------------------------------------------------------->

<!---------------------------------------------------------------------------------------------------------------------------->

<template>
  <div class="relative flex items-center justify-center min-h-screen p-4 overflow-hidden">

    <!-- AnimaciÃ³n de fondo -->
    <div class="absolute inset-0 -z-10 pointer-events-none">
      <Hyperspeed :effect-options="opcionesHyperspeed" />
    </div>

    <!-- Tarjeta principal de registro -->
    <Card class="w-full max-w-md p-2 lg:p-4 !bg-black/40 border shadow-2xl rounded-xl backdrop-blur-md border-zinc-800">

      <!-- Encabezado con logo y tÃ­tulo -->
      <template #title>
        <div class="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="Logo F1" class="w-16 h-16 object-contain" />
          <div class="text-center">
            <h1 class="text-2xl font-black uppercase tracking-widest text-[#E10600]">RegÃ­strate</h1>
          </div>
        </div>
      </template>

      <!-- Contenido del formulario -->
      <template #content>
        <Form v-slot="$form" class="flex flex-col gap-4 mt-4" :initial-values="valoresInicialesFormulario"
          :resolver="esquemaValidacion" @submit="handlerRegistro">

          <!-- Campo: Nombre de Piloto -->
          <div class="flex flex-col gap-1">
            <label for="username" class="ml-1 text-xs font-bold uppercase tracking-wider text-[#F0ECEC]">Nombre de
              Piloto</label>
            <InputText id="username" type="text" name="username" placeholder="MagicAlonso33"
              class="w-full p-3 !bg-[#1A1A1F] !text-[#F0ECEC] rounded-lg focus:ring-1 focus:ring-[#E10600] !border-[#F0ECEC]" />
            <Message v-if="$form.username?.invalid" severity="error" size="small" variant="simple" class="ml-1">
              {{ $form.username.error.message }}
            </Message>
          </div>

          <!-- Campo: Email -->
          <div class="flex flex-col gap-1">
            <label for="email" class="ml-1 text-xs font-bold uppercase tracking-wider text-[#F0ECEC]">Email</label>
            <InputText id="email" type="email" name="email" autocomplete="email" placeholder="piloto@escuderia.com"
              class="w-full p-3 !bg-[#1A1A1F] !text-[#F0ECEC] rounded-lg focus:ring-1 focus:ring-[#E10600] !border-[#F0ECEC]" />
            <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple" class="ml-1">
              {{ $form.email.error.message }}
            </Message>
          </div>

          <!-- Campo: ContraseÃ±a -->
          <div class="flex flex-col gap-1">
            <label for="password"
              class="ml-1 text-xs font-bold uppercase tracking-wider text-[#F0ECEC]">ContraseÃ±a</label>
            <Password inputId="password" name="password" autocomplete="new-password" placeholder="********" toggle-mask
              :feedback="false" class="w-full [&>input]:w-full"
              inputClass="w-full p-3 rounded-lg focus:ring-1 focus:ring-[#E10600] !border-[#F0ECEC] !bg-[#1A1A1F] !text-[#F0ECEC]" />
            <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple" class="ml-1">
              {{ $form.password.error.message }}
            </Message>
          </div>

          <!-- Campo: Confirmar ContraseÃ±a -->
          <div class="flex flex-col gap-1">
            <label for="confirmPassword"
              class="ml-1 text-xs font-bold uppercase tracking-wider text-[#F0ECEC]">Confirmar ContraseÃ±a</label>
            <Password inputId="confirmPassword" name="confirmPassword" autocomplete="new-password"
              placeholder="********" toggle-mask :feedback="false" class="w-full [&>input]:w-full"
              inputClass="w-full p-3 rounded-lg focus:ring-1 focus:ring-[#E10600] !border-[#F0ECEC] !bg-[#1A1A1F] !text-[#F0ECEC]" />
            <Message v-if="$form.confirmPassword?.invalid" severity="error" size="small" variant="simple" class="ml-1">
              {{ $form.confirmPassword.error.message }}
            </Message>
          </div>

          <!-- Mensaje de error de autenticaciÃ³n -->
          <Message v-if="errorAutenticacion" severity="error" :closable="false" class="mt-2 text-sm">
            {{ errorAutenticacion }}
          </Message>

          <!-- Botones de acciÃ³n -->
          <div class="flex flex-col gap-3 mt-4">

            <Button type="submit" label="CREAR EQUIPO" :loading="cargando"
              class="w-full py-3 !bg-[#E10600] font-black uppercase !text-[#F0ECEC] transition-colors shadow-lg rounded-lg !border-none hover:!bg-[#C00500]" />

            <!-- Enlace a login -->
            <div class="pt-5 pb-2 mt-2 text-center border-t border-zinc-800">
              <span class="text-xs text-[#F0ECEC]">Â¿Ya tienes equipo? </span>
              <router-link to="/"
                class="ml-1 text-xs font-black uppercase tracking-widest text-[#D4A843] hover:text-white transition-colors">
                Inicia sesiÃ³n aquÃ­
              </router-link>
            </div>

          </div>
        </Form>
      </template>
    </Card>
  </div>
</template>
