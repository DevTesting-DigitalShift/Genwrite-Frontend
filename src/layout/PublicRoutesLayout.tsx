import { Navigate, Outlet, useLocation, useSearchParams } from "react-router-dom"
import { getActiveSession } from "@utils/sessionStore"

const PublicRoutesLayout = () => {
  const hasSession = !!getActiveSession()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const isAddingAccount = searchParams.get("mode") === "add-account"

  // Routes that should redirect to dashboard if user is logged in — skipped when
  // adding a second account, since being logged in elsewhere is the whole point.
  const authRoutes = ["/login", "/signup"]
  const shouldRedirect = hasSession && authRoutes.includes(location.pathname) && !isAddingAccount

  // If user is logged in and trying to access login/signup, redirect to dashboard
  if (shouldRedirect) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div>
      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

export default PublicRoutesLayout
