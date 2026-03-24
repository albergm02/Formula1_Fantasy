/**
 * @fileoverview Funciones para manejar errores de autenticación de Firebase y convertirlos en mensajes amigables para el usuario.
 * Esto centraliza la lógica de interpretación de errores y evita repetirla en los componentes.
 * Cada función recibe un error de Firebase y devuelve un string con el mensaje a mostrar.
 */

const INVALID_CREDENTIAL_CODES = [
  'auth/invalid-credential',
  'auth/user-not-found',
  'auth/wrong-password',
]

/**
 * Devuelve un mensaje amigable para errores de login con email/contraseña
 * @param {object} error - Error de Firebase
 * @returns {string} Mensaje para mostrar al usuario
 */
export const getLoginErrorMessage = (error) => {
  if (INVALID_CREDENTIAL_CODES.includes(error?.code)) {
    return 'Correo o contraseña incorrectos.'
  }
  if (error?.code === 'auth/too-many-requests') {
    return 'Demasiados intentos. Inténtalo más tarde.'
  }
  return `Error al iniciar sesión: ${error?.message || 'Error desconocido.'}`
}

/**
 * Devuelve un mensaje amigable para errores de registro con email/contraseña
 * @param {object} error - Error de Firebase
 * @returns {string} Mensaje para mostrar al usuario
 */
export const getRegisterErrorMessage = (error) => {
  if (error?.code === 'auth/email-already-in-use') {
    return 'El correo electrónico ya está registrado.'
  }
  if (error?.code === 'auth/invalid-email') {
    return 'El correo electrónico no es válido.'
  }
  if (error?.code === 'auth/weak-password') {
    return 'La contraseña es demasiado débil.'
  }
  return `Error al registrar: ${error?.message || 'Error desconocido.'}`
}

/**
 * Devuelve un mensaje amigable para errores de login con Google
 * @param {object} error - Error de Firebase
 * @returns {string} Mensaje para mostrar al usuario
 */
export const getGoogleErrorMessage = (error) => {
  return `Error al iniciar con Google: ${error?.message || 'Error desconocido.'}`
}

/**
 * Detecta si el usuario simplemente cerró el popup de Google (no es un error real)
 * @param {object} error - Error de Firebase
 * @returns {boolean} True si el popup fue cerrado por el usuario
 */
export const isGooglePopupClosed = (error) => error?.code === 'auth/popup-closed-by-user'
