import { Suspense, useEffect } from "react"
import { Outlet } from "react-router-dom"
import { Helmet } from "react-helmet"
import LoadingScreen from "@components/UI/LoadingScreen"
import { message } from "antd"
import { ConfirmPopupProvider } from "@/context/ConfirmPopupContext"
import { useSelector } from "react-redux"

const App = () => {
  // Get blog loading state from Redux
  const blogLoading = useSelector(state => state.blog?.loading)

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

        {/* Show loading screen when blog is being created */}
        {blogLoading && <LoadingScreen />}

        <Outlet />
      </Suspense>
    </ConfirmPopupProvider>
  )
}

export default App
