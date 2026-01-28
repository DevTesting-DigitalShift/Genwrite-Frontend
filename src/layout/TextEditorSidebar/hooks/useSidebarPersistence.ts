import { useState, useEffect, useCallback } from "react"

/**
 * Hook to persist sidebar state across panel switches
 * Uses sessionStorage to maintain state during the session
 *
 * @param key - Storage key for the state
 * @param initialValue - Initial value if no stored value exists
 * @returns [value, setValue] tuple similar to useState
 *
 * @example
 * const [metadata, setMetadata] = useSidebarPersistence('seo-metadata', { title: '', description: '' })
 */
export function useSidebarPersistence<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Initialize state from sessionStorage or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue

    try {
      const item = window.sessionStorage.getItem(`sidebar-${key}`)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading from sessionStorage key "${key}":`, error)
      return initialValue
    }
  })

  /**
   * Update localStorage/sessionStorage when state changes
   */
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      window.sessionStorage.setItem(`sidebar-${key}`, JSON.stringify(storedValue))
    } catch (error) {
      console.warn(`Error writing to sessionStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  return [storedValue, setStoredValue]
}

/**
 * Hook to clear all sidebar-related sessionStorage
 * Useful for reset operations or when blog changes
 */
export function useClearSidebarState() {
  const clearSidebarState = useCallback(() => {
    if (typeof window === "undefined") return

    try {
      const keys = Object.keys(window.sessionStorage)
      keys.forEach(key => {
        if (key.startsWith("sidebar-")) {
          window.sessionStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn("Error clearing sidebar state:", error)
    }
  }, [])

  return clearSidebarState
}
