import { Navigate, Outlet, useNavigate, useLocation } from "react-router-dom"
import LayoutWithSidebarAndHeader from "@components/SideBar_Header"
// import ChatBox from "@components/generateBlog/ChatBox"
import { useState, useEffect } from "react"
import { RiChatAiLine } from "react-icons/ri"
import { Tooltip } from "antd"
import useAuthStore from "@store/useAuthStore"
import { connectSocket } from "@utils/socket"
import LoadingScreen from "@components/UI/LoadingScreen"
import WhatsAppFloatButton from "@components/WhatsAppFloatBtn"

const PrivateRoutesLayout = () => {
  const token = localStorage.getItem("token")
  // const [chatOpen, setChatOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading, loadAuthenticatedUser } = useAuthStore()

  // Hide chatbot on toolbox routes
  const isToolboxRoute = location.pathname.startsWith("/toolbox/")

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

  const isToolbarRoute = location.pathname.startsWith("/toolbox/")

  // Show loading screen while authenticating or connecting socket
  if ((loading && !user) || (token && !isSocketConnected)) {
    return <LoadingScreen message="Authenticating..." />
  }

  return token ? (
    <>
      <div className="flex flex-col min-h-screen">
        <LayoutWithSidebarAndHeader />

        <div
          className={`flex-1 ml-0 md:ml-16 pt-16 sm:pt-20 ${
            isToolbarRoute ? "px-0 pl-2" : " px-3 md:px-6"
          }`}
        >
          {/* Chatbot Button (hidden on /toolbox/:id) */}
          {/* {!isToolboxRoute && (
            <>
              <Tooltip
                title="Chatbot"
                styles={{
                  fontSize: "12px",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  maxWidth: "150px",
                }}
              >
                <div
                  onClick={() => setChatOpen(true)}
                  className="rounded-full bg-blue-500 fixed z-40 bottom-4 sm:bottom-6 right-4 sm:right-6 transition ease-linear duration-300 cursor-pointer hover:shadow-lg shadow-md hover:translate-y-0.5"
                >
                  <RiChatAiLine className="p-2 sm:p-3 size-10 sm:size-12 text-white" />
                </div>
              </Tooltip>

              <ChatBox isOpen={chatOpen} onClose={() => setChatOpen(false)} />
            </>
          )} */}

          <main>
            <Outlet />
          </main>
        </div>

        {/* WhatsApp Floating Button - responsive, visible on all private screens */}
        <WhatsAppFloatButton
          phoneNumber="917530003383" // TODO: Replace with your actual WhatsApp number
          message="Hi! I'm interested in learning more about GenWrite."
          tooltipText="Chat with us on WhatsApp"
          position="bottom-right"
          size="medium"
          showPulse={true}
        />
      </div>

      {/* Tooltip Styling */}
      <style>
        {`
          .ant-tooltip-inner {
            font-size: 12px !important;
            padding: 6px 10px !important;
            border-radius: 6px !important;
          }
          @media (max-width: 640px) {
            .ant-tooltip-inner {
              font-size: 10px !important;
              max-width: 120px !important;
            }
          }
        `}
      </style>
    </>
  ) : (
    <Navigate to="/login" replace />
  )
}

export default PrivateRoutesLayout
