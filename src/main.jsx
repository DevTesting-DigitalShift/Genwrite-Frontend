import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"
import { Provider } from "react-redux"
import { store } from "./store"
import { GoogleOAuthProvider } from "@react-oauth/google"
import { QueryProvider } from "./utils/queryClient"
import { RouterProvider } from "react-router-dom"
import router from "./router"

const isIOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)

async function cleanupIOSServiceWorkers() {
  if (!("serviceWorker" in navigator)) return

  const regs = await navigator.serviceWorker.getRegistrations()
  await Promise.all(regs.map(reg => reg.unregister()))

  if ("caches" in window) {
    const keys = await caches.keys()
    await Promise.all(keys.map(k => caches.delete(k)))
  }
}

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  if (isIOS) {
    // HARD STOP: iOS cleanup only
    cleanupIOSServiceWorkers()
  } else {
    // Desktop + Android only
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js")
    })
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <QueryProvider>
      <Provider store={store}>
        <RouterProvider router={router}>
          <App />
        </RouterProvider>
      </Provider>
    </QueryProvider>
  </GoogleOAuthProvider>
)
