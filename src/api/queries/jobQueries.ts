import { apiErrorMessage } from "@/types/api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getJobs,
  createJob,
  createJobFromRanking,
  updateJob,
  startJob,
  stopJob,
  deleteJob,
} from "@api/jobApi"
import { toast } from "sonner"
import { pushJobAgentCreationEvent } from "@utils/creationEvents"

export const useJobsQuery = (enabled: boolean = true) => {
  return useQuery({ queryKey: ["jobs"], queryFn: getJobs, enabled })
}

export const useCreateJobMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createJob,
    onSuccess: (data) => {
      pushJobAgentCreationEvent({ status: "success", job: data })
      toast.success("Job created successfully!")
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
    },
    onError: (error) => {
      pushJobAgentCreationEvent({ status: "error", error })
      toast.error(apiErrorMessage(error, "Failed to create job"))
    },
  })
}

export const useCreateJobFromRankingMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createJobFromRanking,
    onSuccess: () => {
      toast.success("Job created from audit!")
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Failed to create job from audit"))
    },
  })
}

export const useUpdateJobMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ jobId, jobPayload }: { jobId: string; jobPayload: unknown }) =>
      updateJob(jobId, jobPayload),
    onSuccess: () => {
      toast.success("Job updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
    },
    onError: (_error) => {
      toast.error("Failed to update job")
    },
  })
}

export const useToggleJobStatusMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ jobId, currentStatus }: { jobId: string; currentStatus: string }) => {
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
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Failed to delete job"))
    },
  })
}
