import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"

export const useProAction = () => {
  const navigate = useNavigate()
  const user = useSelector(state => state.auth.user)
  const { handlePopup } = useConfirmPopup()

  const userPlan = user?.plan ?? user?.subscription?.plan
  const totalCredits = (user?.credits?.base || 0) + (user?.credits?.extra || 0)

  const showTrialMessage =
    user?.subscription?.plan === "free" &&
    user?.subscription?.status === "unpaid" &&
    totalCredits == 0

  const handleProAction = (callback, options = {}) => {
    if (showTrialMessage) {
      handlePopup({
        title: options.title || "Upgrade Required",
        description:
          "You currently don’t have an active plan. Upgrade your plan to access this feature.",
        confirmText: options.confirmText || "Upgrade",
        cancelText: options.cancelText || "Cancel",
        onConfirm: () => navigate("/pricing"),
      })
      return
    }

    // User is allowed
    callback?.()
  }

  return { handleProAction, showTrialMessage }
}
