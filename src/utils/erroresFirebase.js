/**
 * Traduce códigos de error de Firebase Auth a mensajes legibles en español.
 * @param {Error} error
 * @returns {string}
 */
export function mensajeErrorFirebase(error) {
  const codigo = error?.code || ''
  if (codigo === 'auth/wrong-password' || codigo === 'auth/invalid-credential')
    return 'Contraseña introducida incorrecta.'
  if (codigo === 'auth/email-already-in-use') return 'Ese correo ya está en uso por otra cuenta.'
  if (codigo === 'auth/invalid-email') return 'El correo introducido no tiene un formato válido.'
  if (codigo === 'auth/weak-password') return 'La contraseña es demasiado débil.'
  if (codigo === 'auth/requires-recent-login')
    return 'Por seguridad, vuelve a iniciar sesión antes de hacer este cambio.'
  return error?.message || 'Error desconocido.'
}
