import { useEffect, useRef, useState } from "react"
import "./ProgressLoadingScreen.css"

interface ProgressLoadingScreenProps {
  maxDuration?: number // Maximum time to display (ms)
  onTimeout?: () => void // Callback when timeout is reached
  message?: string // Optional loading message
  toast?: string // Alias for message
  delay?: number // Delay before showing (ms) - prevents flash on quick loads
  isYouTube?: boolean // If true, progress will be much slower
  timer?: number // External timer support (alias for progress or for sync)
  scenario?: "default" | "youtube" | "analysis" | "generation" | "scrapping"
}

const ProgressLoadingScreen = ({
  maxDuration = 60000,
  onTimeout,
  message,
  toast,
  delay = 200,
  isYouTube = false,
  timer,
  scenario = "default",
}: ProgressLoadingScreenProps) => {
  const [progress, setProgress] = useState(0)
  const [shouldShow, setShouldShow] = useState(delay === 0)
  const [currentDynamicMessage, setCurrentDynamicMessage] = useState("")
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const delayRef = useRef<NodeJS.Timeout | null>(null)
  const mountTimeRef = useRef<number>(Date.now())

  const loadingMessage = message || toast || currentDynamicMessage

  // Dynamic messages based on scenario and progress
  const getDynamicMessage = (prog: number) => {
    const messages = {
      youtube: [
        { threshold: 0, text: "Connecting to YouTube API..." },
        { threshold: 10, text: "Fetching video transcript..." },
        { threshold: 30, text: "Analyzing video content..." },
        { threshold: 50, text: "Summarizing key moments..." },
        { threshold: 75, text: "Generating final summary..." },
        { threshold: 90, text: "Finishing up..." },
      ],
      analysis: [
        { threshold: 0, text: "Initializing analysis engine..." },
        { threshold: 15, text: "Crawling content data..." },
        { threshold: 40, text: "Running linguistic algorithms..." },
        { threshold: 60, text: "Evaluating SEO performance..." },
        { threshold: 80, text: "Finalizing competitive insights..." },
        { threshold: 95, text: "Preparing results display..." },
      ],
      generation: [
        { threshold: 0, text: "Waking up AI models..." },
        { threshold: 20, text: "Processing your instructions..." },
        { threshold: 45, text: "Drafting content structure..." },
        { threshold: 70, text: "Polishing generated text..." },
        { threshold: 85, text: "Running quality checks..." },
        { threshold: 95, text: "Almost ready..." },
      ],
      scrapping: [
        { threshold: 0, text: "Bypassing anti-bot measures..." },
        { threshold: 20, text: "Accessing target platform..." },
        { threshold: 50, text: "Extracting relevant data points..." },
        { threshold: 80, text: "Cleaning and formatting data..." },
        { threshold: 95, text: "Constructing final report..." },
      ],
      default: [
        { threshold: 0, text: "Starting request..." },
        { threshold: 25, text: "Processing data..." },
        { threshold: 50, text: "Thinking..." },
        { threshold: 75, text: "Finalizing..." },
        { threshold: 95, text: "Just a second..." },
      ],
    }

    const currentScenario = isYouTube ? "youtube" : scenario
    const scenarioMessages = messages[currentScenario] || messages.default
    
    const matched = scenarioMessages
      .filter(m => prog >= m.threshold)
      .reverse()[0]
    
    return matched?.text || ""
  }

  useEffect(() => {
    setCurrentDynamicMessage(getDynamicMessage(progress))
  }, [progress, scenario, isYouTube])

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

  // Smart Progress Logic
  useEffect(() => {
    if (timer !== undefined) {
        // If external timer is provided, we can sync with it or just let it be.
        // For now, if timer is provided and progress is 0, we can use timer if it's 0-100
        if (timer > 0 && timer <= 100) {
            setProgress(timer)
            return
        }
    }

    const initialPattern = [1, 2, 3, 15, 20, 25, 30, 40]
    let currentIndex = 0
    let elapsedTime = 0
    let timeoutId: NodeJS.Timeout | null = null

    const baseDelay = isYouTube ? 2000 : 500

    const updateProgress = () => {
      setProgress(prev => {
        if (prev >= 98) return 98
        if (currentIndex < initialPattern.length) {
          const nextValue = initialPattern[currentIndex]
          currentIndex++
          const delay = isYouTube ? baseDelay + currentIndex * 300 : baseDelay
          timeoutId = setTimeout(updateProgress, delay)
          return nextValue
        }
        if (prev >= 40 && prev < 70) {
          const delay = isYouTube ? 3000 : 800
          timeoutId = setTimeout(updateProgress, delay)
          return Math.min(prev + 6, 70)
        }
        if (prev >= 70 && prev < 85) {
          const delay = isYouTube ? 4000 : 1200
          timeoutId = setTimeout(updateProgress, delay)
          return Math.min(prev + (elapsedTime > 10000 ? 2 : 3), 85)
        }
        if (prev >= 85 && prev < 95) {
          const delay = isYouTube ? 5000 : 1500
          timeoutId = setTimeout(updateProgress, delay)
          return Math.min(prev + (elapsedTime > 20000 ? 0.5 : 1), 95)
        }
        if (prev >= 95 && prev < 98) {
          const delay = isYouTube ? 6000 : 2000
          timeoutId = setTimeout(updateProgress, delay)
          return Math.min(prev + 0.3, 98)
        }
        return prev
      })
    }

    const timeInterval = setInterval(() => {
      elapsedTime += 100
    }, 100)

    updateProgress()

    return () => {
      clearInterval(timeInterval)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isYouTube, timer])

  if (!shouldShow) return null

  return (
    <div
      className="progress-loading-screen"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={loadingMessage || `Loading content, please wait... ${Math.floor(progress)}%`}
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

        {loadingMessage && <p className="loading-message-text">{loadingMessage}</p>}
      </div>
    </div>
  )
}

export default ProgressLoadingScreen
