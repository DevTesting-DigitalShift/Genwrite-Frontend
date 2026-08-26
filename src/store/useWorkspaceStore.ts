import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

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

const useWorkspaceStore = create(
  persist(
    (set) => ({
      activeWorkspace: null, // { id, name, email, avatar } | null — null means "my own workspace"

      switchToWorkspace: (owner) => set({ activeWorkspace: owner }),

      exitToOwnWorkspace: () => set({ activeWorkspace: null }),
    }),
    { name: "workspace-access-storage", storage: createJSONStorage(() => sessionStorage) }
  )
)

export default useWorkspaceStore
