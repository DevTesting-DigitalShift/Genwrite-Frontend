import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getJobs, createJob, updateJob, startJob, stopJob, deleteJob } from "@api/jobApi"
import toast from "@utils/toast"
import { pushToDataLayer } from "@utils/DataLayer"

export const useJobsQuery = (enabled = true) => {
  return useQuery({ queryKey: ["jobs"], queryFn: getJobs, enabled })
}

export const useCreateJobMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createJob,
    onSuccess: (data, variables) => {
      const { user } = variables // Assuming user is passed in variables or we get it from auth store
      // NOTE: DataLayer push might need user object.
      // If user is not in variables, we might need to handle it in the component or useAuthStore.

      toast.success("Job created successfully!")
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
    },
    onError: error => {
      toast.error(error?.response?.data?.message || "Failed to create job")
    },
  })
}

export const useUpdateJobMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ jobId, jobPayload }) => updateJob(jobId, jobPayload),
    onSuccess: () => {
      toast.success("Job updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
    },
    onError: error => {
      toast.error("Failed to update job")
    },
  })
}

export const useToggleJobStatusMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ jobId, currentStatus }) => {
      if (currentStatus === "active") {
        return stopJob(jobId)
      } else {
        return startJob(jobId)
      }
    },
    onSuccess: (_, variables) => {
      const { currentStatus } = variables
      toast.success(currentStatus === "active" ? "Job paused!" : "Job started!")
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
    },
    onError: () => {
      toast.error("Failed to update job status")
    },
  })
}

export const useDeleteJobMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteJob,
    onSuccess: () => {
      toast.success("Job deleted successfully!")
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
    },
    onError: error => {
      toast.error(error.response?.data?.message || "Failed to delete job")
    },
  })
}
