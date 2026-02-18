import { Suspense, useEffect, useState } from "react"
import { Outlet } from "react-router-dom"
import { Helmet } from "react-helmet"
import LoadingScreen from "@components/UI/LoadingScreen"
import { ConfirmPopupProvider } from "@/context/ConfirmPopupContext"
import { LoadingProvider, useLoading } from "@/context/LoadingContext"
import { X } from "lucide-react"

const AppContent = () => {
  const { isLoading, loadingMessage } = useLoading()
  const [toast, setToast] = useState(null)

  // Listen for custom toast events
  useEffect(() => {
    const handleToast = event => {
      const { message, type } = event.detail
      setToast({ message, type: type || "alert-info" })
      setTimeout(() => setToast(null), 3000)
    }

    window.addEventListener("show-toast", handleToast)
    return () => window.removeEventListener("show-toast", handleToast)
  }, [])

  // Show desktop warning on mobile devices
  useEffect(() => {
    const hasShown = sessionStorage.getItem("desktopWarningShown")
    if (window.innerWidth < 1024 && !hasShown) {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: {
            message: "For the best experience, please use desktop view.",
            type: "alert-warning",
          },
        })
      )
      sessionStorage.setItem("desktopWarningShown", "true")
    }
  }, [])

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Helmet>
        <title>GenWrite</title>
      </Helmet>

      {/* Show loading screen from LoadingContext */}
      {isLoading && <LoadingScreen message={loadingMessage} />}

      {/* Global DaisyUI Toast */}
      {toast && (
        <div className="toast toast-top toast-end z-[9999]">
          <div className={`alert ${toast.type} shadow-lg rounded-xl border-none`}>
            <span>{toast.message}</span>
            <button className="btn btn-xs btn-circle btn-ghost" onClick={() => setToast(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <Outlet />
    </Suspense>
  )
}

const App = () => {
  return (
    <LoadingProvider>
      <ConfirmPopupProvider>
        <AppContent />
      </ConfirmPopupProvider>
    </LoadingProvider>
  )
}

export default App
