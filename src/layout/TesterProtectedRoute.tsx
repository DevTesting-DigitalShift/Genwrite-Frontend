import { Navigate, Outlet } from "react-router-dom"
import useAuthStore from "@store/useAuthStore"
import useWorkspaceStore from "@store/useWorkspaceStore"

// Gates beta routes (currently campaigns) behind role: "tester" or "admin".
// Mirrors the backend's requireCampaignsBetaAccess (routes/private.route.js): a watcher
// viewing someone else's workspace passes through untouched, same as the backend does for
// them, since blockWatcherWrites already keeps them read-only regardless of their own role.
// Mounted under PrivateRoutesLayout, which already guarantees `user` is loaded before this
// renders.
const TesterProtectedRoute = () => {
  const { user } = useAuthStore()
  const { activeWorkspace } = useWorkspaceStore()
  const canAccess = !!activeWorkspace || user?.role === "tester" || user?.role === "admin"

  return canAccess ? <Outlet /> : <Navigate to="/dashboard" replace />
}

export default TesterProtectedRoute
