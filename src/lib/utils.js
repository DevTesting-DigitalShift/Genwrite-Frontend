import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Deep equality for plain JSON values: primitives, arrays, and plain objects.
 * Does not handle Date, Map, Set, RegExp, or circular references.
 *
 * @param {*} a
 * @param {*} b
 * @returns {boolean}
 */
export function isEqual(a, b) {
  if (a === b) return true
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false

  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) return false

  return aKeys.every((key) => Object.hasOwn(b, key) && isEqual(a[key], b[key]))
}
