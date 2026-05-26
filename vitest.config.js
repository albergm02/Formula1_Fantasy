import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

/**
 * Configuración de Vitest para el TFG.
 *
 * - Tests escritos en español y agrupados por dominio dentro de `tests/`.
 * - Entorno `node`: no se levanta DOM porque sólo se prueban funciones puras
 *   (cálculo de puntuación y selección del ganador de pujas).
 * - Se mantiene el alias `@` para que los imports coincidan con los del código
 *   de la aplicación (`@/utils/puntuacion`).
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.js'],
  },
})
