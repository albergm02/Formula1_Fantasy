<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usarStoreAutenticacion } from '@/stores/storeAutenticacion'
import { usarStorePerfil } from '@/stores/storePerfil'

import { mensajeErrorFirebase } from '@/services/servicioAutenticacion'

import Cabecera from '@/components/Cabecera.vue'

import Card from 'primevue/card'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import { Form } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'

const router = useRouter()
const storeAutenticacion = usarStoreAutenticacion()
const storePerfil = usarStorePerfil()
const toast = useToast()

const puedeUsarContrasena = storeAutenticacion.tieneSesionConContrasena

const DIAS_BLOQUEO_CAMBIO_CORREO = 7
const MILISEGUNDOS_POR_DIA = 86_400_000

const fechaUltimoCambioCorreo = ref(null)

function calcularDiasRestantes(fechaUltimoCambio) {
  if (!fechaUltimoCambio) return 0
  const diasTranscurridos = (Date.now() - fechaUltimoCambio.getTime()) / MILISEGUNDOS_POR_DIA
  return Math.max(0, Math.ceil(DIAS_BLOQUEO_CAMBIO_CORREO - diasTranscurridos))
}

const diasRestantesParaCambiarCorreo = computed(() => calcularDiasRestantes(fechaUltimoCambioCorreo.value))

const valoresInicialesCambioCorreo = ref({ correoNuevo: '', correoNuevoConfirmacion: '', contrasenaActual: '' })

const esquemaCambioCorreo = zodResolver(
  z
    .object({
      correoNuevo: z.string().min(1, 'El correo es obligatorio.').email('Formato de correo inválido.'),
      correoNuevoConfirmacion: z.string().min(1, 'Confirma el nuevo correo.'),
      contrasenaActual: z.string().min(1, 'Introduce tu contraseña actual.'),
    })
    .refine((datos) => datos.correoNuevo.toLowerCase() === datos.correoNuevoConfirmacion.toLowerCase(), {
      message: 'Ambos campos deben tener el mismo correo.',
      path: ['correoNuevoConfirmacion'],
    })
    .refine((datos) => datos.correoNuevo.toLowerCase() !== storePerfil.usuarioActual.correoAutenticacion.toLowerCase(), {
      message: 'Introduce un correo distinto al actual.',
      path: ['correoNuevo'],
    }),
)

async function cargarMetadatosPerfil() {
  fechaUltimoCambioCorreo.value = await storePerfil.cargarFechaCambioCorreo(storePerfil.usuarioActual.uid)
}

onMounted(cargarMetadatosPerfil)

const dialogoContrasenaAbierto = ref(false)
const enviandoEnlaceContrasena = ref(false)

function abrirDialogoContrasena() {
  dialogoContrasenaAbierto.value = true
}

async function confirmarCambioContrasena() {
  enviandoEnlaceContrasena.value = true
  try {
    await storePerfil.cambiarContrasena()
    dialogoContrasenaAbierto.value = false
    toast.add({
      severity: 'success',
      summary: 'Revisa tu correo',
      detail: 'Te hemos enviado un enlace para restablecer tu contraseña.',
      life: 6000,
    })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'No se pudo enviar', detail: mensajeFirebase(error), life: 6000 })
  } finally {
    enviandoEnlaceContrasena.value = false
  }
}

const dialogoCorreoAbierto = ref(false)
const enviandoCorreo = ref(false)

function abrirDialogoCorreo() {
  valoresInicialesCambioCorreo.value = { correoNuevo: '', correoNuevoConfirmacion: '', contrasenaActual: '' }
  dialogoCorreoAbierto.value = true
}

async function confirmarCambioCorreo({ valid, values }) {
  if (diasRestantesParaCambiarCorreo.value > 0) {
    toast.add({
      severity: 'warn',
      summary: 'Cambio no disponible',
      detail: `Podrás cambiar el correo dentro de ${diasRestantesParaCambiarCorreo.value} días.`,
      life: 4000,
    })
    return
  }
  if (!valid) return
  enviandoCorreo.value = true
  try {
    await storePerfil.cambiarCorreo(values.correoNuevo.trim(), values.contrasenaActual)
    fechaUltimoCambioCorreo.value = new Date()
    dialogoCorreoAbierto.value = false
    toast.add({
      severity: 'success',
      summary: 'Confirma tu nuevo correo',
      detail: 'Te hemos enviado un enlace al correo nuevo. Ábrelo para completar el cambio; después deberás iniciar sesión de nuevo.',
      life: 8000,
    })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'No se pudo cambiar', detail: mensajeFirebase(error), life: 6000 })
  } finally {
    enviandoCorreo.value = false
  }
}

const dialogoBajaAbierto = ref(false)
const contrasenaParaBaja = ref('')
const eliminandoCuenta = ref(false)

function abrirDialogoBaja() {
  contrasenaParaBaja.value = ''
  dialogoBajaAbierto.value = true
}

async function ejecutarBaja() {
  eliminandoCuenta.value = true
  try {
    await storePerfil.eliminarCuenta(contrasenaParaBaja.value)
    await storeAutenticacion.cerrarSesion()
    toast.add({ severity: 'success', summary: 'Cuenta eliminada correctamente.', detail: '¡Hasta pronto!', life: 5000 })
    router.push({ name: 'login' })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'No se pudo eliminar su cuenta.', detail: mensajeFirebase(error), life: 7000 })
  } finally {
    eliminandoCuenta.value = false
    dialogoBajaAbierto.value = false
  }
}

function mensajeFirebase(error) {
  return mensajeErrorFirebase(error)
}
</script>

<template>
  <div class="min-h-screen bg-[#0F0F12] text-[#F0ECEC] pb-24">
    <Cabecera />

    <main class="max-w-3xl mx-auto p-4 flex flex-col gap-4">
      <Card class="!bg-[#1A1A1F] !text-[#F0ECEC] border border-zinc-800">
        <template #title>
          <div class="flex items-center text-sm border-b border-zinc-700 pb-2">
            <span>Datos de la cuenta</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-[10px] text-zinc-500 uppercase">Nombre de usuario</p>
              <p class="font-bold text-white">
                {{ storePerfil.usuarioActual.nombreVisible }}
              </p>
            </div>
            <div>
              <p class="text-[10px] text-zinc-500 uppercase">Correo asociado</p>
              <p class="font-bold text-white break-all">
                {{ storePerfil.usuarioActual.correoAutenticacion }}
              </p>
            </div>
            <div>
              <p class="text-[10px] text-zinc-500 uppercase">Ligas activas</p>
              <p class="font-bold text-white">
                {{ storePerfil.usuarioActual.idsLigas.length }}
              </p>
            </div>
            <div v-if="puedeUsarContrasena">
              <p class="text-[10px] text-zinc-500 uppercase">Próximo cambio de correo</p>
              <p class="font-bold text-white">
                {{
                  diasRestantesParaCambiarCorreo === 0
                    ? 'Cambio disponible'
                    : `En ${diasRestantesParaCambiarCorreo}
                días`
                }}
              </p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="!bg-[#1A1A1F] !text-[#F0ECEC] border border-zinc-800">
        <template #title>
          <div class="flex items-center text-sm border-b border-zinc-700 pb-2">
            <span>Editar perfil</span>
          </div>
        </template>
        <template #content>
          <div class="flex flex-col gap-2">
            <Button
              v-if="puedeUsarContrasena"
              @click="abrirDialogoContrasena"
              label="Cambiar contraseña"
              class="!bg-zinc-900 !border-zinc-700 !text-white justify-center"
            />
            <Button
              v-if="puedeUsarContrasena"
              @click="abrirDialogoCorreo"
              label="Cambiar correo"
              :disabled="diasRestantesParaCambiarCorreo > 0"
              class="!bg-zinc-900 !border-zinc-700 !text-white justify-center"
            />
            <Button
              @click="abrirDialogoBaja"
              label="Eliminar mi cuenta"
              class="!bg-red-700 !border-red-700 !text-white justify-center mt-5"
            />
          </div>
        </template>
      </Card>
    </main>

    <Dialog
      v-model:visible="dialogoContrasenaAbierto"
      modal
      header="CAMBIAR CONTRASEÑA"
      :style="{ width: '90vw', maxWidth: '400px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }"
    >
      <div class="flex flex-col gap-3">
        <Message severity="info" :closable="false"> Te enviaremos un enlace a tu correo para que definas una nueva contraseña. </Message>
        <div>
          <p class="text-[10px] text-zinc-500 uppercase">Correo de la cuenta</p>
          <p class="font-bold text-white break-all">
            {{ storePerfil.usuarioActual.correoAutenticacion }}
          </p>
        </div>
        <div class="flex justify-end gap-2 mt-2">
          <Button label="Cancelar" text @click="dialogoContrasenaAbierto = false" class="!bg-zinc-900 !border-zinc-700 !text-white" />
          <Button
            label="Enviar enlace"
            :loading="enviandoEnlaceContrasena"
            @click="confirmarCambioContrasena"
            class="!bg-[#D4A843] !border-[#D4A843]"
          />
        </div>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="dialogoCorreoAbierto"
      modal
      header="CAMBIAR CORREO"
      :style="{ width: '90vw', maxWidth: '400px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }"
    >
      <Form
        v-slot="$form"
        class="flex flex-col gap-3"
        :initial-values="valoresInicialesCambioCorreo"
        :resolver="esquemaCambioCorreo"
        @submit="confirmarCambioCorreo"
      >
        <Message severity="info" :closable="false">
          Enviaremos un enlace de confirmación al correo nuevo. El cambio no se aplica hasta que lo abras, después tendrás que iniciar
          sesión de nuevo, y no podrás volver a cambiarlo durante 7 días.
        </Message>
        <label class="text-xs text-zinc-400 uppercase">Nuevo correo</label>
        <InputText
          name="correoNuevo"
          type="email"
          placeholder="nombre@ejemplo.com"
          class="w-full !bg-[#1A1A1F] !border-zinc-700 !text-white"
        />
        <Message v-if="$form.correoNuevo?.invalid" severity="error" size="small" variant="simple" class="ml-1">
          {{ $form.correoNuevo.error.message }}
        </Message>
        <label class="text-xs text-zinc-400 uppercase">Confirma el nuevo correo</label>
        <InputText
          name="correoNuevoConfirmacion"
          type="email"
          placeholder="repite el correo"
          class="w-full !bg-[#1A1A1F] !border-zinc-700 !text-white"
        />
        <Message v-if="$form.correoNuevoConfirmacion?.invalid" severity="error" size="small" variant="simple" class="ml-1">
          {{ $form.correoNuevoConfirmacion.error.message }}
        </Message>
        <label class="text-xs text-zinc-400 uppercase">Contraseña actual</label>
        <Password name="contrasenaActual" :feedback="false" toggleMask inputClass="w-full !bg-[#1A1A1F] !border-zinc-700 !text-white" />
        <Message v-if="$form.contrasenaActual?.invalid" severity="error" size="small" variant="simple" class="ml-1">
          {{ $form.contrasenaActual.error.message }}
        </Message>
        <p class="text-xs text-zinc-500">Podrás volver a cambiarlo dentro de 7 días.</p>
        <div class="flex justify-end gap-2 mt-2">
          <Button label="Cancelar" text @click="dialogoCorreoAbierto = false" class="!bg-zinc-900 !border-zinc-700 !text-white" />
          <Button type="submit" label="Enviar enlace" :loading="enviandoCorreo" class="!bg-[#D4A843] !border-[#D4A843]" />
        </div>
      </Form>
    </Dialog>

    <Dialog
      v-model:visible="dialogoBajaAbierto"
      modal
      header="ELIMINAR CUENTA"
      :style="{ width: '90vw', maxWidth: '400px', border: '1px solid #2A2A32', borderRadius: '0.75rem' }"
    >
      <div class="flex flex-col gap-3">
        <Message severity="error" :closable="false">
          Esta acción es permanente. Se borrarán tus participaciones y las ligas que administres en solitario.
        </Message>
        <label v-if="puedeUsarContrasena" class="text-xs text-zinc-400 uppercase"> Confirma con tu contraseña. </label>
        <Password v-if="puedeUsarContrasena" v-model="contrasenaParaBaja" :feedback="false" toggleMask inputClass="w-full" />
        <div class="flex justify-end gap-2 mt-2">
          <Button label="Cancelar" text @click="dialogoBajaAbierto = false" class="!bg-zinc-900 !border-zinc-700 !text-white" />
          <Button label="Eliminar" :loading="eliminandoCuenta" @click="ejecutarBaja" class="!bg-red-700 !border-red-700" />
        </div>
      </div>
    </Dialog>
  </div>
</template>
