// Traduce errores de Firebase Auth a mensajes legibles para el usuario

const CREDENCIALES_INVALIDAS = [
  'auth/invalid-credential',
  'auth/user-not-found',
  'auth/wrong-password',
]

// Login con email/contraseÃ±a
export const obtenerMensajeErrorInicioSesion = (error) => {
  if (CREDENCIALES_INVALIDAS.includes(error?.code)) {
    return 'Correo o contraseÃ±a incorrectos.'
  }
  if (error?.code === 'auth/too-many-requests') {
    return 'Demasiados intentos. IntÃ©ntalo mÃ¡s tarde.'
  }
  return `Error al iniciar sesiÃ³n: ${error?.message || 'Error desconocido.'}`
}

// Registro con email/contraseÃ±a
export const obtenerMensajeErrorRegistro = (error) => {
  if (error?.code === 'auth/email-already-in-use') {
    return 'El correo electrÃ³nico ya estÃ¡ registrado.'
  }
  if (error?.code === 'auth/invalid-email') {
    return 'El correo electrÃ³nico no es vÃ¡lido.'
  }
  if (error?.code === 'auth/weak-password') {
    return 'La contraseÃ±a es demasiado dÃ©bil.'
  }
  return `Error al registrar: ${error?.message || 'Error desconocido.'}`
}

// Login con Google
export const obtenerMensajeErrorGoogle = (error) => {
  return `Error al iniciar con Google: ${error?.message || 'Error desconocido.'}`
}

// El usuario cerrÃ³ el popup de Google (no es un error real)
export const popupGoogleCerrado = (error) => error?.code === 'auth/popup-closed-by-user'

