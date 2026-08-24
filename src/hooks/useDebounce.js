import { useMemo, useEffect, useRef } from "react"

/**
 * A hook to create a debounced version of a callback function.
 *
 * @param {Function} callback - The function to debounce.
 * @param {number} delay - The delay in milliseconds.
 * @returns {Function} - The debounced function, exposing a `cancel()` method.
 */
const useDebounce = (callback, delay = 500) => {
  const callbackRef = useRef(callback)

  // Update the ref to the latest callback on each render
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Create the debounced function only once (or when delay changes)
  const debouncedCallback = useMemo(() => {
    let timeoutId
    const debounced = (...args) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        callbackRef.current?.(...args)
      }, delay)
    }
    debounced.cancel = () => clearTimeout(timeoutId)
    return debounced
  }, [delay])

  // Cleanup pending invocations on unmount
  useEffect(() => {
    return () => {
      debouncedCallback.cancel()
    }
  }, [debouncedCallback])

  return debouncedCallback
}

export default useDebounce
