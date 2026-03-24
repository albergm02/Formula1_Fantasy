export const showToast = (toast, { severity, summary, detail, life = 3000 }) => {
  toast.add({ severity, summary, detail, life })
}

export const showResultToast = (
  toast,
  result,
  {
    success = { severity: 'success', summary: 'Operación completada' },
    failure = { severity: 'error', summary: 'Operación fallida' },
    successDetail,
  } = {},
) => {
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

export const showConfirmDialog = (confirm, options = {}) => {
  confirm.require({
    icon: 'pi pi-exclamation-triangle',
    ...options,
  })
}
