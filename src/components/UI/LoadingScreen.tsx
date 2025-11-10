import { useEffect } from "react"
import "./LoadingScreen.css"

interface LoadingScreenProps {
  message?: string
}

const LoadingScreen = ({ message = "Loading..." }: LoadingScreenProps) => {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  return (
    <div className="loading-screen">
      <div className="loading-content">
        {/* Animated Logo Text with Morphing Background */}
        <div className="logo-container">
          <div className="morphing-background"></div>

          <div className="logo-wrapper">
            {/* Animated Pen Icon */}
            <div className="pen-wrapper">
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
            <h1 className="logo-text">
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

        {/* Loading Message */}
        <p className="loading-message">{message}</p>

        {/* Circular Progress */}
        <div className="circular-progress">
          <svg className="progress-ring" viewBox="0 0 120 120">
            <defs>
              <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#9333ea" />
              </linearGradient>
            </defs>
            <circle className="progress-ring-bg" cx="60" cy="60" r="54" />
            <circle className="progress-ring-fill" cx="60" cy="60" r="54" />
          </svg>
          <div className="progress-center">
            <div className="progress-dots">
              <span className="p-dot"></span>
              <span className="p-dot"></span>
              <span className="p-dot"></span>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="status-bar">
          <div className="status-pulse"></div>
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen
