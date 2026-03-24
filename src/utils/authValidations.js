// Esquemas de validación Zod para autenticación
import { z } from 'zod'

// Username: 3-10 caracteres, trim automático
export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'El nombre debe tener al menos 3 caracteres')
  .max(10, 'El nombre no debe exceder los 10 caracteres')
