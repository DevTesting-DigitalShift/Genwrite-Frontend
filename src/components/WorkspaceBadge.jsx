import { Eye, LogOut } from "lucide-react"
import useWorkspaceStore from "@store/useWorkspaceStore"

/**
 * Header pill shown only while this tab is watching someone else's workspace. States the
 * access level plainly and pairs it with a one-click exit back to your own workspace —
 * the same action as the in-page WorkspaceAccessBanner, but reachable from every route.
 */
const WorkspaceBadge = () => {
  const { activeWorkspace, exitToOwnWorkspace } = useWorkspaceStore()

  if (!activeWorkspace) return null

  const handleExit = () => {
    exitToOwnWorkspace()
    // Full reload rather than a re-render: every in-flight query was scoped to the
    // owner via the X-Watch-As header, so the cleanest way back is a fresh load.
    window.location.reload()
  }

  const ownerName = activeWorkspace.name || activeWorkspace.email || "shared workspace"

  return (
    <div className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 pl-2 pr-1 py-1">
      <Eye className="h-3.5 w-3.5 shrink-0 text-amber-600" />
      <span className="hidden sm:flex flex-col leading-tight">
        <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
          Read-only · Collaborator
        </span>
        <span className="max-w-[140px] truncate text-[11px] font-medium text-amber-900">
          {ownerName}
        </span>
      </span>
      <span className="sm:hidden text-[10px] font-bold uppercase tracking-wide text-amber-700 px-1">
        Read-only
      </span>
      <button
        type="button"
        onClick={handleExit}
        title={`Leave ${ownerName}'s workspace and return to your own`}
        aria-label="Exit shared workspace"
        className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-amber-700 border border-amber-300 hover:bg-amber-100 transition-colors"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export default WorkspaceBadge
