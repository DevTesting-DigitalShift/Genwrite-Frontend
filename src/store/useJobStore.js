import { create } from "zustand"
import { devtools } from "zustand/middleware"

const useJobStore = create(
  devtools(
    (set) => ({
      showJobModal: false,
      selectedJob: null,

      // Actions
      openJobModal: (job = null) => set({ showJobModal: true, selectedJob: job }),
      closeJobModal: () => set({ showJobModal: false, selectedJob: null }),
      setSelectedJob: (job) => set({ selectedJob: job }),

      // Cleared on account switch so a job modal state from the previous account
      // can't leak into the newly active one.
      reset: () => set({ showJobModal: false, selectedJob: null }),
    }),
    { name: "job-store" }
  )
)

export default useJobStore
