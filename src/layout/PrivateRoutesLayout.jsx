import { Navigate, Outlet, useNavigate, useLocation } from "react-router-dom"
import LayoutWithSidebarAndHeader from "@components/SideBar_Header"
import { useState, useEffect, useRef } from "react"
import useAuthStore from "@store/useAuthStore"
import { connectSocket } from "@utils/socket"
import LoadingScreen from "@components/ui/LoadingScreen"
import WhatsAppFloatButton from "@components/WhatsAppFloatBtn"
import PaymentPendingModal from "@components/PaymentPendingModal"
import { useProAction } from "@/hooks/useProAction"
import UpgradeModal from "@components/UpgradeModal"
import WorkspaceAccessBanner from "@components/WorkspaceAccessBanner"
import SessionExpiredModal from "@components/SessionExpiredModal"
import { getActiveToken, removeSession, getActiveSession } from "@utils/sessionStore"
import { toast } from "sonner"

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
  const token = getActiveToken()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading, loadAuthenticatedUser } = useAuthStore()
  const { needsUpgrade } = useProAction()

  const [isSocketConnected, setIsSocketConnected] = useState(false)
  const activeUserIdRef = useRef(getActiveSession()?.userId)

  const isPublicPath = location.pathname.startsWith("/blog/")

  // If the active account changes in ANOTHER tab (e.g. switched there), this tab's
  // in-memory user/token would silently go stale — nudge the user to reload instead
  // of letting it send requests as the wrong account. The native `storage` event only
  // fires in other tabs (never the one that made the change), which is exactly the
  // "cross-tab only" signal we want here.
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== "gw_sessions") return
      const nowActive = getActiveSession()?.userId
      if (nowActive && nowActive !== activeUserIdRef.current) {
        activeUserIdRef.current = nowActive
        toast.info("Account changed in another tab.", {
          action: { label: "Reload", onClick: () => window.location.reload() },
          duration: 10000,
        })
      }
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  // Load authenticated user on mount
  useEffect(() => {
    const init = async () => {
      try {
        await loadAuthenticatedUser()
      } catch {
        const active = getActiveSession()
        if (active) removeSession(active.userId)
        if (!isPublicPath) {
          navigate("/login")
        }
      }
    }

    if (token) {
      connectSocket(token)
      setIsSocketConnected(true)
      init()
    } else {
      setIsSocketConnected(true)
    }
  }, [token, navigate, loadAuthenticatedUser, isPublicPath])

  const isAllowed =
    ALLOWED_ROUTES.some((path) => location.pathname.startsWith(path)) || isPublicPath

  // Onboarding redirect check
  useEffect(() => {
    if (!user?._id) return
    const hasCompletedOnboarding =
      localStorage.getItem(`hasCompletedOnboarding_${user._id}`) === "true"
    if (!user.lastLogin && !hasCompletedOnboarding) {
      navigate("/onboarding", { replace: true })
    }
  }, [user, navigate])

  // For guest users on public links, bypass auth checks immediately. Checked after
  // every hook above has run unconditionally (rules-of-hooks) — isPublicPath can flip
  // within the same mounted layout instance via client-side navigation (e.g. a public
  // blog page -> a private route) without this component unmounting.
  if (!token && isPublicPath) {
    return <Outlet />
  }

  // Show loading screen while authenticating or connecting socket
  if ((loading && !user) || (token && !isSocketConnected)) {
    return <LoadingScreen message="Authenticating..." />
  }

  const bareRoutes = ["/onboarding", "/email-verify", "/verify-email"]
  const isBareRoute = bareRoutes.some((path) => location.pathname.startsWith(path))

  if (isBareRoute) {
    return token ? <Outlet /> : <Navigate to="/login" replace />
  }

  return token ? (
    <>
      <div className="flex flex-col min-h-screen">
        <LayoutWithSidebarAndHeader />

        <div className="flex-1 ml-0 md:ml-16 pt-16 sm:pt-20 px-3 md:px-6">
          <main>
            <WorkspaceAccessBanner />
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
      {/* If user needs upgrade and hits a restricted route, show the lock modal instead of silent redirect */}
      {needsUpgrade && !isAllowed && <UpgradeModal featureName="Full Dashboard Access" />}
      <SessionExpiredModal />
    </>
  ) : (
    <Navigate to="/login" replace />
  )
}

export default PrivateRoutesLayout
