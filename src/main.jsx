import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"
import { Provider } from "react-redux"
import { store } from "./store/index.jsx"
import { GoogleOAuthProvider } from "@react-oauth/google"
import { QueryProvider } from "./utils/queryClient.jsx"

const root = ReactDOM.createRoot(document.getElementById("root"))

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js")
}

root.render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <QueryProvider>
      <Provider store={store}>
        <App />
      </Provider>
    </QueryProvider>
  </GoogleOAuthProvider>
)
