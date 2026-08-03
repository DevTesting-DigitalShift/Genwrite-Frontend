import { useEffect, useState } from "react"
import { Navigate, Outlet, useNavigate } from "react-router-dom"
import { adminRefreshToken } from "../features/auth/api/authApi"
import { getAuthToken, isAuthenticated, setAuthToken } from "./authToken"

/**
 * Gates all admin routes (except /admin/login) behind a valid admin
 * session. Optimistically authorizes if a token already exists
 * (avoids a loading flash on sub-route navigation), then verifies/refreshes
 * once in the background via the httpOnly refresh cookie.
 */
export default function AdminProtectedRoute() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(!isAuthenticated())
  const [isAuthorized, setIsAuthorized] = useState(isAuthenticated())

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getAuthToken()

        if (!token) {
          try {
            const { accessToken } = await adminRefreshToken()
            setAuthToken(accessToken)
            setIsAuthorized(true)
          } catch {
            navigate("/admin/login", { replace: true })
          }
        } else {
          setIsAuthorized(true)
        }
      } catch {
        navigate("/admin/login", { replace: true })
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
    // Runs once on mount; ProtectedRoute stays mounted across sub-route navigation.
  }, [])

  if (isLoading && !isAuthorized) {
    return <div className="min-h-screen bg-slate-50/50 animate-pulse" />
  }

  if (!isAuthorized) {
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}
