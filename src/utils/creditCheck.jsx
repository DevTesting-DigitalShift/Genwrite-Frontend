import { getEstimatedCost } from "./getEstimatedCost"

/**
 * Check if user has sufficient credits for an operation
 * @param {Object} user - User object with credits
 * @param {string} operationType - Type of operation (e.g., "tools.humanize", "blog.regenerate")
 * @param {string} aiModel - AI model being used
 * @returns {Object} - { hasEnough: boolean, required: number, available: number }
 */
export function checkSufficientCredits(user, operationType, aiModel = "gemini") {
  const requiredCredits = getEstimatedCost(operationType, aiModel)
  const availableCredits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)

  return {
    hasEnough: availableCredits >= requiredCredits,
    required: requiredCredits,
    available: availableCredits,
  }
}

/**
 * Get insufficient credits popup configuration
 * @param {number} required - Required credits
 * @param {number} available - Available credits
 * @param {string} featureName - Name of the feature
 * @returns {Object} - Popup configuration object
 */
export function getInsufficientCreditsPopup(required, available, featureName = "this feature") {
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
    okText: "Buy Credits",
  }
}
