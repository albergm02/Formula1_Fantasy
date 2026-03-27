/**
 * Traduce los códigos de error de Firebase Auth a mensajes legibles para el usuario.
 * @module erroresAutenticacion
 */

const CREDENCIALES_INVALIDAS = [
  'auth/invalid-credential',
  'auth/user-not-found',
  'auth/wrong-password',
]

/**
 * Traduce un error de inicio de sesión con email/contraseña a un mensaje legible.
 * @param {Error} error - El error lanzado por Firebase Auth.
 * @returns {string} Mensaje de error traducido.
 */
export const obtenerMensajeErrorInicioSesion = (error) => {
  if (CREDENCIALES_INVALIDAS.includes(error?.code)) {
    return 'Correo o contraseña incorrectos.'
  }
  if (error?.code === 'auth/too-many-requests') {
    return 'Demasiados intentos. Inténtalo más tarde.'
  }
  return `Error al iniciar sesión: ${error?.message || 'Error desconocido.'}`
}

/**
 * Traduce un error de registro con email/contraseña a un mensaje legible.
 * @param {Error} error - El error lanzado por Firebase Auth.
 * @returns {string} Mensaje de error traducido.
 */
export const obtenerMensajeErrorRegistro = (error) => {
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
 * Traduce un error de inicio de sesión con Google a un mensaje legible.
 * @param {Error} error - El error lanzado por Firebase Auth.
 * @returns {string} Mensaje de error traducido.
 */
export const obtenerMensajeErrorGoogle = (error) => {
  return `Error al iniciar con Google: ${error?.message || 'Error desconocido.'}`
}

/**
 * Determina si el error se debe a que el usuario cerró el popup de Google manualmente.
 * En ese caso no debe mostrarse ningún mensaje de error al usuario.
 * @param {Error} error - El error lanzado por Firebase Auth.
 * @returns {boolean} true si el usuario cerró el popup.
 */
export const popupGoogleCerrado = (error) => error?.code === 'auth/popup-closed-by-user'
