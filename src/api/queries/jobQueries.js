import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getJobs, createJob, updateJob, startJob, stopJob, deleteJob } from "@api/jobApi"
import { message } from "antd"
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

      message.success("Job created successfully!")
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
    },
    onError: error => {
      message.error(error?.response?.data?.message || "Failed to create job")
    },
  })
}

export const useUpdateJobMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ jobId, jobPayload }) => updateJob(jobId, jobPayload),
    onSuccess: () => {
      message.success("Job updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
    },
    onError: error => {
      message.error("Failed to update job")
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
      message.success(currentStatus === "active" ? "Job paused!" : "Job started!")
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
    },
    onError: () => {
      message.error("Failed to update job status")
    },
  })
}

export const useDeleteJobMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteJob,
    onSuccess: () => {
      message.success("Job deleted successfully!")
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
    },
    onError: error => {
      message.error(error.response?.data?.message || "Failed to delete job")
    },
  })
}
