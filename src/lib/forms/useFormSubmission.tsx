import { useCallback, useEffect, useReducer, useRef } from "react"
import { useBlocker, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { debugPayload } from "@utils/debugPayload"
import useAuthStore from "@store/useAuthStore"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"
import { useLoading } from "@/context/LoadingContext"
import { initialSubmissionState, submissionReducer } from "./submission.reducer"

interface UseFormSubmissionOptions<TPayload> {
  /** Shown in the loading overlay, e.g. "Creating quick blog...". */
  loadingMessage: string
  /** Name passed to the payload debugger. */
  debugName: string
  /**
   * Credits the request will cost, read at submit time (so the form needn't watch its values
   * just to feed this). Omit for free requests (no balance check).
   */
  getEstimatedCost?: () => number | undefined
  /** Performs the request. Throw to report failure; the message is toasted. */
  send: (payload: TPayload) => Promise<unknown>
  /** Runs after a successful `send` (reset the form, navigate...). */
  onSuccess?: () => void
}

/**
 * What every create form does after validation passes: check the credit balance (offering
 * the pricing page when short), honour payload-debug mode, show the loading overlay, run the
 * request, and report failure without losing the user's input. The form stays mounted on
 * error so they can retry.
 */
export function useFormSubmission<TPayload>({
  loadingMessage,
  debugName,
  getEstimatedCost,
  send,
  onSuccess,
}: UseFormSubmissionOptions<TPayload>) {
  const [state, dispatch] = useReducer(submissionReducer, initialSubmissionState)
  /** True from the moment a request is sent until it fails — navigating away is then expected. */
  const sentRef = useRef(false)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const { handlePopup } = useConfirmPopup()
  const { showLoading, hideLoading } = useLoading()

  const submit = useCallback(
    async (payload: TPayload) => {
      dispatch({ type: "SUBMIT_START" })

      const estimatedCost = getEstimatedCost?.()
      const balance = (user?.credits?.base || 0) + (user?.credits?.extra || 0)
      if (estimatedCost !== undefined && balance < estimatedCost) {
        handlePopup({
          title: "Insufficient Credits",
          description: (
            <div>
              <p>You don't have enough credits for this request.</p>
              <p className="mt-1">
                <strong>Required:</strong> {estimatedCost} credits
              </p>
              <p>
                <strong>Available:</strong> {balance} credits
              </p>
            </div>
          ),
          confirmText: "Buy Credits",
          onConfirm: () => navigate("/pricing"),
        })
        dispatch({ type: "SUBMIT_ABORTED" })
        return false
      }

      if (debugPayload(debugName, payload)) {
        dispatch({ type: "SUBMIT_ABORTED" })
        return false
      }

      const loadingId = showLoading(loadingMessage)
      sentRef.current = true
      try {
        await send(payload)
        dispatch({ type: "SUBMIT_SUCCEEDED" })
        onSuccess?.()
        return true
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Something went wrong. Please try again."
        sentRef.current = false
        dispatch({ type: "SUBMIT_FAILED", error: message })
        toast.error(message)
        return false
      } finally {
        hideLoading(loadingId)
      }
    },
    [
      user,
      getEstimatedCost,
      debugName,
      loadingMessage,
      send,
      onSuccess,
      handlePopup,
      navigate,
      showLoading,
      hideLoading,
    ]
  )

  return {
    status: state.status,
    error: state.error,
    isSubmitting: state.status === "submitting",
    submit,
    sentRef,
  }
}

/**
 * Cancel/back for a page-level form: return to wherever the user came from, or the
 * dashboard when the form was opened directly (a deep link has no history to go back to).
 */
export function useCancelNavigation(fallback = "/dashboard") {
  const navigate = useNavigate()
  const location = useLocation()
  return useCallback(() => {
    if (location.key !== "default") navigate(-1)
    else navigate(fallback, { replace: true })
  }, [navigate, location.key, fallback])
}

/**
 * Asks before leaving a page-level form with unsaved edits (back button, links, the browser's
 * history). A form whose request has been sent — `sentRef` from `useFormSubmission` — is
 * allowed to leave, since the submit itself navigates away.
 */
export function useUnsavedChangesGuard(isDirty: boolean, sentRef: { current: boolean }) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !sentRef.current && currentLocation.pathname !== nextLocation.pathname
  )

  useEffect(() => {
    if (blocker.state !== "blocked") return
    if (window.confirm("You have unsaved changes. Leave this page and discard them?")) {
      blocker.proceed()
    } else {
      blocker.reset()
    }
  }, [blocker])

  // The browser's own reload / tab-close prompt.
  useEffect(() => {
    if (!isDirty) return
    const warn = (event: BeforeUnloadEvent) => {
      if (sentRef.current) return
      event.preventDefault()
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [isDirty, sentRef])
}
