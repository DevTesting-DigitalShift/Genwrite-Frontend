import { Suspense, useEffect } from "react"
import { Outlet } from "react-router-dom"
import { Helmet } from "react-helmet"
import LoadingScreen from "@components/UI/LoadingScreen"
import { message } from "antd"
import { ConfirmPopupProvider } from "@/context/ConfirmPopupContext"

const App = () => {
  // Show desktop warning on mobile devices
  useEffect(() => {
    const hasShown = sessionStorage.getItem("desktopWarningShown")
    if (window.innerWidth < 1024 && !hasShown) {
      message.warning("For the best experience, please use desktop view.", 5)
      sessionStorage.setItem("desktopWarningShown", "true")
    }
  }, [])

  return (
    <ConfirmPopupProvider>
      <Suspense fallback={<LoadingScreen />}>
        <Helmet>
          <title>GenWrite</title>
        </Helmet>

        <Outlet />
      </Suspense>
    </ConfirmPopupProvider>
  )
}

export default App
