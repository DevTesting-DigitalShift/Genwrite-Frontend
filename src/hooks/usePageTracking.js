import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import ReactGA from "react-ga4"
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals"

function sendWebVitals(routePath) {
  const report = ({ name, delta, id }) => {
    ReactGA.event(name, {
      category: "Web Vitals",
      label: `${routePath}:${id}`, // Route-specific label
      value: Math.round(name === "CLS" ? delta * 1000 : delta),
      nonInteraction: true,
    })
  }

  onCLS(report)
  onINP(report)
  onLCP(report)
  onFCP(report)
  onTTFB(report)
}

export default function usePageTracking() {
  const location = useLocation()

  useEffect(() => {
    const path = location.pathname + location.search

    // Page view event
    ReactGA.send({ hitType: "pageview", page: path })

    // Web Vitals for this route
    sendWebVitals(path)
  }, [location])
}
