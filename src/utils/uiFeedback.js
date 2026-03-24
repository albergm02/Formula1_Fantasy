/**
 * Utilidades para notificar al usuario de lo que ocurre en la app: mensajes emergentes (toasts) y diálogos de confirmación.
 * @module utils/uiFeedback
 */

/**
 * Muestra una notificación emergente (toast) al usuario.
 * @param {Object} toast      - El objeto devuelto por useToast() de PrimeVue.
 * @param {Object} options     - Configuración del toast.
 * @param {'success'|'info'|'warn'|'error'} options.severity - Color e icono del toast.
 * @param {string} options.summary  - Título corto, ej: "Compra realizada".
 * @param {string} options.detail   - Descripción más larga, ej: "Has realizado una compra".
 * @param {number} [options.life=3000] - Cuántos ms se queda visible (por defecto 3 segundos).
 *
 * @example
 * showToast(toast, {
 *   severity: 'success',
 *   summary: 'Piloto fichado',
 *   detail: 'Max Verstappen se ha unido a tu garaje',
 * })
 */
export const showToast = (toast, { severity, summary, detail, life = 3000 }) => {
  toast.add({ severity, summary, detail, life })
}

/**
 * Muestra un toast de éxito o error según el resultado de una operación del store.
 *
 * En lugar de escribir un if/else en cada componente para saber si la operación
 * salió bien o mal, esta función lo hace por ti: lee el resultado y elige
 * automáticamente el toast correcto.
 *
 * El `result` que recibe debe tener esta forma (la que devuelven los stores):
 *   - { success: true,  message: 'Texto descriptivo' }  → toast verde
 *   - { success: false, message: 'Motivo del fallo'  }  → toast rojo
 *
 * @param {Object} toast   - El objeto devuelto por useToast() de PrimeVue.
 * @param {Object} result  - Objeto de resultado devuelto por una acción del store.
 * @param {boolean} result.success  - Si la operación fue exitosa.
 * @param {string}  result.message  - Mensaje a mostrar al usuario.
 * @param {Object}  [options]       - Personalización opcional de los mensajes.
 * @param {Object}  [options.success]        - Overrides para el toast de éxito   ({ severity, summary }).
 * @param {Object}  [options.failure]        - Overrides para el toast de error    ({ severity, summary }).
 * @param {string}  [options.successDetail]  - Texto personalizado para el caso de éxito (anula result.message).
 *
 * @example
 * const resultado = await teamStore.buyItem(piloto)
 * showResultToast(toast, resultado, {
 *   success: { severity: 'success', summary: '¡Fichaje completado!' },
 *   failure: { severity: 'error',   summary: 'No se pudo fichar' },
 * })
 */
export const showResultToast = (
  toast,
  result,
  {
    success = { severity: 'success', summary: 'Operación completada' },
    failure = { severity: 'error', summary: 'Operación fallida' },
    successDetail,
  } = {},
) => {
  // Acepta tanto 'success' (inglés, stores nuevos) como 'exito' (español, legacy)
  const isSuccess = result?.success ?? result?.exito
  const detailMessage = result?.message ?? result?.mensaje

  if (isSuccess) {
    showToast(toast, {
      severity: success.severity,
      summary: success.summary,
      detail: successDetail || detailMessage,
    })
    return
  }

  showToast(toast, {
    severity: failure.severity,
    summary: failure.summary,
    detail: detailMessage || 'Ha ocurrido un error inesperado.',
  })
}

/**
 * Abre un diálogo modal pidiendo confirmación al usuario antes de ejecutar una acción.
 *
 * Úsala para acciones destructivas o irreversibles: vender un piloto, salir de una liga, etc.
 * El icono de advertencia (⚠️) se incluye por defecto.
 *
 * @param {Object} confirm  - El objeto devuelto por useConfirm() de PrimeVue.
 * @param {Object} [options]
 * @param {string} [options.header]       - Título del diálogo, ej: "¿Vender piloto?".
 * @param {string} [options.message]      - Pregunta al usuario, ej: "Esta acción no se puede deshacer.".
 * @param {string} [options.acceptLabel]  - Texto del botón de confirmación, ej: "Sí, vender".
 * @param {string} [options.rejectLabel]  - Texto del botón de cancelar, ej: "Cancelar".
 * @param {Function} [options.accept]     - Callback que se ejecuta si el usuario confirma.
 * @param {Function} [options.reject]     - Callback que se ejecuta si el usuario cancela.
 *
 * @example
 * showConfirmDialog(confirm, {
 *   header: '¿Vender a Hamilton?',
 *   message: 'Recibirás el 50% de su valor. Esta acción es irreversible.',
 *   acceptLabel: 'Sí, vender',
 *   rejectLabel: 'Cancelar',
 *   accept: () => teamStore.sellItem(piloto),
 * })
 */
export const showConfirmDialog = (confirm, options = {}) => {
  confirm.require({
    icon: 'pi pi-exclamation-triangle',
    ...options,
  })
}
