import { Navigate, Outlet, useNavigate, useLocation } from "react-router-dom"
import LayoutWithSidebarAndHeader from "@components/SideBar_Header"
import { useState, useEffect } from "react"
import useAuthStore from "@store/useAuthStore"
import { connectSocket } from "@utils/socket"
import LoadingScreen from "@components/ui/LoadingScreen"
import WhatsAppFloatButton from "@components/WhatsAppFloatBtn"
import PaymentPendingModal from "@components/PaymentPendingModal"
import { useProAction } from "@/hooks/useProAction"
import UpgradeModal from "@components/UpgradeModal"
import WorkspaceAccessBanner from "@components/WorkspaceAccessBanner"
import SessionExpiredModal from "@components/SessionExpiredModal"
import {
  removeSession,
  getActiveSession,
  getSessions,
  getActiveUserId,
} from "@utils/sessionStore"
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
  const navigate = useNavigate()
  const location = useLocation()
  const { user, token, loading, loadAuthenticatedUser } = useAuthStore()
  const { needsUpgrade } = useProAction()

  const [isSocketConnected, setIsSocketConnected] = useState(false)
  // Tracks whether the mount-time auth check (loadAuthenticatedUser's cookie-based
  // refresh) is still in flight, for accounts that have a session but no in-memory
  // access token yet. Starts true only when there's a session worth checking —
  // otherwise there's nothing to wait for.
  const [checkingAuth, setCheckingAuth] = useState(!!getActiveSession())

  const isPublicPath = location.pathname.startsWith("/blog/")

  // Each tab pins its own account (sessionStorage), so another tab switching accounts is
  // none of this tab's business — it keeps running its own. The one cross-tab change that
  // DOES concern us is this tab's account being signed out elsewhere: its token is gone
  // from the shared pool, so every further request would 401. Only that case reacts.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== "gw_sessions") return

      // Read live rather than from a ref captured at mount: this tab may have switched
      // accounts since, and a stale id would fire this warning for the wrong account.
      // sessionStorage is updated synchronously on switch, so it is always current.
      const myUserId = getActiveUserId()
      if (!myUserId) return

      const stillSignedIn = getSessions().some((s) => s.userId === myUserId)
      if (stillSignedIn) return

      toast.error("You were signed out of this account in another tab.", {
        action: { label: "Reload", onClick: () => window.location.reload() },
        duration: Number.POSITIVE_INFINITY,
      })
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  // Load authenticated user on mount. Gated on whether a session EXISTS, not on
  // already having an access token — loadAuthenticatedUser is what obtains the token
  // in the first place (via the cookie-based refresh), so gating on `token` here
  // would mean it never runs and every session bounces straight to /login.
  useEffect(() => {
    if (!getActiveSession()) {
      setIsSocketConnected(true)
      setCheckingAuth(false)
      return
    }

    const init = async () => {
      try {
        await loadAuthenticatedUser()
      } catch {
        const active = getActiveSession()
        // Couldn't authenticate — detach rather than adopt another account, so /login
        // actually shows the login form instead of bouncing back in as someone else.
        if (active) removeSession(active.userId, { adoptNext: false })
        if (!isPublicPath) {
          navigate("/login")
        }
      } finally {
        setCheckingAuth(false)
      }
    }

    init()
  }, [navigate, loadAuthenticatedUser, isPublicPath])

  // Connect the socket once a live access token is available — set by the refresh
  // above, by login, or by switching accounts.
  useEffect(() => {
    if (token) {
      connectSocket(token)
      setIsSocketConnected(true)
    }
  }, [token])

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
  if (!getActiveSession() && isPublicPath) {
    return <Outlet />
  }

  // Show loading screen while authenticating or connecting socket
  if (checkingAuth || (loading && !user) || (token && !isSocketConnected)) {
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
