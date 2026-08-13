import useWorkspaceStore from "@store/useWorkspaceStore"
import { toast } from "sonner"

export const READ_ONLY_MESSAGE =
  "This workspace is read-only — exit to your own workspace to make changes."

export const useReadOnlyGuard = () => {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace)
  const isReadOnlyWorkspace = !!activeWorkspace

  const guardWrite = (fn) => {
    if (isReadOnlyWorkspace) {
      toast.error(READ_ONLY_MESSAGE)
      return
    }
    fn?.()
  }

  /**
   * Props to spread onto any button/card that performs a write, so read-only mode is
   * visible up front (dimmed + not-allowed cursor + tooltip) rather than only surfacing
   * as a toast after the click.
   */
  const readOnlyProps = isReadOnlyWorkspace
    ? {
        "aria-disabled": true,
        title: READ_ONLY_MESSAGE,
        className: "opacity-50 cursor-not-allowed pointer-events-none",
      }
    : {}

  return { isReadOnlyWorkspace, guardWrite, readOnlyProps, readOnlyMessage: READ_ONLY_MESSAGE }
}
