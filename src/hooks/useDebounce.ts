import { useEffect, useMemo, useRef } from "react"

/** A debounced callback, with a `cancel()` for dropping any pending invocation. */
export type DebouncedFn<Args extends unknown[]> = ((...args: Args) => void) & {
  cancel: () => void
}

/**
 * Creates a debounced version of a callback. The returned function is stable for
 * a given `delay`, and always invokes the most recent `callback` passed in — so
 * it can be used in deps arrays without re-creating the timer on every render.
 *
 * @param callback - The function to debounce.
 * @param delay - The delay in milliseconds.
 */
const useDebounce = <Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay = 500
): DebouncedFn<Args> => {
  const callbackRef = useRef(callback)

  // Update the ref to the latest callback on each render
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Create the debounced function only once (or when delay changes)
  const debouncedCallback = useMemo<DebouncedFn<Args>>(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const debounced = (...args: Args) => {
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
