import { createContext, useContext, useState, useCallback, useEffect } from "react"

const LoadingContext = createContext({
  isLoading: false,
  loadingMessage: null,
  showLoading: () => {},
  hideLoading: () => {},
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

  // Show loading - adds to stack to handle multiple requests
  const showLoading = useCallback((message = null) => {
    const id = Date.now() + Math.random()
    setLoadingStack(prev => [...prev, { id, message, timestamp: Date.now() }])
    if (message) setLoadingMessage(message)
    return id
  }, [])

  // Hide loading - removes from stack
  const hideLoading = useCallback(id => {
    setLoadingStack(prev => {
      const newStack = id ? prev.filter(item => item.id !== id) : prev.slice(0, -1)

      // Update message to most recent if stack still has items
      if (newStack.length > 0) {
        const lastMessage = newStack[newStack.length - 1].message
        setLoadingMessage(lastMessage)
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
            `LoadingContext: Removed ${prev.length - filtered.length} stale loading state(s)`
          )
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
