import { createContext, useContext, useState, useCallback, useEffect } from "react"

/**
 * @typedef {Object} LoadingContextValue
 * @property {boolean} isLoading
 * @property {string|null} loadingMessage
 * @property {(message?: string|null) => number} showLoading
 * @property {(id?: number) => void} hideLoading
 */

/** @type {import('react').Context<LoadingContextValue>} */
const LoadingContext = createContext({
  isLoading: false,
  loadingMessage: /** @type {string|null} */ (null),
  showLoading: /** @type {(message?: string|null) => number} */ (() => 0),
  hideLoading: /** @type {(id?: number) => void} */ (() => {}),
})

export const useLoading = () => {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider")
  }
  return context
}

export const LoadingProvider = ({ children }) => {
  const [loadingStack, setLoadingStack] = useState([])
  const [loadingMessage, setLoadingMessage] = useState(null)

  /**
   * Show loading - adds to stack to handle multiple requests
   * @param {string|null} [message=null] - Optional loading message
   * @returns {number} Loading ID for later removal
   */
  const showLoading = useCallback((message = null) => {
    const id = Date.now() + Math.random()

    setLoadingStack(prev => {
      const newStack = [...prev, { id, message, timestamp: Date.now() }]
      return newStack
    })

    // Always update message if provided
    if (message) {
      setLoadingMessage(message)
    }

    return id
  }, [])

  /**
   * Hide loading - removes from stack by ID or last item
   * @param {number} [id] - Optional loading ID to remove
   */
  const hideLoading = useCallback(id => {
    setLoadingStack(prev => {
      let newStack

      if (id !== undefined && id !== null) {
        // Remove specific ID
        newStack = prev.filter(item => item.id !== id)

        if (newStack.length === prev.length) {
          // ID not found, log warning
          if (import.meta.env.NODE_ENV === "development") {
            console.warn("[LoadingContext] Attempted to hide loading with non-existent ID:", id)
          }
          return prev
        }
      } else {
        // Remove last item (LIFO)
        if (prev.length === 0) {
          if (import.meta.env.NODE_ENV === "development") {
            console.warn("[LoadingContext] Attempted to hide loading but stack is empty")
          }
          return prev
        }
        newStack = prev.slice(0, -1)
      }

      // Update message to the most recent item in stack
      if (newStack.length > 0) {
        const lastMessage = newStack[newStack.length - 1].message
        setLoadingMessage(lastMessage || null)
      } else {
        setLoadingMessage(null)
      }

      return newStack
    })
  }, [])

  // Auto-cleanup for stuck loading states (safety net)
  useEffect(() => {
    const MAX_LOADING_TIME = 60000 // 60 seconds

    const interval = setInterval(() => {
      const now = Date.now()
      setLoadingStack(prev => {
        const filtered = prev.filter(item => now - item.timestamp < MAX_LOADING_TIME)

        if (filtered.length !== prev.length) {
          console.warn(
            `[LoadingContext] Removed ${prev.length - filtered.length} stale loading state(s)`
          )

          // Update message after cleanup
          if (filtered.length > 0) {
            setLoadingMessage(filtered[filtered.length - 1].message || null)
          } else {
            setLoadingMessage(null)
          }
        }

        return filtered
      })
    }, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const isLoading = loadingStack.length > 0

  return (
    <LoadingContext.Provider value={{ isLoading, loadingMessage, showLoading, hideLoading }}>
      {children}
    </LoadingContext.Provider>
  )
}

export default LoadingContext
