import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"
import { Provider } from "react-redux"
import { store } from "./store/index.jsx"
import { GoogleOAuthProvider } from "@react-oauth/google"
import ReactGA from "react-ga4"
import TagManager from "react-gtm-module"

// const isProd = import.meta.env.PROD
const tagManagerArgs = {
  gtmId: "GTM-WWQM5TH3", // 👉 replace with your GTM ID
}

TagManager.initialize(tagManagerArgs)

// ReactGA.initialize("G-BPD1Y8KJFQ", {
//   testMode: !isProd, 
//   debug_mode: !isProd,
// })
// // Optional but useful for development
// ReactGA.send("pageview") 

const root = ReactDOM.createRoot(document.getElementById("root"))

root.render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <Provider store={store}>
      <App />
    </Provider>
  </GoogleOAuthProvider>
)
