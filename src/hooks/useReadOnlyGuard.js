import useWorkspaceStore from "@store/useWorkspaceStore"
import { toast } from "sonner"

export const useReadOnlyGuard = () => {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace)
  const isReadOnlyWorkspace = !!activeWorkspace

  const guardWrite = (fn) => {
    if (isReadOnlyWorkspace) {
      toast.error("This workspace is read-only — exit to your own workspace to make changes.")
      return
    }
    fn?.()
  }

  return { isReadOnlyWorkspace, guardWrite }
}
