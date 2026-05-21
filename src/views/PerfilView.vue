<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usarStoreAutenticacion } from '@/stores/storeAutenticacion'
import { auth } from '@/services/servicioFirebase'

import {
    cargarPerfilUsuario,
    reautenticarUsuario,
    cambiarContrasenaUsuario,
    cerrarSesion,
} from '@/services/servicioAutenticacion'
import {
    cambiarNombreUsuario,
    eliminarMiCuenta,
} from '@/services/servicioPerfil'

import Cabecera from '@/components/Cabecera.vue'

import Card from 'primevue/card'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Message from 'primevue/message'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const router = useRouter()
const storeAutenticacion = usarStoreAutenticacion()
const toast = useToast()
const confirm = useConfirm()

// Devuelve password ó google.com u otro proveedor según cómo inició sesión el usuario
const proveedorAutenticacion = computed(() => {
    return auth.currentUser?.providerData[0]?.providerId || 'password'
})

// Metadatos del perfil para gestionar restricciones de cambios
const fechaUltimoCambioNombre = ref(null)
const diasRestantesParaCambiarNombre = computed(() => {
    if (!fechaUltimoCambioNombre.value) return 0
    // Calcula días transcurridos desde el último cambio de nombre, 86_400_000 ms = 1 día
    const transcurridos = (Date.now() - fechaUltimoCambioNombre.value.getTime()) / 86_400_000
    return Math.max(0, Math.ceil(30 - transcurridos))
})

async function cargarMetadatosPerfil() {
    const datos = await cargarPerfilUsuario(storeAutenticacion.usuarioActual.correoAutenticacion)
    fechaUltimoCambioNombre.value =
        datos.fechaUltimoCambioNombre ? new Date(datos.fechaUltimoCambioNombre) : null
}

onMounted(cargarMetadatosPerfil)


const dialogoNombreAbierto = ref(false)
const nombreNuevo = ref('')
const guardandoNombre = ref(false)

function abrirDialogoNombre() {
    nombreNuevo.value = storeAutenticacion.usuarioActual.nombreVisible
    dialogoNombreAbierto.value = true
}

async function confirmarCambioNombre() {
    guardandoNombre.value = true
    try {
        const datos = await cambiarNombreUsuario(nombreNuevo.value.trim())
        storeAutenticacion.usuarioActual.nombreVisible = datos.nombre
        fechaUltimoCambioNombre.value = new Date()
        dialogoNombreAbierto.value = false
        toast.add({
            severity: 'success',
            summary: 'Nombre actualizado',
            detail: `Ahora apareces como "${datos.nombre}".`,
            life: 4000,
        })
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'No se pudo cambiar',
            detail: error.message,
            life: 6000,
        })
    } finally {
        guardandoNombre.value = false
    }
}

// CAMBIO DE CONTRASEÑA

const dialogoContrasenaAbierto = ref(false)
const contrasenaActual = ref('')
const contrasenaNueva = ref('')
const contrasenaRepetida = ref('')
const guardandoContrasena = ref(false)

function abrirDialogoContrasena() {
    contrasenaActual.value = ''
    contrasenaNueva.value = ''
    contrasenaRepetida.value = ''
    dialogoContrasenaAbierto.value = true
}

async function confirmarCambioContrasena() {
    if (contrasenaNueva.value.length < 6) {
        toast.add({
            severity: 'warn',
            summary: 'Contraseña débil',
            detail: 'Mínimo 6 caracteres.',
            life: 4000,
        })
        return
    }
    if (contrasenaNueva.value !== contrasenaRepetida.value) {
        toast.add({
            severity: 'warn',
            summary: 'No coinciden',
            detail: 'Repite la contraseña correctamente.',
            life: 4000,
        })
        return
    }
    guardandoContrasena.value = true
    try {
        await reautenticarUsuario(contrasenaActual.value)
        await cambiarContrasenaUsuario(contrasenaNueva.value)
        dialogoContrasenaAbierto.value = false
        toast.add({
            severity: 'success',
            summary: 'Contraseña actualizada',
            detail: 'La próxima vez que inicies sesión, usa la nueva contraseña.',
            life: 5000,
        })
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'No se pudo cambiar',
            detail: mensajeFirebase(error),
            life: 6000,
        })
    } finally {
        guardandoContrasena.value = false
    }
}

// ELIMINACIÓN DE CUENTA

const dialogoBajaAbierto = ref(false)
const contrasenaParaBaja = ref('')
const eliminandoCuenta = ref(false)

function abrirDialogoBaja() {
    contrasenaParaBaja.value = ''
    dialogoBajaAbierto.value = true
}

function pedirConfirmacionBaja() {
    confirm.require({
        message:
            'Esta acción borrará tu cuenta, todas tus participaciones y las ligas que administres en solitario. No se puede deshacer.',
        header: '¿Eliminar tu cuenta?',
        acceptLabel: 'Sí, eliminar',
        rejectLabel: 'Cancelar',
        acceptClass: '!bg-red-600 !border-red-600 !text-white',
        rejectClass: '!bg-zinc-700 !border-zinc-700 !text-white',
        accept: ejecutarBaja,
    })
}

async function ejecutarBaja() {
    eliminandoCuenta.value = true
    try {
        await reautenticarUsuario(contrasenaParaBaja.value)
        await eliminarMiCuenta()
        await cerrarSesion()
        toast.add({
            severity: 'success',
            summary: 'Cuenta eliminada correctamente.',
            detail: '¡Hasta pronto!',
            life: 5000,
        })
        storeAutenticacion.limpiarSesion()
        router.push({ name: 'login' })
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'No se pudo eliminar su cuenta.',
            detail: mensajeFirebase(error),
            life: 7000,
        })
    } finally {
        eliminandoCuenta.value = false
        dialogoBajaAbierto.value = false
    }
}

function mensajeFirebase(error) {
    const codigo = error?.code || ''
    if (codigo === 'auth/wrong-password' || codigo === 'auth/invalid-credential') {
        return 'Contraseña introducida incorrecta.'
    }
    if (codigo === 'auth/email-already-in-use') {
        return 'Ese correo ya está en uso por otra cuenta.'
    }
    if (codigo === 'auth/requires-recent-login') {
        return 'Por seguridad, vuelve a iniciar sesión antes de hacer este cambio.'
    }
    return error?.message || 'Error desconocido.'
}
</script>

<template>
    <div class="min-h-screen bg-[#0F0F12] text-[#F0ECEC] pb-24">
        <Cabecera />
        <Toast />
        <ConfirmDialog />

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
                                {{ storeAutenticacion.usuarioActual.nombreVisible }}
                            </p>
                        </div>
                        <div>
                            <p class="text-[10px] text-zinc-500 uppercase">Correo asociado</p>
                            <p class="font-bold text-white break-all">
                                {{ storeAutenticacion.usuarioActual.correoAutenticacion }}
                            </p>
                        </div>
                        <div>
                            <p class="text-[10px] text-zinc-500 uppercase">Ligas activas</p>
                            <p class="font-bold text-white">
                                {{ storeAutenticacion.usuarioActual.idsLigas.length }}
                            </p>
                        </div>
                        <div>
                            <p class="text-[10px] text-zinc-500 uppercase">Próximo cambio de nombre</p>
                            <p class="font-bold text-white">
                                {{ diasRestantesParaCambiarNombre === 0
                                    ? 'Cambio disponible'
                                    : `En ${diasRestantesParaCambiarNombre} días` }}
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
                        <Button @click="abrirDialogoNombre" label="Cambiar nombre de usuario"
                            class="!bg-zinc-900 !border-zinc-700 !text-white justify-center"
                            :disabled="diasRestantesParaCambiarNombre > 0" />
                        <Button v-if="proveedorAutenticacion !== 'google.com'" @click="abrirDialogoContrasena"
                            label="Cambiar contraseña"
                            class="!bg-zinc-900 !border-zinc-700 !text-white justify-center" />
                        <Message v-if="proveedorAutenticacion === 'google.com'" severity="info" :closable="false">
                            Iniciaste sesión con Google: gestiona tu contraseña desde tu cuenta de Google.
                        </Message>
                        <Button @click="abrirDialogoBaja" icon="pi pi-trash" label="Eliminar mi cuenta"
                            class="!bg-red-700 !border-red-700 !text-white justify-center mt-5" />
                    </div>
                </template>
            </Card>
        </main>

        <!-- Diálogo cambio de nombre de usuario -->
        <Dialog v-model:visible="dialogoNombreAbierto" modal header="Cambiar nombre de usuario"
            :style="{ width: '90vw', maxWidth: '420px' }"
            :pt="{ root: { class: '!bg-[#1A1A1F] !text-white border border-zinc-700' } }">
            <div class="flex flex-col gap-3">
                <label class="text-xs text-zinc-400 uppercase">Nuevo nombre de usuario</label>
                <InputText v-model="nombreNuevo" maxlength="10" minlength="3" placeholder="3-10 caracteres" />
                <p class="text-xs text-zinc-500">
                    Podrás volver a cambiarlo dentro de 30 días.
                </p>
                <div class="flex justify-end gap-2 mt-2">
                    <Button label="Cancelar" text @click="dialogoNombreAbierto = false"
                        class="!bg-zinc-900 !border-zinc-700 !text-white" />
                    <Button label="Guardar" :loading="guardandoNombre" @click="confirmarCambioNombre"
                        class="!bg-[#D4A843] !border-[#D4A843]" />
                </div>
            </div>
        </Dialog>

        <!-- Diálogo cambio de contraseña -->
        <Dialog v-model:visible="dialogoContrasenaAbierto" modal header="Cambiar contraseña"
            :style="{ width: '90vw', maxWidth: '420px' }"
            :pt="{ root: { class: '!bg-[#1A1A1F] !text-white border border-zinc-700' } }">
            <div class="flex flex-col gap-3">
                <label class="text-xs text-zinc-400 uppercase">Contraseña actual</label>
                <Password v-model="contrasenaActual" :feedback="false" toggleMask inputClass="w-full" />
                <label class="text-xs text-zinc-400 uppercase">Nueva contraseña</label>
                <Password v-model="contrasenaNueva" toggleMask inputClass="w-full" :feedback="false" />
                <label class="text-xs text-zinc-400 uppercase">Repite la nueva contraseña</label>
                <Password v-model="contrasenaRepetida" :feedback="false" toggleMask inputClass="w-full" />
                <div class="flex justify-end gap-2 mt-2">
                    <Button label="Cancelar" text @click="dialogoContrasenaAbierto = false"
                        class="!bg-zinc-900 !border-zinc-700 !text-white" />
                    <Button label="Cambiar" :loading="guardandoContrasena" @click="confirmarCambioContrasena"
                        class="!bg-[#D4A843] !border-[#D4A843]" />
                </div>
            </div>
        </Dialog>

        <!-- Diálogo baja -->
        <Dialog v-model:visible="dialogoBajaAbierto" modal header="Eliminar cuenta"
            :style="{ width: '90vw', maxWidth: '420px' }"
            :pt="{ root: { class: '!bg-[#1A1A1F] !text-white border border-red-700' } }">
            <div class="flex flex-col gap-3">
                <Message severity="error" :closable="false">
                    Esta acción es permanente. Se borrarán tus participaciones y las ligas que administres en solitario.
                </Message>
                <label v-if="proveedorAutenticacion !== 'google.com'" class="text-xs text-zinc-400 uppercase">
                    Confirma con tu contraseña.
                </label>
                <Password v-if="proveedorAutenticacion !== 'google.com'" v-model="contrasenaParaBaja" :feedback="false"
                    toggleMask inputClass="w-full" />
                <div class="flex justify-end gap-2 mt-2">
                    <Button label="Cancelar" text @click="dialogoBajaAbierto = false"
                        class="!bg-zinc-900 !border-zinc-700 !text-white" />
                    <Button label="Eliminar" :loading="eliminandoCuenta" @click="pedirConfirmacionBaja"
                        class="!bg-red-700 !border-red-700" />
                </div>
            </div>
        </Dialog>
    </div>
</template>
