import { create } from "zustand"
import { devtools } from "zustand/middleware"

/** A scheduled generation job, as returned by the jobs API. */
export interface Job {
  _id?: string
  [key: string]: unknown
}

interface JobState {
  showJobModal: boolean
  selectedJob: Job | null

  openJobModal: (job?: Job | null) => void
  closeJobModal: () => void
  setSelectedJob: (job: Job | null) => void
  reset: () => void
}

const useJobStore = create<JobState>()(
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
