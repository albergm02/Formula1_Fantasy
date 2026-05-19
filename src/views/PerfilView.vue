<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usarStoreAutenticacion } from '@/stores/storeAutenticacion'
import { auth } from '@/services/servicioFirebase'
import {
    cargarPerfilUsuario,
    reautenticarUsuario,
    cambiarContrasenaUsuario,
    cambiarCorreoUsuario,
    cerrarSesion,
} from '@/services/servicioAutenticacion'
import {
    cambiarNombreUsuario,
    migrarCorreoUsuario,
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

const enrutador = useRouter()
const storeAutenticacion = usarStoreAutenticacion()
const toast = useToast()
const confirm = useConfirm()

const proveedorAutenticacion = computed(() => {
    return auth.currentUser?.providerData[0]?.providerId || 'password'
})

const fechaUltimoCambioNombre = ref(null)
const diasRestantesParaCambiarNombre = computed(() => {
    if (!fechaUltimoCambioNombre.value) return 0
    const transcurridos = (Date.now() - fechaUltimoCambioNombre.value.getTime()) / 86_400_000
    return Math.max(0, Math.ceil(30 - transcurridos))
})

async function cargarMetadatosPerfil() {
    const datos = await cargarPerfilUsuario(storeAutenticacion.usuarioActual.correoAutenticacion)
    fechaUltimoCambioNombre.value =
        datos.fechaUltimoCambioNombre ? new Date(datos.fechaUltimoCambioNombre) : null
}

onMounted(cargarMetadatosPerfil)

/* ─── Cambio de nombre ─────────────────────────────────────────────── */

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

/* ─── Cambio de contraseña ─────────────────────────────────────────── */

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

/* ─── Cambio de correo ─────────────────────────────────────────────── */

const dialogoCorreoAbierto = ref(false)
const contrasenaParaCorreo = ref('')
const correoNuevo = ref('')
const guardandoCorreo = ref(false)

function abrirDialogoCorreo() {
    contrasenaParaCorreo.value = ''
    correoNuevo.value = ''
    dialogoCorreoAbierto.value = true
}

async function confirmarCambioCorreo() {
    const correoNormalizado = correoNuevo.value.trim().toLowerCase()
    const correoAnterior = storeAutenticacion.usuarioActual.correoAutenticacion
    if (!correoNormalizado || correoNormalizado === correoAnterior) {
        toast.add({
            severity: 'warn',
            summary: 'Correo inválido',
            detail: 'Debe ser distinto del actual.',
            life: 4000,
        })
        return
    }
    guardandoCorreo.value = true
    try {
        await reautenticarUsuario(contrasenaParaCorreo.value)
        await cambiarCorreoUsuario(correoNormalizado)
        await migrarCorreoUsuario(correoAnterior, correoNormalizado)
        storeAutenticacion.usuarioActual.correoAutenticacion = correoNormalizado
        dialogoCorreoAbierto.value = false
        toast.add({
            severity: 'success',
            summary: 'Correo actualizado',
            detail: 'Te hemos enviado un enlace de verificación al nuevo correo.',
            life: 6000,
        })
        await cerrarSesion()
        enrutador.push({ name: 'login' })
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'No se pudo cambiar',
            detail: mensajeFirebase(error),
            life: 7000,
        })
    } finally {
        guardandoCorreo.value = false
    }
}

/* ─── Baja de cuenta ────────────────────────────────────────────────── */

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
            'Esta acción borrará tu cuenta, todas tus participaciones y las ligas que administres en solitario. NO se puede deshacer.',
        header: '¿Eliminar tu cuenta?',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, eliminar',
        rejectLabel: 'Cancelar',
        acceptClass: '!bg-red-700 !border-red-700',
        accept: ejecutarBaja,
    })
}

async function ejecutarBaja() {
    eliminandoCuenta.value = true
    try {
        await reautenticarUsuario(contrasenaParaBaja.value)
        await eliminarMiCuenta()
        toast.add({
            severity: 'success',
            summary: 'Cuenta eliminada',
            detail: 'Hasta pronto.',
            life: 5000,
        })
        storeAutenticacion.limpiarSesion()
        enrutador.push({ name: 'login' })
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'No se pudo eliminar',
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
        return 'Contraseña incorrecta.'
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
            <h1 class="text-2xl font-black uppercase tracking-tight">
                Tu <span class="text-[#E10600]">perfil</span>
            </h1>

            <Card class="!bg-[#1A1A1F] !text-[#F0ECEC] border border-zinc-800">
                <template #title>
                    <div class="flex items-center gap-2 text-sm">
                        <i class="pi pi-user text-[#E10600]" />
                        <span>Datos de la cuenta</span>
                    </div>
                </template>
                <template #content>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p class="text-[10px] text-zinc-500 uppercase">Nombre visible</p>
                            <p class="font-bold text-white">
                                {{ storeAutenticacion.usuarioActual.nombreVisible }}
                            </p>
                        </div>
                        <div>
                            <p class="text-[10px] text-zinc-500 uppercase">Correo</p>
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
                                    ? 'Disponible'
                                    : `En ${diasRestantesParaCambiarNombre} días` }}
                            </p>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="!bg-[#1A1A1F] !text-[#F0ECEC] border border-zinc-800">
                <template #title>
                    <div class="flex items-center gap-2 text-sm">
                        <i class="pi pi-cog text-[#E10600]" />
                        <span>Editar perfil</span>
                    </div>
                </template>
                <template #content>
                    <div class="flex flex-col gap-2">
                        <Button @click="abrirDialogoNombre" icon="pi pi-id-card" label="Cambiar nombre visible"
                            class="!bg-zinc-900 !border-zinc-700 justify-start"
                            :disabled="diasRestantesParaCambiarNombre > 0" />
                        <Button v-if="proveedorAutenticacion !== 'google.com'" @click="abrirDialogoContrasena"
                            icon="pi pi-lock" label="Cambiar contraseña"
                            class="!bg-zinc-900 !border-zinc-700 justify-start" />
                        <Button v-if="proveedorAutenticacion !== 'google.com'" @click="abrirDialogoCorreo"
                            icon="pi pi-envelope" label="Cambiar correo"
                            class="!bg-zinc-900 !border-zinc-700 justify-start" />
                        <Message v-if="proveedorAutenticacion === 'google.com'" severity="info" :closable="false">
                            Iniciaste sesión con Google: gestiona tu contraseña y correo desde tu cuenta de Google.
                        </Message>
                    </div>
                </template>
            </Card>

            <Card class="!bg-[#1A1A1F] !text-[#F0ECEC] border border-red-900/60">
                <template #title>
                    <div class="flex items-center gap-2 text-sm">
                        <i class="pi pi-exclamation-triangle text-red-500" />
                        <span>Zona de peligro</span>
                    </div>
                </template>
                <template #content>
                    <p class="text-xs text-zinc-400 mb-3">
                        Al eliminar tu cuenta se borrarán todas tus participaciones, tus pujas activas y las ligas
                        de las que seas único administrador.
                    </p>
                    <Button @click="abrirDialogoBaja" icon="pi pi-trash" label="Eliminar mi cuenta"
                        class="!bg-red-700 !border-red-700" />
                </template>
            </Card>
        </main>

        <!-- Diálogo cambio de nombre -->
        <Dialog v-model:visible="dialogoNombreAbierto" modal header="Cambiar nombre visible"
            :style="{ width: '90vw', maxWidth: '420px' }"
            :pt="{ root: { class: '!bg-[#1A1A1F] !text-white border border-zinc-700' } }">
            <div class="flex flex-col gap-3">
                <label class="text-xs text-zinc-400 uppercase">Nuevo nombre</label>
                <InputText v-model="nombreNuevo" maxlength="20" placeholder="3-20 caracteres, letras números _" />
                <p class="text-[11px] text-zinc-500">
                    Solo letras, números y guion bajo. Podrás volver a cambiarlo dentro de 30 días.
                </p>
                <div class="flex justify-end gap-2 mt-2">
                    <Button label="Cancelar" text @click="dialogoNombreAbierto = false" />
                    <Button label="Guardar" :loading="guardandoNombre" @click="confirmarCambioNombre"
                        class="!bg-[#E10600] !border-[#E10600]" />
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
                <Password v-model="contrasenaNueva" toggleMask inputClass="w-full" />
                <label class="text-xs text-zinc-400 uppercase">Repite la nueva contraseña</label>
                <Password v-model="contrasenaRepetida" :feedback="false" toggleMask inputClass="w-full" />
                <div class="flex justify-end gap-2 mt-2">
                    <Button label="Cancelar" text @click="dialogoContrasenaAbierto = false" />
                    <Button label="Cambiar" :loading="guardandoContrasena" @click="confirmarCambioContrasena"
                        class="!bg-[#E10600] !border-[#E10600]" />
                </div>
            </div>
        </Dialog>

        <!-- Diálogo cambio de correo -->
        <Dialog v-model:visible="dialogoCorreoAbierto" modal header="Cambiar correo"
            :style="{ width: '90vw', maxWidth: '460px' }"
            :pt="{ root: { class: '!bg-[#1A1A1F] !text-white border border-zinc-700' } }">
            <div class="flex flex-col gap-3">
                <Message severity="warn" :closable="false">
                    Tras cambiar el correo se cerrará tu sesión y deberás verificar el nuevo enlace que te enviemos.
                </Message>
                <label class="text-xs text-zinc-400 uppercase">Contraseña actual</label>
                <Password v-model="contrasenaParaCorreo" :feedback="false" toggleMask inputClass="w-full" />
                <label class="text-xs text-zinc-400 uppercase">Nuevo correo</label>
                <InputText v-model="correoNuevo" type="email" placeholder="tu.nuevo@correo.com" />
                <div class="flex justify-end gap-2 mt-2">
                    <Button label="Cancelar" text @click="dialogoCorreoAbierto = false" />
                    <Button label="Cambiar" :loading="guardandoCorreo" @click="confirmarCambioCorreo"
                        class="!bg-[#E10600] !border-[#E10600]" />
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
                    Confirma con tu contraseña
                </label>
                <Password v-if="proveedorAutenticacion !== 'google.com'" v-model="contrasenaParaBaja" :feedback="false"
                    toggleMask inputClass="w-full" />
                <div class="flex justify-end gap-2 mt-2">
                    <Button label="Cancelar" text @click="dialogoBajaAbierto = false" />
                    <Button label="Eliminar" :loading="eliminandoCuenta" @click="pedirConfirmacionBaja"
                        class="!bg-red-700 !border-red-700" />
                </div>
            </div>
        </Dialog>
    </div>
</template>
