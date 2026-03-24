/**
 * Utilidades para limpiar y normalizar texto antes de enviarlo a Firebase.
 *
 * Antes de guardar cualquier dato de texto en Firestore (nombres, códigos, emails...)
 * es importante sanearlo: quitar espacios accidentales, unificar mayúsculas, etc.
 * Agrupa aquí todas las operaciones de este tipo para no duplicarlas en stores y componentes.
 */

/**
 * Elimina los espacios en blanco al inicio y al final de un texto.
 *
 * Es la operación más básica de saneamiento. Casi siempre querrás aplicarla
 * a cualquier input antes de guardarlo en Firestore.
 *
 * @param {*} [value=''] - El valor a limpiar (se convierte a string si no lo es).
 * @returns {string} El texto sin espacios sobrantes.
 *
 * @example
 * trimText('  hamilton  ')  // → 'hamilton'
 * trimText(null)            // → ''  (maneja valores nulos con seguridad)
 */
export const trimText = (value = '') => String(value ?? '').trim()

/**
 * Convierte un texto a mayúsculas y elimina los espacios sobrantes.
 *
 * Útil para códigos de invitación de ligas o valores que deben guardarse
 * en mayúsculas para evitar duplicados por diferencia de capitalización.
 *
 * @param {*} [value=''] - El valor a procesar.
 * @returns {string} El texto en mayúsculas y sin espacios sobrantes.
 *
 * @example
 * toUpperTrimmed('  a3f9kz  ')  // → 'A3F9KZ'
 */
export const toUpperTrimmed = (value = '') => trimText(value).toUpperCase()

/**
 * Comprueba si una cadena tiene formato de correo electrónico válido.
 *
 * Usa una expresión regular básica: verifica que haya texto, un @, un dominio
 * y una extensión. No realiza verificación de existencia real del correo.
 * Limpia espacios antes de validar.
 *
 * @param {string} [email=''] - El correo a validar.
 * @returns {boolean} `true` si el formato es correcto.
 *
 * @example
 * isValidEmail('lewis@mercedes.com')  // → true
 * isValidEmail('no-es-un-email')       // → false
 */
export const isValidEmail = (email = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimText(email))

/**
 * Aplica `trimText` a un conjunto específico de campos dentro de un objeto.
 *
 * Úsala justo antes de enviar un formulario a Firebase para sanear todos
 * los campos de texto de golpe, sin tener que llamar a trimText campo por campo.
 * No modifica el objeto original (devuelve una copia).
 *
 * @param {Object} [values={}] - Objeto con los datos del formulario.
 * @param {string[]} [fields=[]] - Nombres de los campos que se deben limpiar.
 * @returns {Object} Copia del objeto con los campos indicados ya saneados.
 *
 * @example
 * const datos = { nombre: '  Max ', email: ' max@rb.com ', edad: 26 }
 * normalizeTextFields(datos, ['nombre', 'email'])
 * // → { nombre: 'Max', email: 'max@rb.com', edad: 26 }
 */
export const normalizeTextFields = (values = {}, fields = []) => {
  const normalizedValues = { ...values }

  fields.forEach((field) => {
    normalizedValues[field] = trimText(normalizedValues[field])
  })

  return normalizedValues
}
