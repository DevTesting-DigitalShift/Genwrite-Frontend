import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"
import { Provider } from "react-redux"
import { store } from "./store/index.jsx"
import { GoogleOAuthProvider } from "@react-oauth/google"
import ReactGA from "react-ga4"

// Enable testMode only in development
const isProd = import.meta.env.PROD

ReactGA.initialize("G-0BBLW98TFM", {
  testMode: !isProd, // ✅ testMode is true only in dev
  debug_mode: !isProd, // optional: enable GA debug mode too
})
// Optional but useful for development
ReactGA.send("pageview") // Send initial pageview

const root = ReactDOM.createRoot(document.getElementById("root"))

root.render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <Provider store={store}>
      <App />
    </Provider>
  </GoogleOAuthProvider>
)
