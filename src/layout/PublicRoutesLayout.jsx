import { Navigate, Outlet, useLocation } from "react-router-dom"
import { motion } from "framer-motion"

const PublicRoutesLayout = () => {
  const token = localStorage.getItem("token")
  const location = useLocation()

  // Routes that should redirect to dashboard if user is logged in
  const authRoutes = ["/login", "/signup"]
  const shouldRedirect = token && authRoutes.includes(location.pathname)

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
