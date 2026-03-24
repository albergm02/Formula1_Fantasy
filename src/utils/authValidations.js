/**
 * @fileoverview Esquemas de validación para formularios de autenticación usando Zod.
 * Estos esquemas se utilizan para validar los datos de entrada en los formularios de login y registro.
 * Cada esquema define las reglas de validación para los campos correspondientes (ej: username, email, password).
 * Esto centraliza la lógica de validación y evita repetirla en los componentes.
 */

import { z } from 'zod'

/**
 * Esquema de validación para el nombre de usuario.
 * @type {import('zod').ZodString}
 */
export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'El nombre debe tener al menos 3 caracteres')
  .max(10, 'El nombre no debe exceder los 10 caracteres')
