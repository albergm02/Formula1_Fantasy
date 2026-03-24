import { z } from 'zod'

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'El nombre debe tener al menos 3 caracteres')
  .max(8, 'El nombre no debe exceder los 8 caracteres')