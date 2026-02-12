// utils/objectPath.js
export const getValueByPath = (obj, path) => {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj)
}

/**
 *
 * @param {any} obj
 * @param {string[]} keys
 * @param {any} value
 * @returns
 */
export const setValueByPath = (obj, keys, value) => {
  const lastKey = keys.pop()
  const deepClone = structuredClone(obj) // avoid mutating original

  let nested = deepClone
  for (const key of keys) {
    if (!nested[key]) nested[key] = {}
    nested = nested[key]
  }
  nested[lastKey] = value
  return deepClone
}
