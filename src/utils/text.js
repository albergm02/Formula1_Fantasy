export const trimText = (value = '') => String(value ?? '').trim()

export const toUpperTrimmed = (value = '') => trimText(value).toUpperCase()

export const isValidEmail = (email = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimText(email))

export const normalizeTextFields = (values = {}, fields = []) => {
  const normalizedValues = { ...values }

  fields.forEach((field) => {
    normalizedValues[field] = trimText(normalizedValues[field])
  })

  return normalizedValues
}
