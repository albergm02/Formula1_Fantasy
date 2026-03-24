const INVALID_CREDENTIAL_CODES = [
  'auth/invalid-credential',
  'auth/user-not-found',
  'auth/wrong-password',
]

export const getLoginErrorMessage = (error) => {
  if (INVALID_CREDENTIAL_CODES.includes(error?.code)) {
    return 'Correo o contraseña incorrectos.'
  }

  if (error?.code === 'auth/too-many-requests') {
    return 'Demasiados intentos. Inténtalo más tarde.'
  }

  return `Error al iniciar sesión: ${error?.message || 'Error desconocido.'}`
}

export const getRegisterErrorMessage = (error) => {
  if (error?.code === 'auth/email-already-in-use') {
    return 'El correo electrónico ya está registrado.'
  }

  if (error?.code === 'auth/weak-password') {
    return 'La contraseña es demasiado débil.'
  }

  return `Error al registrar: ${error?.message || 'Error desconocido.'}`
}

export const getGoogleErrorMessage = (error) => {
  return `Error al iniciar con Google: ${error?.message || 'Error desconocido.'}`
}

export const isGooglePopupClosed = (error) => error?.code === 'auth/popup-closed-by-user'
