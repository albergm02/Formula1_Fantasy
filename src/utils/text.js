/**
 * Utilidades para manipulación de texto, validación de correos electrónicos y normalización de campos de texto.
 * @module utils/text
 */

/**
 * Elimina los espacios en blanco al inicio y al final de un texto.
 * @param {*} value - El valor a procesar.
 * @returns {string} El texto sin espacios en blanco al inicio y al final.
 */
export const trimText = (value = '') => String(value ?? '').trim()
  
/**
 * Convierte un texto a mayúsculas y elimina los espacios en blanco al inicio y al final.
 * @param {*} value - El valor a procesar.
 * @returns {string} El texto en mayúsculas y sin espacios en blanco al inicio y al final.
 */
export const toUpperTrimmed = (value = '') => trimText(value).toUpperCase()

/**
 * Verifica si un correo electrónico es válido.
 * @param {string} email - El correo electrónico a validar.
 * @returns {boolean} Retorna true si el correo electrónico es válido, de lo contrario retorna false.
 */ 
export const isValidEmail = (email = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimText(email))

/**
 * Normaliza los campos de texto especificados en un objeto, eliminando los espacios en blanco al inicio y al final.
 * @param {Object} values - Un objeto con los valores a normalizar.
 * @param {Array} fields - Un array con los nombres de los campos a normalizar.
 * @returns {Object} Un nuevo objeto con los campos normalizados.
 */
export const normalizeTextFields = (values = {}, fields = []) => {
  const normalizedValues = { ...values }

  fields.forEach((field) => {
    normalizedValues[field] = trimText(normalizedValues[field])
  })

  return normalizedValues
}
