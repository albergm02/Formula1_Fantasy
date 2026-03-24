/**
 * @fileoverview Funciones de utilidad para manejo de texto, como trim, validación de email y normalización de campos.
 * Estas funciones se utilizan en varios lugares de la aplicación para asegurar que el texto ingresado por el usuario
 * esté limpio y en el formato esperado, evitando errores comunes relacionados con espacios sobrantes o formatos incorrectos.
 * Esto centraliza la lógica de manejo de texto y evita repetirla en los componentes.
 */

/**
 * Quita espacios sobrantes de un texto (maneja nulos)
 * @param {string} value - Texto a limpiar
 * @returns {string} Texto limpio
 */
export const trimText = (value = '') => String(value ?? '').trim()

/**
 * Convierte un texto a mayúsculas y le aplica trim (maneja nulos)
 * @param {string} value - Texto a convertir
 * @returns {string} Texto convertido a mayúsculas y limpio
 */
export const toUpperTrimmed = (value = '') => trimText(value).toUpperCase()

/**
 * Valida formato básico de email
 * @param {string} email - Email a validar
 * @returns {boolean} True si el email es válido, false en caso contrario
 */
export const isValidEmail = (email = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimText(email))

/**
 * Normaliza campos de texto en un objeto, aplicando trim a los campos especificados
 * @param {object} values - Objeto con los valores a normalizar
 * @param {string[]} fields - Array de nombres de campos a normalizar
 * @returns {object} Nuevo objeto con los campos normalizados
 */
export const normalizeTextFields = (values = {}, fields = []) => {
  const normalizedValues = { ...values }

  fields.forEach((field) => {
    normalizedValues[field] = trimText(normalizedValues[field])
  })

  return normalizedValues
}
