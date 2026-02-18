/**
 * A simple toast utility that dispatches custom events to be caught by the global toast listener in App.jsx.
 * Mimics the API of react-hot-toast for easy replacement.
 */

const dispatchToast = (message, type) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("show-toast", { detail: { message, type } }))
  }
}

const toast = {
  success: message => dispatchToast(message, "alert-success"),
  error: message => dispatchToast(message, "alert-error"),
  loading: message => dispatchToast(message, "alert-info"), // DaisyUI doesn't have a specific loading toast style by default, using info
  custom: (message, type = "alert-info") => dispatchToast(message, type),
  dismiss: () => {
    // Current implementation in App.jsx sets a timeout, but doesn't support manual programmatic dismissal via ID.
    // This is a stub to prevent errors if called.
  },
}

export default toast
