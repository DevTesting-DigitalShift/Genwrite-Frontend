import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"
import { Provider } from "react-redux"
import { store } from "./store"
import { GoogleOAuthProvider } from "@react-oauth/google"
import { QueryProvider } from "./utils/queryClient"
import { RouterProvider } from "react-router-dom"
import router from "./router"
import { ConfirmPopupProvider } from "@/context/ConfirmPopupContext"

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js")
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <QueryProvider>
      <Provider store={store}>
        <ConfirmPopupProvider>
          <RouterProvider router={router}>
            <App />
          </RouterProvider>
        </ConfirmPopupProvider>
      </Provider>
    </QueryProvider>
  </GoogleOAuthProvider>
)
