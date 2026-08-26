import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

/** The owner of a shared workspace this tab is currently watching. */
export interface Workspace {
  id: string
  name?: string
  email?: string
  avatar?: string
}

interface WorkspaceState {
  /** null means "my own workspace". */
  activeWorkspace: Workspace | null
  switchToWorkspace: (owner: Workspace) => void
  exitToOwnWorkspace: () => void
}

// Persisted to sessionStorage, not localStorage: "which workspace am I watching" is a
// per-tab fact, exactly like the active account in @utils/sessionStore. Putting it in
// localStorage would mean opening a collaborator's workspace in one tab silently scoped
// every other tab's requests (the X-Watch-As header) to that owner too.
// One-time cleanup of the pre-per-tab localStorage copy. Nothing reads it anymore, and
// leaving it would strand a "watching someone's workspace" flag that can never be exited.
try {
  localStorage.removeItem("workspace-access-storage")
} catch {
  /* ignore */
}

const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      activeWorkspace: null,

      switchToWorkspace: (owner) => set({ activeWorkspace: owner }),

      exitToOwnWorkspace: () => set({ activeWorkspace: null }),
    }),
    { name: "workspace-access-storage", storage: createJSONStorage(() => sessionStorage) }
  )
)

export default useWorkspaceStore
