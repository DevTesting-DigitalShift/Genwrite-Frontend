import { Eye, ArrowLeftRight } from "lucide-react"
import useWorkspaceStore from "@store/useWorkspaceStore"

const WorkspaceAccessBanner = () => {
  const { activeWorkspace, exitToOwnWorkspace } = useWorkspaceStore()

  if (!activeWorkspace) return null

  const handleExit = () => {
    exitToOwnWorkspace()
    window.location.reload()
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-9 w-9 rounded-full bg-amber-100 shrink-0">
          <Eye className="h-4 w-4 text-amber-600" />
        </div>
        <p className="text-sm text-amber-900">
          Viewing <span className="font-semibold">{activeWorkspace.name}</span>'s workspace —{" "}
          <span className="font-semibold">read-only</span>
        </p>
      </div>
      <button
        type="button"
        onClick={handleExit}
        className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-white border border-amber-300 rounded-md px-3 py-1.5 hover:bg-amber-100 transition-colors"
      >
        <ArrowLeftRight className="h-3.5 w-3.5" />
        Back to my workspace
      </button>
    </div>
  )
}

export default WorkspaceAccessBanner
