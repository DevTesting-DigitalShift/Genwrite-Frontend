import { useEffect, useRef, useState } from "react"
import "./ProgressLoadingScreen.css"

interface ProgressLoadingScreenProps {
  maxDuration?: number // Maximum time to display (ms)
  onTimeout?: () => void // Callback when timeout is reached
  message?: string // Optional loading message
  delay?: number // Delay before showing (ms) - prevents flash on quick loads
  isYouTube?: boolean // If true, progress will be much slower
}

const ProgressLoadingScreen = ({
  maxDuration = 60000, // 60 seconds default
  onTimeout,
  message,
  delay = 200, // Default 200ms delay to prevent flash
  isYouTube = false,
}: ProgressLoadingScreenProps) => {
  const [progress, setProgress] = useState(0)
  const [isTimedOut, setIsTimedOut] = useState(false)
  const [shouldShow, setShouldShow] = useState(delay === 0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const delayRef = useRef<NodeJS.Timeout | null>(null)
  const mountTimeRef = useRef<number>(Date.now())

  // Delay before showing
  useEffect(() => {
    if (delay > 0) {
      delayRef.current = setTimeout(() => {
        setShouldShow(true)
      }, delay)
    }
    return () => {
      if (delayRef.current) clearTimeout(delayRef.current)
    }
  }, [delay])

  // Timeout protection
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      console.warn(`ProgressLoadingScreen: Maximum duration exceeded.`)
      setIsTimedOut(true)
      onTimeout?.()
    }, maxDuration)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      const duration = Date.now() - mountTimeRef.current
      if (duration > 5000) {
        console.info(`ProgressLoadingScreen: Was displayed for ${(duration / 1000).toFixed(1)}s`)
      }
    }
  }, [maxDuration, onTimeout])

  // Progress logic
  useEffect(() => {
    const intervalTime = isYouTube ? 1500 : 80
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 98) {
          clearInterval(interval)
          return 98
        }
        if (prev > 80) return prev + 0.5
        return prev + 1
      })
    }, intervalTime)

    return () => clearInterval(interval)
  }, [isYouTube])

  if (!shouldShow) return null

  return (
    <div
      className="progress-loading-screen"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message || `Loading content, please wait... ${Math.floor(progress)}%`}
    >
      <div className="progress-loading-content">
        <div className="progress-container-wrapper">
          <div className="progress-percentage">
            <span className="percentage-number">{Math.floor(progress)}</span>
            <span className="percentage-symbol">%</span>
          </div>
          <div className="modern-progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {message && <p className="loading-message-text">{message}</p>}

        {isTimedOut && (
          <div className="loading-timeout-warning" role="alert">
            <p className="timeout-text">Loading is taking longer than expected...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProgressLoadingScreen
