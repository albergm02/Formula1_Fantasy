/**
 * @fileoverview Funciones relacionadas con la interfaz de usuario, como mostrar toasts y diálogos de confirmación.
 * Estas funciones se utilizan para proporcionar retroalimentación visual al usuario sobre el resultado de sus acciones,
 * así como para solicitar confirmación antes de realizar acciones destructivas (ej: vender un coche, salir de una liga).
 * Esto centraliza la lógica de UI feedback y evita repetirla en los componentes.
 */

/**
 * Muestra un toast con la severidad, título y detalle indicados
 * @param {object} toast - Componente de toast
 * @param {object} options - Opciones para el toast (severity, summary, detail, life)
 */
export const showToast = (toast, { severity, summary, detail, life = 3000 }) => {
  toast.add({ severity, summary, detail, life })
}

/**
 * Muestra toast de éxito o error según result { success, message }
 * @param {object} toast - Componente de toast
 * @param {object} result - Resultado de la operación { success, message }
 * @param {object} options - Opciones para mensajes de éxito (success), error (failure) y detalle (successDetail)
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
  if (result?.success) {
    showToast(toast, {
      severity: success.severity,
      summary: success.summary,
      detail: successDetail || result?.message,
    })
    return
  }

  showToast(toast, {
    severity: failure.severity,
    summary: failure.summary,
    detail: result?.message || 'Ha ocurrido un error inesperado.',
  })
}

/**
 * Muestra un diálogo de confirmación para acciones destructivas.
 * @param {object} confirm - Componente de confirmación
 * @param {object} options - Opciones para el diálogo
 */
export const showConfirmDialog = (confirm, options = {}) => {
  confirm.require({
    icon: 'pi pi-exclamation-triangle',
    ...options,
  })
}
