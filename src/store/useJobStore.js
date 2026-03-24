import { create } from "zustand"
import { devtools } from "zustand/middleware"

const useJobStore = create(
  devtools(
    set => ({
      showJobModal: false,
      selectedJob: null,

      // Actions
      openJobModal: (job = null) => set({ showJobModal: true, selectedJob: job }),
      closeJobModal: () => set({ showJobModal: false, selectedJob: null }),
      setSelectedJob: job => set({ selectedJob: job }),
    }),
    { name: "job-store" }
  )
)

export default useJobStore
