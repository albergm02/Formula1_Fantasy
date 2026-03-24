// Toasts y diálogos de confirmación

// Toast genérico
export const showToast = (toast, { severity, summary, detail, life = 3000 }) => {
  toast.add({ severity, summary, detail, life })
}

// Toast automático según resultado del store { success, message }
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

// Confirmación antes de acciones destructivas (vender, salir de liga...)
export const showConfirmDialog = (confirm, options = {}) => {
  confirm.require({
    icon: 'pi pi-exclamation-triangle',
    ...options,
  })
}
