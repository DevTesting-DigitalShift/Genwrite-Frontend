import { useMemo, useEffect, useRef } from "react"
import debounce from "lodash-es/debounce"

/**
 * A hook to create a debounced version of a callback function.
 *
 * @param {Function} callback - The function to debounce.
 * @param {number} delay - The delay in milliseconds.
 * @param {Object} options - Lodash debounce options (leading, trailing, maxWait).
 * @returns {Function} - The debounced function.
 */
const useDebounce = (callback, delay = 500, options) => {
  const callbackRef = useRef(callback)

  // Update the ref to the latest callback on each render
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Create the debounced function only once (or when delay/options change)
  const debouncedCallback = useMemo(() => {
    const func = (...args) => {
      callbackRef.current?.(...args)
    }
    return debounce(func, delay, options)
  }, [delay, options])

  // Cleanup pending invocations on unmount
  useEffect(() => {
    return () => {
      debouncedCallback.cancel()
    }
  }, [debouncedCallback])

  return debouncedCallback
}

export default useDebounce
