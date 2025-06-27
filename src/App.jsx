import { Suspense, useEffect } from "react"
import { RouterProvider } from "react-router-dom"
import router from "./router"
import Loading from "@components/Loading"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useDispatch } from "react-redux"
import { ConfirmPopupProvider } from "@/context/ConfirmPopupContext"
import { loadAuthenticatedUser } from "@store/slices/authSlice"
import { Helmet } from "react-helmet"

const App = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Helmet>
        <title>GenWrite</title>
      </Helmet>
      <ConfirmPopupProvider>
        <ToastContainer autoClose={4000} />
        <RouterProvider router={router} />
      </ConfirmPopupProvider>
    </Suspense>
  )
}

export default App
