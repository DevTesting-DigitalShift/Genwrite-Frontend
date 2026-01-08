import { useState, useEffect, useCallback } from "react"

/**
 * Breakpoint configuration for responsive detection
 * Matches Tailwind CSS breakpoints
 */
interface BreakpointConfig {
  /** Mobile breakpoint (default: 640px - Tailwind's 'sm') */
  mobile: number
  /** Tablet breakpoint (default: 768px - Tailwind's 'md') */
  tablet: number
  /** Desktop breakpoint (default: 1024px - Tailwind's 'lg') */
  desktop: number
}

/**
 * Return type for useViewport hook
 */
interface UseViewportReturn {
  /** True if viewport width is less than mobile breakpoint (< 640px) */
  isMobile: boolean
  /** True if viewport width is less than tablet breakpoint (< 768px) */
  isTablet: boolean
  /** True if viewport width is greater than or equal to desktop breakpoint (>= 1024px) */
  isDesktop: boolean
  /** Current viewport width in pixels */
  width: number
  /** Current viewport height in pixels */
  height: number
}

/**
 * Default breakpoints matching Tailwind CSS
 */
const DEFAULT_BREAKPOINTS: BreakpointConfig = {
  mobile: 640, // Tailwind 'sm'
  tablet: 768, // Tailwind 'md'
  desktop: 1024, // Tailwind 'lg'
}

/**
 * useViewport Hook
 *
 * A responsive hook that detects viewport size and provides
 * boolean flags for mobile, tablet, and desktop breakpoints.
 *
 * Features:
 * - SSR-safe with proper hydration handling
 * - Debounced resize listener for performance
 * - Configurable breakpoints
 * - Returns current viewport dimensions
 *
 * @param customBreakpoints - Optional custom breakpoint configuration
 * @returns Object with isMobile, isTablet, isDesktop flags and dimensions
 *
 * @example
 * // Basic usage
 * const { isMobile, isTablet, isDesktop } = useViewport()
 *
 * if (isMobile) {
 *   return <MobileLayout />
 * }
 *
 * @example
 * // With custom breakpoints
 * const { isMobile } = useViewport({ mobile: 480, tablet: 768, desktop: 1200 })
 *
 * @example
 * // Using viewport dimensions
 * const { width, height } = useViewport()
 */
const useViewport = (customBreakpoints?: Partial<BreakpointConfig>): UseViewportReturn => {
  const breakpoints = { ...DEFAULT_BREAKPOINTS, ...customBreakpoints }

  /**
   * Get current window dimensions
   * Returns 0 for SSR environments
   */
  const getWindowDimensions = useCallback(() => {
    if (typeof window === "undefined") {
      return { width: 0, height: 0 }
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    }
  }, [])

  const [dimensions, setDimensions] = useState(getWindowDimensions)

  useEffect(() => {
    // Set initial dimensions on mount (handles SSR hydration)
    setDimensions(getWindowDimensions())

    let timeoutId: ReturnType<typeof setTimeout> | null = null

    /**
     * Debounced resize handler for performance
     * Only updates state after resize events have settled
     */
    const handleResize = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        setDimensions(getWindowDimensions())
      }, 100) // 100ms debounce
    }

    window.addEventListener("resize", handleResize)

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      window.removeEventListener("resize", handleResize)
    }
  }, [getWindowDimensions])

  return {
    isMobile: dimensions.width > 0 && dimensions.width < breakpoints.mobile,
    isTablet: dimensions.width > 0 && dimensions.width < breakpoints.tablet,
    isDesktop: dimensions.width >= breakpoints.desktop,
    width: dimensions.width,
    height: dimensions.height,
  }
}

export default useViewport

/**
 * Named export for convenience
 */
export { useViewport }

/**
 * Export types for external use
 */
export type { UseViewportReturn, BreakpointConfig }
