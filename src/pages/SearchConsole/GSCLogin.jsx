import useGscStore from "@store/useGscStore"
import toast from "@utils/toast"
import { LogIn } from "lucide-react"
import { useCallback, useState } from "react"
import { FcGoogle } from "react-icons/fc"

const GSCLogin = () => {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)
  const { fetchGscAuthUrl } = useGscStore()

  // Connect to Google Search Console
  const connectGSC = useCallback(async () => {
    try {
      setIsConnecting(true)
      const authUrl = await fetchGscAuthUrl()
      const popup = window.open(authUrl, "GSC Connect", "width=600,height=600")
      if (!popup) {
        throw new Error("Popup blocked. Please allow popups and try again.")
      }
      const popupCheck = setInterval(() => {
        if (popup.closed) {
          clearInterval(popupCheck)
          window.removeEventListener("message", handleMessage)
          setIsConnecting(false)
        }
      }, 1000)

      const expectedOrigin = new URL(import.meta.env.VITE_BACKEND_URL).origin
      const handleMessage = event => {
        if (event.origin !== expectedOrigin) return
        const status = event.data || {}
        if (status === "GSC Connected") {
          toast.success("Google Search Console connected!")
          clearInterval(popupCheck) // ✅ stop checking
          window.location.reload()
        } else {
          toast.error(status || "Authentication failed")
          setError(status || "Authentication failed")
        }
        window.removeEventListener("message", handleMessage)
      }

      window.addEventListener("message", handleMessage)
    } catch (err) {
      toast.error(err.message || "Failed to connect to Google Search Console")
      setError(err.message || "Connection failed")
      setIsConnecting(false)
    }
  }, [fetchGscAuthUrl])

  return (
    <div className="flex items-center justify-center h-[80vh] p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center border border-gray-200">
        <FcGoogle size={48} className="mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Connect Google Search Console</h2>
        <p className="text-gray-600 mb-6">
          Link your Google Search Console account to view performance data.
        </p>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        <button
          onClick={connectGSC}
          disabled={isConnecting}
          className={`btn w-full bg-linear-to-r from-blue-600 to-purple-600 hover:opacity-90 border-none rounded-lg h-12 text-lg font-medium tracking-wider text-white ${
            isConnecting ? "loading" : ""
          }`}
        >
          {!isConnecting && <LogIn className="size-5 mr-2 inline-block" />}
          {isConnecting ? "Connecting..." : "Connect GSC"}
        </button>
      </div>
    </div>
  )
}

export default GSCLogin
