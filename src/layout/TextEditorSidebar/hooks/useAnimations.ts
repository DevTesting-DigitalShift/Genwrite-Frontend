import { useMemo } from "react"
import type { AnimationVariants } from "../types"

/**
 * Animation hook that respects prefers-reduced-motion
 * Provides two animation tiers: normal and reduced
 *
 * @returns Animation variants for framer-motion components
 *
 * @example
 * const { panel, item, stagger } = useAnimations()
 * <motion.div variants={panel} initial="initial" animate="animate" exit="exit">
 */
export const useAnimations = (): AnimationVariants => {
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  }, [])

  const animations: AnimationVariants = useMemo(
    () => ({
      panel: {
        initial: { opacity: prefersReducedMotion ? 1 : 0, x: prefersReducedMotion ? 0 : 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: prefersReducedMotion ? 1 : 0, x: prefersReducedMotion ? 0 : -20 },
      },
      item: {
        initial: { opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 10 },
        animate: { opacity: 1, y: 0 },
      },
      stagger: { animate: { transition: { staggerChildren: prefersReducedMotion ? 0 : 0.05 } } },
    }),
    [prefersReducedMotion]
  )

  return animations
}

/**
 * Transition duration helper
 * Returns appropriate duration based on motion preference
 */
export const useTransitionDuration = () => {
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  }, [])

  return {
    /**
      Fast transitions for micro-interactions
     */
    fast: prefersReducedMotion ? 0 : 0.15,
    /**
     * Normal transitions for panels
     */
    normal: prefersReducedMotion ? 0 : 0.3,
    /**
     * Slow transitions for large movements
     */
    slow: prefersReducedMotion ? 0 : 0.5,
  }
}
