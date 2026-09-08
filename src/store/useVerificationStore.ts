import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

// The verify-email/resend-verification-email endpoints are auth-gated — the backend reads
// the target account off the bearer token, so this store only tracks the resend cooldown,
// not which email is being verified (that's always the logged-in user's own).
interface VerificationState {
  /** Timestamp in ms, or null when no resend timer is running. */
  timerStartedAt: number | null

  setTimerStartedAt: (timestamp: number | null) => void
  clearVerificationState: () => void
}

const useVerificationStore = create<VerificationState>()(
  persist(
    (set) => ({
      timerStartedAt: null,

      setTimerStartedAt: (timestamp) => set({ timerStartedAt: timestamp }),

      clearVerificationState: () => set({ timerStartedAt: null }),
    }),
    { name: "verification-storage", storage: createJSONStorage(() => localStorage) }
  )
)

export default useVerificationStore
