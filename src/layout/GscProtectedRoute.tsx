import { Navigate, Outlet } from "react-router-dom"
import useAuthStore from "@store/useAuthStore"

// Gates campaign routes behind an active Google Search Console connection,
// since campaign analysis is driven by GSC clicks/impressions data.
// Mounted under PrivateRoutesLayout, which already guarantees `user` is loaded before this renders.
const GscProtectedRoute = () => {
  const { user } = useAuthStore()
  const hasGscAccess = !!user?.gsc

  return hasGscAccess ? <Outlet /> : <Navigate to="/blog-performance" replace />
}

export default GscProtectedRoute
