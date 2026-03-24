import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"
import { GoogleOAuthProvider } from "@react-oauth/google"
import { QueryProvider } from "./utils/queryClient"
import { RouterProvider } from "react-router-dom"
import router from "./router"
import { Toaster } from "@components/ui/sonner"

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister()
    }
  })

  if ("caches" in window) {
    caches.keys().then(keys => {
      keys.forEach(key => caches.delete(key))
    })
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <QueryProvider>
      <RouterProvider router={router} />
      <Toaster position="top-center" />
    </QueryProvider>
  </GoogleOAuthProvider>
)
