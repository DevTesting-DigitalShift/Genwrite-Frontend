import { Navigate, Outlet, useNavigate, useLocation } from "react-router-dom"
import LayoutWithSidebarAndHeader from "@components/SideBar_Header"
import { useState, useEffect } from "react"
import useAuthStore from "@store/useAuthStore"
import { connectSocket } from "@utils/socket"
import LoadingScreen from "@components/ui/LoadingScreen"
import WhatsAppFloatButton from "@components/WhatsAppFloatBtn"
import PaymentPendingModal from "@components/PaymentPendingModal"
import { useProAction } from "@/hooks/useProAction"
import { useConfirmPopup } from "@/context/ConfirmPopupContext"

// Routes that needsUpgrade users are allowed to visit freely
const ALLOWED_ROUTES = [
  "/pricing",
  "/transactions",
  "/profile",
  "/contact",
  "/onboarding",
  "/email-verify",
  "/verify-email",
]

const PrivateRoutesLayout = () => {
  const token = localStorage.getItem("token")
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading, loadAuthenticatedUser } = useAuthStore()
  const { needsUpgrade } = useProAction()
  const { handlePopup } = useConfirmPopup()

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

  // Onboarding redirect check
  useEffect(() => {
    if (!user || !user._id) return
    const hasCompletedOnboarding =
      localStorage.getItem(`hasCompletedOnboarding_${user._id}`) === "true"
    if (!user.lastLogin && !hasCompletedOnboarding) {
      navigate("/onboarding", { replace: true })
    }
  }, [user, navigate])

  // Intercept ALL navigation for users who haven't picked a plan yet
  useEffect(() => {
    if (!needsUpgrade) return
    if (!user) return

    const currentPath = location.pathname
    const isAllowed = ALLOWED_ROUTES.some(r => currentPath.startsWith(r))
    if (isAllowed) return

    // Push them to /pricing
    navigate("/pricing", { replace: true })
  }, [location.pathname, needsUpgrade, user])

  // Show loading screen while authenticating or connecting socket
  if ((loading && !user) || (token && !isSocketConnected)) {
    return <LoadingScreen message="Authenticating..." />
  }

  const bareRoutes = ["/onboarding", "/email-verify", "/verify-email"]
  const isBareRoute = bareRoutes.some(path => location.pathname.startsWith(path))

  if (isBareRoute) {
    return token ? <Outlet /> : <Navigate to="/login" replace />
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
