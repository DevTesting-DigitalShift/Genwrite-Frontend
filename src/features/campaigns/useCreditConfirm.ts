import { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import useAuthStore from "@store/useAuthStore"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"

interface CreditConfirmOptions {
  title: string
  /** What the action does — the cost line is appended automatically. */
  description: string
  cost: number
  confirmText?: string
  onConfirm: () => void | Promise<void>
}

/**
 * Gate a credit-spending action behind a confirmation that states the price, and
 * divert to pricing when the balance can't cover it. Campaign actions (analyze,
 * generate report, apply a suggestion) all bill per blog, so the cost is worth
 * showing before the click rather than after.
 */
export function useCreditConfirm() {
  const { handlePopup } = useConfirmPopup()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const available = (user?.credits?.base || 0) + (user?.credits?.extra || 0)

  const confirmSpend = useCallback(
    ({ title, description, cost, confirmText = "Continue", onConfirm }: CreditConfirmOptions) => {
      if (available < cost) {
        handlePopup({
          title: "Not enough credits",
          description: `This needs ${cost} credits and you have ${available}. Top up to continue.`,
          confirmText: "Buy credits",
          onConfirm: () => navigate("/pricing"),
        })
        return
      }

      handlePopup({
        title,
        description: `${description} This costs ${cost} credit${cost === 1 ? "" : "s"}. You have ${available}.`,
        confirmText,
        onConfirm,
      })
    },
    [available, handlePopup, navigate]
  )

  return { confirmSpend, availableCredits: available }
}
