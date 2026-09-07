// utils/objectPath.js
export const getValueByPath = (obj: unknown, path: string): unknown => {
  return path
    .split(".")
    .reduce<unknown>((acc, part) => (acc as Record<string, unknown> | null | undefined)?.[part], obj)
}

/**
 * Returns a deep clone of `obj` with `value` written at the nested `keys` path.
 *
 * NOTE: `keys` is mutated (the last element is popped off) — this is pre-existing
 * behaviour, so pass a copy if the caller still needs the original array.
 */
export const setValueByPath = <T>(obj: T, keys: string[], value: unknown): T => {
  const lastKey = keys.pop()
  const deepClone = structuredClone(obj) // avoid mutating original
  if (lastKey === undefined) return deepClone

  let nested = deepClone as Record<string, unknown>
  for (const key of keys) {
    if (!nested[key]) nested[key] = {}
    nested = nested[key] as Record<string, unknown>
  }
  nested[lastKey] = value
  return deepClone
}
