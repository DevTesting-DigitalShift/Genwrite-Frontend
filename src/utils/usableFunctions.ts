export const objectToFormData = (obj: Record<string, unknown>): FormData => {
  const formData = new FormData()

  Object.entries(obj).forEach(([key, value]) => {
    if (value === null || value === undefined) return

    // Skip files here, we'll append them separately
    if (key === "blogImages") return

    // Arrays → append multiple times
    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(key, item as string | Blob))
    } else if (typeof value === "object" && !(value instanceof File)) {
      // Objects → stringify only if needed (for template maybe)
      formData.append(key, JSON.stringify(value))
    } else {
      // Booleans, numbers, strings → append as-is
      formData.append(key, value as string | Blob)
    }
  })

  return formData
}
