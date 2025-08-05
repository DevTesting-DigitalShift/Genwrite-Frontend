import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"
import { Provider } from "react-redux"
import { store } from "./store/index.jsx"
import { GoogleOAuthProvider } from "@react-oauth/google"
import TagManager from "react-gtm-module"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const tagManagerArgs = {
  gtmId: "GTM-WWQM5TH3", // 👉 replace with your GTM ID
}

TagManager.initialize(tagManagerArgs)

const root = ReactDOM.createRoot(document.getElementById("root"))
const queryClient = new QueryClient()

root.render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <App />
      </Provider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
)
