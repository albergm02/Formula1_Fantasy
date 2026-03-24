/* Códigos de credenciales inválidas para login */
const INVALID_CREDENTIAL_CODES = [
  'auth/invalid-credential',
  'auth/user-not-found',
  'auth/wrong-password',
]

/**
 * Obtiene un mensaje de error y lo devuelve como cadena.
 * @param {Object} error 
 * @returns {String}
 */
export const getLoginErrorMessage = (error) => {
  // El código corresponde a la constante INVALID_CREDENTIAL_CODES.
  if (INVALID_CREDENTIAL_CODES.includes(error?.code)) { 
    return 'Correo o contraseña incorrectos.'
  }
  // Demasiados intentos de inicio de sesión.
  if (error?.code === 'auth/too-many-requests') {
    return 'Demasiados intentos. Inténtalo más tarde.'
  }
  // Error desconocido
  return `Error al iniciar sesión: ${error?.message || 'Error desconocido.'}` 
}

/**
 * Obtiene un mensaje de error para el registro y lo devuelve como cadena.
 * @param {Object} error
 * @return {String}
 */
export const getRegisterErrorMessage = (error) => {
  // Email en uso
  if (error?.code === 'auth/email-already-in-use') {
    return 'El correo electrónico ya está registrado.'
  }
  // Formato de email inválido
  if (error?.code === 'auth/invalid-email') {
    return 'El correo electrónico no es válido.'
  }
  // Contraseña débil
  if (error?.code === 'auth/weak-password') {
    return 'La contraseña es demasiado débil.'
  }
  // Error desconocido
  return `Error al registrar: ${error?.message || 'Error desconocido.'}`
}

/**
 * Obtiene un mensaje de error para el inicio de sesión con Google y lo devuelve como cadena.
 * @param {Object} error
 * @return {String}
 */
export const getGoogleErrorMessage = (error) => {
  // Error desconocido
  return `Error al iniciar con Google: ${error?.message || 'Error desconocido.'}`
}

/**
 * Verifica si el error corresponde a un cierre de popup de Google.
 * @param {Object} error 
 * @returns {Boolean}
 */
export const isGooglePopupClosed = (error) => error?.code === 'auth/popup-closed-by-user'
