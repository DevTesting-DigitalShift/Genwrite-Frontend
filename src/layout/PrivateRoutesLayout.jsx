import { Navigate, Outlet, useNavigate, useLocation } from "react-router-dom"
import LayoutWithSidebarAndHeader from "@components/SideBar_Header"
// import ChatBox from "@components/generateBlog/ChatBox"
import { useState, useEffect } from "react"
import { RiChatAiLine } from "react-icons/ri"
import useAuthStore from "@store/useAuthStore"
import { connectSocket } from "@utils/socket"
import LoadingScreen from "@components/ui/LoadingScreen"
import WhatsAppFloatButton from "@components/WhatsAppFloatBtn"
import PaymentPendingModal from "@components/PaymentPendingModal"

const PrivateRoutesLayout = () => {
  const token = localStorage.getItem("token")
  // const [chatOpen, setChatOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading, loadAuthenticatedUser } = useAuthStore()

  const [isSocketConnected, setIsSocketConnected] = useState(false)

  // Load authenticated user on mount
  useEffect(() => {
    const init = async () => {
      try {
        await loadAuthenticatedUser()
      } catch {
        localStorage.removeItem("token")
        navigate("/login")
      }
    }

    if (token) {
      connectSocket(token)
      setIsSocketConnected(true)
      init()
    } else {
      setIsSocketConnected(true)
    }
  }, [])

  // Onboarding redirect check - redirect first-time users to onboarding
  useEffect(() => {
    if (!user || !user._id) return

    // Use user-specific localStorage key to track onboarding completion
    const hasCompletedOnboarding =
      localStorage.getItem(`hasCompletedOnboarding_${user._id}`) === "true"

    // Only redirect if user has no lastLogin AND hasn't completed onboarding
    // Use localStorage as fallback since backend might not update lastLogin immediately
    if (!user.lastLogin && !hasCompletedOnboarding) {
      navigate("/onboarding", { replace: true })
    }
  }, [user, navigate])

  // Show loading screen while authenticating or connecting socket
  if ((loading && !user) || (token && !isSocketConnected)) {
    return <LoadingScreen message="Authenticating..." />
  }

  return token ? (
    <>
      <div className="flex flex-col min-h-screen">
        <LayoutWithSidebarAndHeader />

        <div className="flex-1 ml-0 md:ml-16 pt-16 sm:pt-20 px-3 md:px-6">
          <main>
            <Outlet />
          </main>
        </div>
        <WhatsAppFloatButton
          phoneNumber="917530003383"
          message="Hi! I'm interested in learning more about GenWrite."
          tooltipText="Chat with us on WhatsApp"
          position="bottom-right"
          size="medium"
          showPulse={true}
        />
      </div>

      <PaymentPendingModal user={user} />
    </>
  ) : (
    <Navigate to="/login" replace />
  )
}

export default PrivateRoutesLayout
