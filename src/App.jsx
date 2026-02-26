import { useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Helmet } from "react-helmet"
import LoadingScreen from "@components/ui/LoadingScreen"
import { ConfirmPopupProvider } from "@/context/ConfirmPopupContext"
import { LoadingProvider, useLoading } from "@/context/LoadingContext"
import { toast } from "sonner"

const AppContent = () => {
  const { isLoading, loadingMessage } = useLoading()
  const location = useLocation()

  useEffect(() => {
    const hasShown = sessionStorage.getItem("desktopWarningShown")
    if (window.innerWidth < 1024 && !hasShown) {
      toast.warning("For the best experience, please use desktop view.")
      sessionStorage.setItem("desktopWarningShown", "true")
    }
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <>
      <Helmet>
        <title>GenWrite</title>
      </Helmet>

      {isLoading && <LoadingScreen message={loadingMessage} />}

      <Outlet />
    </>
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
