import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

const useVerificationStore = create(
  persist(
    (set) => ({
      email: "",
      timerStartedAt: null, // timestamp in ms

      setEmail: (email) => set({ email }),
      
      setTimerStartedAt: (timestamp) => set({ timerStartedAt: timestamp }),
      
      clearVerificationState: () => set({ email: "", timerStartedAt: null }),
    }),
    {
      name: "verification-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export default useVerificationStore
