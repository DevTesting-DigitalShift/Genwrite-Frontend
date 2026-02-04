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

  // Smart Progress Logic with Delays
  useEffect(() => {
    // Initial pattern: 1-2-3-15-20-25-30-40 with delays
    const initialPattern = [1, 2, 3, 15, 20, 25, 30, 40]
    let currentIndex = 0
    let elapsedTime = 0
    let timeoutId: NodeJS.Timeout | null = null

    // YouTube is SUPER slow, others are moderate
    const baseDelay = isYouTube ? 2000 : 500 // 2s for YouTube, 500ms for others

    const updateProgress = () => {
      setProgress(prev => {
        // Never reach 100%
        if (prev >= 98) {
          return 98
        }

        // Phase 1: Follow initial pattern (1-2-3-15-20-25-30-40)
        if (currentIndex < initialPattern.length) {
          const nextValue = initialPattern[currentIndex]
          currentIndex++

          // Schedule next update with delay
          const delay = isYouTube ? baseDelay + currentIndex * 300 : baseDelay
          timeoutId = setTimeout(updateProgress, delay)

          return nextValue
        }

        // Phase 2: After 40%, increase by 6% increments
        if (prev >= 40 && prev < 70) {
          const delay = isYouTube ? 3000 : 800
          timeoutId = setTimeout(updateProgress, delay)
          return Math.min(prev + 6, 70)
        }

        // Phase 3: After 70%, slow down based on elapsed time
        if (prev >= 70 && prev < 85) {
          const slowIncrement = elapsedTime > 10000 ? 2 : 3
          const delay = isYouTube ? 4000 : 1200
          timeoutId = setTimeout(updateProgress, delay)
          return Math.min(prev + slowIncrement, 85)
        }

        // Phase 4: After 85%, very slow increments
        if (prev >= 85 && prev < 95) {
          const verySlowIncrement = elapsedTime > 20000 ? 0.5 : 1
          const delay = isYouTube ? 5000 : 1500
          timeoutId = setTimeout(updateProgress, delay)
          return Math.min(prev + verySlowIncrement, 95)
        }

        // Phase 5: After 95%, crawl to 98% (never 100%)
        if (prev >= 95 && prev < 98) {
          const delay = isYouTube ? 6000 : 2000
          timeoutId = setTimeout(updateProgress, delay)
          return Math.min(prev + 0.3, 98)
        }

        return prev
      })
    }

    // Track elapsed time
    const timeInterval = setInterval(() => {
      elapsedTime += 100
    }, 100)

    // Start the progress
    updateProgress()

    return () => {
      clearInterval(timeInterval)
      if (timeoutId) clearTimeout(timeoutId)
    }
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
      </div>
    </div>
  )
}

export default ProgressLoadingScreen
