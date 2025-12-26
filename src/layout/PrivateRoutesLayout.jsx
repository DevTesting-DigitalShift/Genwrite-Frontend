import { Navigate, Outlet, useNavigate, useLocation } from "react-router-dom"
import LayoutWithSidebarAndHeader from "@components/SideBar_Header"
// import ChatBox from "@components/generateBlog/ChatBox"
import { useState, useEffect } from "react"
import { RiChatAiLine } from "react-icons/ri"
import { Tooltip } from "antd"
import { useDispatch, useSelector } from "react-redux"
import { loadAuthenticatedUser } from "@store/slices/authSlice"
import { connectSocket } from "@utils/socket"

const PrivateRoutesLayout = () => {
  const token = localStorage.getItem("token")
  // const [chatOpen, setChatOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)

  // Hide chatbot on toolbox routes
  const isToolboxRoute = location.pathname.startsWith("/toolbox/")

  // Load authenticated user on mount
  useEffect(() => {
    const init = async () => {
      try {
        await dispatch(loadAuthenticatedUser()).unwrap()
      } catch {
        navigate("/login")
      }
    }

    if (token) {
      init()
      connectSocket(token)
    }
  }, [])

  // Onboarding redirect check - redirect first-time users to onboarding
  useEffect(() => {
    if (!user) return

    const hasCompletedOnboarding = localStorage.getItem("hasCompletedOnboarding") === "true"

    // Only redirect if user has no lastLogin AND hasn't completed onboarding
    // Use localStorage as fallback since backend might not update lastLogin immediately
    if (!user.lastLogin && !hasCompletedOnboarding) {
      navigate("/onboarding", { replace: true })
    }
  }, [user, navigate])

  const isToolbarRoute = location.pathname.startsWith("/toolbox/")

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
