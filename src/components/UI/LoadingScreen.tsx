import { useEffect, useRef, useState } from "react"
import "./LoadingScreen.css"

interface LoadingScreenProps {
  maxDuration?: number // Maximum time to display (ms)
  onTimeout?: () => void // Callback when timeout is reached
  message?: string // Optional loading message
  delay?: number // Delay before showing (ms) - prevents flash on quick loads
}

const LoadingScreen = ({
  maxDuration = 60000, // 60 seconds default
  onTimeout,
  message,
  delay = 200, // Default 200ms delay to prevent flash
}: LoadingScreenProps = {}) => {
  const [isTimedOut, setIsTimedOut] = useState(false)
  const [shouldShow, setShouldShow] = useState(delay === 0) // Show immediately if no delay
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const delayRef = useRef<NodeJS.Timeout | null>(null)
  const mountTimeRef = useRef<number>(Date.now())

  // Delay before showing - prevents flash on quick loads
  useEffect(() => {
    if (delay > 0) {
      delayRef.current = setTimeout(() => {
        setShouldShow(true)
      }, delay)
    }

    return () => {
      if (delayRef.current) {
        clearTimeout(delayRef.current)
      }
    }
  }, [delay])

  // Timeout protection - prevent infinite loading states
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      console.warn(
        `LoadingScreen: Maximum duration (${maxDuration}ms) exceeded. ` +
          `Component has been visible for too long.`
      )
      setIsTimedOut(true)
      onTimeout?.()
    }, maxDuration)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Log how long the component was displayed
      const duration = Date.now() - mountTimeRef.current
      if (duration > 5000) {
        console.info(`LoadingScreen: Was displayed for ${(duration / 1000).toFixed(1)}s`)
      }
    }
  }, [maxDuration, onTimeout])

  // Performance monitoring in development
  useEffect(() => {
    if (import.meta.env.NODE_ENV === "development") {
      const startTime = performance.now()

      return () => {
        const endTime = performance.now()
        const duration = endTime - startTime
        if (duration > 3000) {
          console.warn(
            `LoadingScreen: Long display duration detected: ${(duration / 1000).toFixed(2)}s. ` +
              `Consider optimizing the loading operation.`
          )
        }
      }
    }
  }, [])

  // Don't render until delay has passed (prevents flash)
  if (!shouldShow) {
    return null
  }

  return (
    <div
      className="loading-screen"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message || "Loading content, please wait"}
    >
      {/* Screen reader-only text */}
      <span className="sr-only">{message || "Loading, please wait..."}</span>

      <div className="loading-content">
        {/* Animated Logo Text with Morphing Background */}
        <div className="logo-container">
          <div className="morphing-background" aria-hidden="true"></div>

          <div className="logo-wrapper">
            {/* Animated Pen Icon */}
            <div className="pen-wrapper" aria-hidden="true">
              <svg className="pen-svg" viewBox="0 0 24 24" fill="none">
                <path
                  className="pen-path"
                  d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  className="pen-path-delayed"
                  d="M15 5l4 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="sparkle-container">
                <div className="sparkle sp-1"></div>
                <div className="sparkle sp-2"></div>
                <div className="sparkle sp-3"></div>
              </div>
            </div>

            {/* Logo Text */}
            <h1 className="logo-text" aria-hidden="true">
              <span className="letter" style={{ animationDelay: "0s" }}>
                g
              </span>
              <span className="letter" style={{ animationDelay: "0.1s" }}>
                e
              </span>
              <span className="letter" style={{ animationDelay: "0.2s" }}>
                n
              </span>
              <span className="letter" style={{ animationDelay: "0.3s" }}>
                w
              </span>
              <span className="letter" style={{ animationDelay: "0.4s" }}>
                r
              </span>
              <span className="letter" style={{ animationDelay: "0.5s" }}>
                i
              </span>
              <span className="letter" style={{ animationDelay: "0.6s" }}>
                t
              </span>
              <span className="letter" style={{ animationDelay: "0.7s" }}>
                e
              </span>
              <span className="logo-dot" style={{ animationDelay: "0.8s" }}>
                .
              </span>
            </h1>
          </div>
        </div>

        {/* Optional message display */}
        {message && (
          <p className="loading-message" aria-hidden="true">
            {message}
          </p>
        )}

        {/* Timeout warning (only visible if timeout reached) */}
        {isTimedOut && (
          <div className="loading-timeout-warning" role="alert">
            <p className="text-sm text-orange-600">Loading is taking longer than expected...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LoadingScreen
