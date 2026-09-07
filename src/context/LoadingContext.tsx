import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react"

interface LoadingContextValue {
  isLoading: boolean
  loadingMessage: string | null
  showLoading: (message?: string | null) => number
  hideLoading: (id?: number) => void
}

interface LoadingEntry {
  id: number
  message: string | null
  timestamp: number
}

const LoadingContext = createContext<LoadingContextValue>({
  isLoading: false,
  loadingMessage: null,
  showLoading: () => 0,
  hideLoading: () => {},
})

export const useLoading = (): LoadingContextValue => {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider")
  }
  return context
}

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [loadingStack, setLoadingStack] = useState<LoadingEntry[]>([])
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null)

  /**
   * Show loading - adds to stack to handle multiple requests.
   *
   * @returns Loading ID for later removal
   */
  const showLoading = useCallback((message: string | null = null): number => {
    const id = Date.now() + Math.random()

    setLoadingStack((prev) => {
      const newStack = [...prev, { id, message, timestamp: Date.now() }]
      return newStack
    })

    // Always update message if provided
    if (message) {
      setLoadingMessage(message)
    }

    return id
  }, [])

  /** Hide loading - removes from stack by ID or last item. */
  const hideLoading = useCallback((id?: number): void => {
    setLoadingStack((prev) => {
      let newStack: LoadingEntry[]

      if (id !== undefined && id !== null) {
        // Remove specific ID
        newStack = prev.filter((item) => item.id !== id)

        if (newStack.length === prev.length) {
          // ID not found, log warning
          if (import.meta.env.DEV) {
            console.warn("[LoadingContext] Attempted to hide loading with non-existent ID:", id)
          }
          return prev
        }
      } else {
        // Remove last item (LIFO)
        if (prev.length === 0) {
          if (import.meta.env.DEV) {
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
      setLoadingStack((prev) => {
        const filtered = prev.filter((item) => now - item.timestamp < MAX_LOADING_TIME)

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
