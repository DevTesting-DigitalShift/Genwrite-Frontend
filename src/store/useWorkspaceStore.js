import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

const useWorkspaceStore = create(
  persist(
    (set) => ({
      activeWorkspace: null, // { id, name, email, avatar } | null — null means "my own workspace"

      switchToWorkspace: (owner) => set({ activeWorkspace: owner }),

      exitToOwnWorkspace: () => set({ activeWorkspace: null }),
    }),
    { name: "workspace-access-storage", storage: createJSONStorage(() => localStorage) }
  )
)

export default useWorkspaceStore
