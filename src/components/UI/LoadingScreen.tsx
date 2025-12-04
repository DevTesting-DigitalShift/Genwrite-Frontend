import { useEffect } from "react"
import "./LoadingScreen.css"

const LoadingScreen = () => {
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
      </div>
    </div>
  )
}

export default LoadingScreen
