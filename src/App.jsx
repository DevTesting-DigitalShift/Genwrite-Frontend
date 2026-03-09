import { useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Helmet } from "react-helmet"
import LoadingScreen from "@components/ui/LoadingScreen"
import { ConfirmPopupProvider } from "@/context/ConfirmPopupContext"
import { LoadingProvider, useLoading } from "@/context/LoadingContext"
import { toast } from "sonner"
import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"

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

const stripePromise = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

const App = () => {
  return (
    <Elements stripe={stripePromise}>
      <LoadingProvider>
        <ConfirmPopupProvider>
          <AppContent />
        </ConfirmPopupProvider>
      </LoadingProvider>
    </Elements>
  )
}

export default App
