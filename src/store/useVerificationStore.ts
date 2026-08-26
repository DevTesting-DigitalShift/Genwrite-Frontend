import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

interface VerificationState {
  email: string
  /** Timestamp in ms, or null when no resend timer is running. */
  timerStartedAt: number | null

  setEmail: (email: string) => void
  setTimerStartedAt: (timestamp: number | null) => void
  clearVerificationState: () => void
}

const useVerificationStore = create<VerificationState>()(
  persist(
    (set) => ({
      email: "",
      timerStartedAt: null,

      setEmail: (email) => set({ email }),

      setTimerStartedAt: (timestamp) => set({ timerStartedAt: timestamp }),

      clearVerificationState: () => set({ email: "", timerStartedAt: null }),
    }),
    { name: "verification-storage", storage: createJSONStorage(() => localStorage) }
  )
)

export default useVerificationStore
