/**
 * Traduce los códigos de error de Firebase Authentication a mensajes legibles para el usuario.
 *
 * Firebase lanza errores con códigos técnicos como 'auth/user-not-found' que el usuario
 * no entendería. Este módulo los convierte en frases claras en español para mostrar
 * en la UI mediante toasts o mensajes de formulario.
 *
 * Uso: importa la función correspondiente según el flujo (login, registro, Google)
 * y pásale el error capturado en el catch.
 */

/**
 * Agrupa los códigos de Firebase que significan "combinación email/contraseña incorrecta".
 * Firebase puede devolver cualquiera de estos tres según la versión del SDK,
 * por eso los tratamos como equivalentes mostrando un único mensaje genérico
 * (evita indicar al atacante si el email existe o no — seguridad por oscuridad).
 */
const INVALID_CREDENTIAL_CODES = [
  'auth/invalid-credential',
  'auth/user-not-found',
  'auth/wrong-password',
]

/**
 * Traduce un error de inicio de sesión con email/contraseña a un mensaje amigable.
 *
 * Úsala en el catch del flujo de login para mostrar al usuario qué salió mal
 * sin revelar si el email existe o no en la base de datos.
 *
 * @param {Object} error - El objeto de error lanzado por Firebase.
 * @param {string} error.code - Código de error de Firebase (ej: 'auth/wrong-password').
 * @returns {string} Mensaje en español listo para mostrar en la UI.
 *
 * @example
 * try {
 *   await signInWithEmailAndPassword(auth, email, password)
 * } catch (error) {
 *   mensajeError.value = getLoginErrorMessage(error)
 * }
 */
export const getLoginErrorMessage = (error) => {
  // Credenciales incorrectas: agrupamos varios códigos en un mensaje genérico
  // para no revelar si el email está registrado o no (protección ante enumeración de usuarios)
  if (INVALID_CREDENTIAL_CODES.includes(error?.code)) {
    return 'Correo o contraseña incorrectos.'
  }
  // Firebase bloquea temporalmente la cuenta tras demasiados intentos fallidos
  if (error?.code === 'auth/too-many-requests') {
    return 'Demasiados intentos. Inténtalo más tarde.'
  }
  // Fallback para cualquier otro error no contemplado
  return `Error al iniciar sesión: ${error?.message || 'Error desconocido.'}`
}

/**
 * Traduce un error de creación de cuenta (registro) a un mensaje amigable.
 *
 * Úsala en el catch del flujo de registro para informar al usuario del motivo
 * concreto por el que no se pudo crear su cuenta.
 *
 * @param {Object} error - El objeto de error lanzado por Firebase.
 * @param {string} error.code - Código de error de Firebase.
 * @returns {string} Mensaje en español listo para mostrar en la UI.
 */
export const getRegisterErrorMessage = (error) => {
  // El correo ya tiene una cuenta creada en Firebase
  if (error?.code === 'auth/email-already-in-use') {
    return 'El correo electrónico ya está registrado.'
  }
  // El formato del correo no es válido (ej: le falta el @)
  if (error?.code === 'auth/invalid-email') {
    return 'El correo electrónico no es válido.'
  }
  // La contraseña no cumple el mínimo de seguridad de Firebase (6 caracteres)
  if (error?.code === 'auth/weak-password') {
    return 'La contraseña es demasiado débil.'
  }
  // Fallback para cualquier otro error no contemplado
  return `Error al registrar: ${error?.message || 'Error desconocido.'}`
}

/**
 * Traduce un error del inicio de sesión con Google a un mensaje amigable.
 *
 * Úsala en el catch del flujo de signInWithPopup de Google.
 * Para el caso específico de popup cerrado por el usuario, usa isGooglePopupClosed()
 * antes de llamar a esta función, ya que ese caso normalmente no requiere mostrar error.
 *
 * @param {Object} error - El objeto de error lanzado por Firebase.
 * @returns {string} Mensaje en español listo para mostrar en la UI.
 */
export const getGoogleErrorMessage = (error) => {
  return `Error al iniciar con Google: ${error?.message || 'Error desconocido.'}`
}

/**
 * Detecta si el error se produjo porque el usuario cerró el popup de Google manualmente.
 *
 * Esto NO es un error real — el usuario simplemente canceló el proceso.
 * Úsala para evitar mostrar un toast de error innecesario en ese caso.
 *
 * @param {Object} error - El objeto de error lanzado por Firebase.
 * @returns {boolean} `true` si el usuario cerró el popup voluntariamente.
 *
 * @example
 * } catch (error) {
 *   if (!isGooglePopupClosed(error)) {
 *     toast.add({ severity: 'error', detail: getGoogleErrorMessage(error) })
 *   }
 * }
 */
export const isGooglePopupClosed = (error) => error?.code === 'auth/popup-closed-by-user'
