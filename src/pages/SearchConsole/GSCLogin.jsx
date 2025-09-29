import { fetchGscAuthUrl } from "@store/slices/gscSlice"
import { Button, message } from "antd"
import { Flex } from "antd"
import { LogIn } from "lucide-react"
import { useCallback, useState } from "react"
import { FcGoogle } from "react-icons/fc"
import { useDispatch } from "react-redux"

const GSCLogin = () => {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)
  const dispatch = useDispatch()

  // Connect to Google Search Console
  const connectGSC = useCallback(async () => {
    try {
      setIsConnecting(true)
      const authUrl = await dispatch(fetchGscAuthUrl()).unwrap()
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
      const handleMessage = (event) => {
        if (event.origin !== expectedOrigin) return
        const status = event.data || {}
        if (status === "GSC Connected") {
          message.success("Google Search Console connected!")
          clearInterval(popupCheck) // ✅ stop checking
          window.location.reload()
        } else {
          message.error(status || "Authentication failed")
          setError(status || "Authentication failed")
        }
        window.removeEventListener("message", handleMessage)
      }

      window.addEventListener("message", handleMessage)
    } catch (err) {
      message.error(err.message || "Failed to connect to Google Search Console")
      setError(err.message || "Connection failed")
      setIsConnecting(false)
    }
  }, [dispatch])

  return (
    <Flex align="center" justify="center" className="h-[80vh] p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center border border-gray-200">
        <FcGoogle size={48} className="mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Connect Google Search Console</h2>
        <p className="text-gray-600 mb-6">
          Link your Google Search Console account to view performance data.
        </p>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        <Button
          onClick={connectGSC}
          disabled={isConnecting}
          icon={<LogIn className="!size-5 mr-2" />}
          type="primary"
          loading={isConnecting}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:!bg-gradient-to-l rounded-lg h-12 text-lg font-medium tracking-wider"
        >
          {isConnecting ? "Connecting..." : "Connect GSC"}
        </Button>
      </div>
    </Flex>
  )
}

export default GSCLogin
