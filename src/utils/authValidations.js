/**
 * Esquemas de validación para los formularios de autenticación.
 *
 * Utiliza Zod para definir las reglas de cada campo. Estos esquemas se conectan
 * directamente con `@primevue/forms` para validar en tiempo real antes de enviar
 * los datos a Firebase.
 *
 * Uso: importa el schema que necesites y pásalo al resolver del formulario.
 * @see https://zod.dev
 */
import { z } from 'zod'

/**
 * Valida el nombre de usuario que el jugador elige al registrarse con Google.
 *
 * Reglas:
 * - Mínimo 3 caracteres (para evitar nombres vacíos o demasiado cortos).
 * - Máximo 10 caracteres (límite de visualización en el ranking y cabecera).
 * - Se elimina automáticamente el espacio al inicio y al final.
 *
 * @example
 * const resultado = usernameSchema.safeParse('Max10')
 * // { success: true, data: 'Max10' }
 *
 * const error = usernameSchema.safeParse('Ab')
 * // { success: false, error: 'El nombre debe tener al menos 3 caracteres' }
 */
export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'El nombre debe tener al menos 3 caracteres')
  .max(10, 'El nombre no debe exceder los 10 caracteres')