import { Suspense, useEffect } from "react"
import { RouterProvider } from "react-router-dom"
import router from "./router"
import { ConfirmPopupProvider } from "@/context/ConfirmPopupContext"
import { Helmet } from "react-helmet"
import { connectSocket } from "@utils/socket"
import { message } from "antd"
import LoadingScreen from "@components/UI/LoadingScreen"

const App = () => {
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      connectSocket(token)
    }
  }, [])

  useEffect(() => {
    const hasShown = sessionStorage.getItem("desktopWarningShown")

    if (window.innerWidth < 1024 && !hasShown) {
      message.warning("For the best experience, please use desktop view.", 5)
      sessionStorage.setItem("desktopWarningShown", "true")
    }
  }, [])

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Helmet>
        <title>GenWrite</title>
      </Helmet>
      <ConfirmPopupProvider>
        <RouterProvider router={router} />
      </ConfirmPopupProvider>
    </Suspense>
  )
}

export default App
