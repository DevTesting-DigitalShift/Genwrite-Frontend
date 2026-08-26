import type { ReactNode } from "react"
import { getEstimatedCost } from "./getEstimatedCost"

interface CreditUser {
  credits?: {
    base?: number
    extra?: number
  }
}

export interface CreditCheckResult {
  hasEnough: boolean
  required: number
  available: number
}

/**
 * Check if user has sufficient credits for an operation.
 *
 * @param operationType - Type of operation (e.g., "tools.humanize", "blog.regenerate")
 */
export function checkSufficientCredits(
  user: CreditUser | null | undefined,
  operationType: string,
  aiModel: string = "gemini"
): CreditCheckResult {
  const requiredCredits = getEstimatedCost(operationType, aiModel)
  const availableCredits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)

  return {
    hasEnough: availableCredits >= requiredCredits,
    required: requiredCredits,
    available: availableCredits,
  }
}

export interface InsufficientCreditsPopup {
  title: string
  description: ReactNode
  confirmText: string
}

/** Popup configuration shown when a feature costs more credits than the user has. */
export function getInsufficientCreditsPopup(
  required: number,
  available: number,
  featureName: string = "this feature"
): InsufficientCreditsPopup {
  return {
    title: "Insufficient Credits",
    description: (
      <div>
        <p>You don't have enough credits to use {featureName}.</p>
        <p className="mt-2">
          <strong>Required:</strong> {required} credits
        </p>
        <p>
          <strong>Available:</strong> {available} credits
        </p>
      </div>
    ),
    confirmText: "Buy Credits",
  }
}
